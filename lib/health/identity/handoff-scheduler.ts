import { runHandoffDrain } from '@/lib/health/identity/handoff-drain';

/**
 * Scheduler interno del drenaje de entregas push (identidad conforme).
 *
 * Motivo de existir: el drenaje nació como cron externo (Render/n8n), pero eso
 * exige configuración manual en el panel. Este scheduler corre dentro del
 * propio proceso (`instrumentation.ts` → `register()`), así que se activa con
 * un simple deploy y no depende de ningún servicio externo.
 *
 * El endpoint HTTP con `x-upway-cron-secret` sigue existiendo y sigue
 * protegido: sirve para disparos manuales o externos. Este scheduler no pasa
 * por HTTP ni necesita el secreto — es la misma función en el mismo proceso.
 *
 * Supuestos operativos (verificados en producción):
 *  - Una sola instancia de servicio (`WEB_CONCURRENCY=1` en Render).
 *  - `NODE_ENV=production` en Runtime: los gates impiden armar el timer en
 *    dev, en tests y durante `next build` (los workers de build no deben
 *    drenar nada).
 *  - Los timers se `unref()` para nunca mantener vivo un proceso que de otra
 *    forma terminaría (build workers, cierre ordenado).
 */
export const HANDOFF_SCHEDULER_INITIAL_DELAY_MS = 60_000; // dejar calentar el servidor y la BD
export const HANDOFF_SCHEDULER_INTERVAL_MS = 5 * 60_000;

interface SchedulerEnv {
  NODE_ENV?: string;
  NEXT_PHASE?: string;
  NEXT_RUNTIME?: string;
}

/** Puro y testeable: ¿en este entorno el scheduler debe armar su timer? */
export function resolveHandoffSchedulerMode(env: SchedulerEnv): 'off' | 'on' {
  if (env.NEXT_RUNTIME === 'edge') return 'off'; // Prisma es de Node
  if (env.NEXT_PHASE === 'phase-production-build') return 'off'; // nunca drenar durante `next build`
  if (env.NODE_ENV !== 'production') return 'off'; // ni dev ni test
  return 'on';
}

let draining = false;
let timerArmed = false;

/**
 * Arma el drenaje periódico. Devuelve `true` si quedó armado.
 * Idempotente: una segunda llamada en el mismo proceso no duplica timers.
 */
export function startHandoffScheduler(env: SchedulerEnv = process.env): boolean {
  if (resolveHandoffSchedulerMode(env) !== 'on') return false;
  if (timerArmed) return true;

  const run = async (): Promise<void> => {
    if (draining) return; // solape: una corrida larga no acumula pilas
    draining = true;
    try {
      const result = await runHandoffDrain();
      if (result.scanned > 0) {
        console.log(
          `[handoff-scheduler] scanned=${result.scanned} delivered=${result.delivered} retried=${result.retried} failed=${result.failed}`,
        );
      }
    } catch (error) {
      console.error('[handoff-scheduler] drenaje falló:', error);
    } finally {
      draining = false;
    }
  };

  const armUnref = (timer: NodeJS.Timeout): void => {
    if (typeof timer.unref === 'function') timer.unref();
  };

  armUnref(
    setTimeout(() => {
      void run();
      armUnref(setInterval(() => void run(), HANDOFF_SCHEDULER_INTERVAL_MS));
    }, HANDOFF_SCHEDULER_INITIAL_DELAY_MS),
  );

  timerArmed = true;
  console.log(
    `[handoff-scheduler] activo: primera corrida en ${HANDOFF_SCHEDULER_INITIAL_DELAY_MS / 1000}s, después cada ${HANDOFF_SCHEDULER_INTERVAL_MS / 60000} min`,
  );
  return true;
}
