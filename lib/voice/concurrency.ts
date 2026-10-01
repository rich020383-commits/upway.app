import { prisma } from '@/lib/prisma';
import { getHealthPlan } from '@/lib/health/plans-enterprise';
import { parseSessionForm } from '@/lib/health/session-form';

/**
 * TOPE DE LLAMADAS SIMULTANEAS POR TENANT
 * =======================================
 *
 * Los planes prometen `concurrentCalls` (2, 5, 20, 60, 100) y ese numero se
 * publica en `/precios`, en el plan-picker y se lo cuenta Sophie. Hasta ahora
 * NADA lo imponia: no habia contador, no habia tope, no habia alerta.
 *
 * El limite real de la cuenta Telnyx es GLOBAL y arranca en 2 (o 10 tras
 * verificacion de nivel 2), asi que dos clinicas podian compartirse ese techo y
 * la tercera llamada se caia con `403 User channel limit exceeded D1` sin aviso.
 * Telnyx no ofrece segregacion por cliente: el tope por plan lo ponemos nosotros.
 *
 * DECISION: BLOQUEAR, CON ALERTA PREVIA
 * Un plan que no se cumple es una promesa falsa. Se bloquea al llegar al tope,
 * y el umbral de aviso SIEMPRE cae por debajo de el — incluso en planes de 2,
 * donde el 80% estricto ya seria el propio tope. Preferible cortar una llamada
 * de prueba que incumplir un SLA contratado.
 *
 * LO QUE ESTO NO HACE
 * Solo controla lo que Upway dispara (`POST /api/voice/calls`). La llamada
 * ENTRANTE la contesta el asistente configurado en Telnyx: el webhook responde
 * `{received: true}` y no instrucciones de Call Control, asi que no puede
 * impedir que entre. Aqui se cuenta tambien la entrada, para que la alerta
 * llegue a tiempo; cerrarla exige un cambio de arquitectura aparte.
 */

/** Llamadas mas viejas que esto ya no cuentan (si se perdio el `hangup`). */
export const VENTANA_ACTIVA_MIN = 30;

/**
 * Techo cuando no se resuelve el plan del tenant. No es un invento: es el
 * limite inicial de toda cuenta Telnyx, o sea lo que la cuenta da HOY.
 * Falla hacia el lado seguro en lugar de prometer capacidad inexistente.
 */
export const LIMITE_FALLBACK = 2;

/** Fraccion del tope a partir de la cual se avisa. */
export const UMBRAL_ALERTA = 0.8;

/**
 * Estados que cierran una llamada, tal como los documenta el propio modelo en
 * `prisma/schema.prisma`. `initiated` NO esta: es el estado con el que se crea
 * y cuenta como activa.
 */
const ESTADOS_TERMINALES = ['completed', 'failed', 'no_answer'];

export type EstadoCapacidad = {
  /** Llamadas en curso ahora mismo. */
  activas: number;
  /** Tope efectivo del tenant. */
  limite: number;
  /** Cuantas llamadas mas caben. */
  holgura: number;
  /** No cabe ni una mas: hay que bloquear. */
  bloqueado: boolean;
  /** Se cruzo el umbral de aviso. */
  alerta: boolean;
  /** A partir de cuantas activas se avisa (nunca por encima del tope). */
  umbralAlerta: number;
  /** Uso del tope en %, para mensajes. */
  pct: number;
};

/**
 * Decision pura, sin base de datos, para poder testear el umbral.
 *
 * `activas` son las llamadas en curso SIN incluir la que se intenta abrir:
 * `bloqueado === true` significa "esta nueva no cabe".
 */
export function evaluarCapacidad(activas: number, limite: number): EstadoCapacidad {
  // Ojo con el orden: `Math.floor(-1) || 2` devuelve -1 (verdadero), no 2, y un
  // tope negativo o cero bloquearia TODA llamada. Se valida explicitamente.
  const bruto = Math.floor(limite);
  const tope = Number.isFinite(bruto) && bruto > 0 ? bruto : LIMITE_FALLBACK;
  const enCurso = Math.max(0, Math.floor(activas) || 0);
  // En un plan de 2 el 80% estricto seria el tope y no habria aviso previo:
  // floor hace que el aviso llegue siempre antes que el bloqueo.
  const umbral = Math.max(1, Math.floor(tope * UMBRAL_ALERTA));
  return {
    activas: enCurso,
    limite: tope,
    holgura: Math.max(0, tope - enCurso),
    bloqueado: enCurso >= tope,
    alerta: enCurso >= umbral,
    umbralAlerta: umbral,
    pct: Math.round((enCurso / tope) * 100),
  };
}

/** Llamadas abiertas y todavia sin cerrar para este tenant. */
export async function llamadasActivas(tiendaId: string): Promise<number> {
  const desde = new Date(Date.now() - VENTANA_ACTIVA_MIN * 60_000);
  return prisma.llamadaLog.count({
    where: {
      tiendaId,
      createdAt: { gte: desde },
      status: { notIn: ESTADOS_TERMINALES },
    },
  });
}

/**
 * `concurrentCalls` del plan contratado por el tenant.
 *
 * El plan no vive en `Tienda`: se guarda como JSON en
 * `HealthOnboardingSession.notes` bajo la clave `planId`. Si no hay clinica,
 * no hay sesion o el plan no resuelve, se cae a `LIMITE_FALLBACK` — el techo
 * real de la cuenta, no capacidad imaginaria.
 */
export async function limiteDeTenant(tiendaId: string): Promise<number> {
  try {
    const tienda = await prisma.tienda.findUnique({
      where: { id: tiendaId },
      select: { clinicId: true },
    });
    if (!tienda?.clinicId) return LIMITE_FALLBACK;

    const sesion = await prisma.healthOnboardingSession.findFirst({
      where: { clinicId: tienda.clinicId },
      orderBy: { updatedAt: 'desc' },
      select: { notes: true },
    });
    const form = parseSessionForm(sesion?.notes);
    const planId = typeof form.planId === 'string' && form.planId ? form.planId : null;
    const plan = getHealthPlan(planId);
    return plan ? Math.max(1, plan.concurrentCalls) : LIMITE_FALLBACK;
  } catch (err) {
    console.error('[capacidad] sin plan resuelto, se usa el limite de cuenta', err);
    return LIMITE_FALLBACK;
  }
}

/** Cuenta + tope + decision en una sola llamada. */
export async function capacidadDe(tiendaId: string): Promise<EstadoCapacidad> {
  const [activas, limite] = await Promise.all([
    llamadasActivas(tiendaId),
    limiteDeTenant(tiendaId),
  ]);
  return evaluarCapacidad(activas, limite);
}

/** Mensaje que ve el operador cuando se corta. */
export function mensajeDeBloqueo(estado: EstadoCapacidad): string {
  return (
    `Tope de llamadas simultaneas alcanzado (${estado.activas}/${estado.limite}). ` +
    'Se libera en cuanto cuelgue una. Si necesitas mas capacidad, sube de plan.'
  );
}
