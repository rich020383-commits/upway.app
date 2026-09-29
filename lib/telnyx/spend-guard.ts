import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { UPWAY_INTERNAL_REVIEW_EMAIL } from '@/lib/activation';

/**
 * Freno de gasto de voz por tenant.
 *
 * POR QUE EXISTE
 * --------------
 * El costo real esta en `LlamadaLog.telnyxCost` y corre a ~$0.1225 USD/min
 * todo-in (ver lib/telnyx/costs.ts). Telnyx NO ofrece un tope mensual en el
 * portal, y su "daily spend limit" vive en Outbound Voice Profiles: aplica a
 * llamadas SALIENTES, mientras que el 100% de la exposicion de Upway es
 * INBOUND. Un dia con 10.000 minutos son ~$1.225 USD, unos $3,8 millones de
 * pesos. Ese es el escenario que este modulo corta.
 *
 * POR QUE DOS ESCALONES Y NO UN CORTE DURO
 * --------------------------------------
 * El primer umbral AVISA y el segundo BLOQUEA, y el bloqueo ocurre sobre la
 * ACTIVACION de una linea, no sobre las llamadas en curso. Colgarle el
 * servicio a una clinica que esta pagando por un error nuestro es un dano
 * mayor que el gasto. El bloqueo de activacion impide que el problema crezca
 * y deja la decision de cortar en manos de una persona.
 *
 * UMBRALES
 * ---------
 *  - Advierte: ~4.000 min/mes. Varias veces el consumo esperado de un plan.
 *  - Bloquea:  ~16.000 min/mes. Claramente un bug, no uso real.
 * Se ajustan por env si el volumen cambia.
 */

/** Costo al mes a partir del cual se avisa. */
const WARN_USD = Number(process.env.SPEND_GUARD_WARN_USD ?? 500);
/** Costo al mes a partir del cual se bloquea la activacion de lineas. */
const BLOCK_USD = Number(process.env.SPEND_GUARD_BLOCK_USD ?? 2000);
/** Tope global de la empresa, por si el fallo es sistematico y afecta a varios. */
const BLOCK_ALL_USD = Number(process.env.SPEND_GUARD_BLOCK_ALL_USD ?? 6000);
/** Se repite el aviso maximo una vez por ventana para no inundar el correo. */
const REAVISO_MS = Number(process.env.SPEND_GUARD_REAVISO_MS ?? 6 * 60 * 60 * 1000);

export type SpendState = 'ok' | 'advierte' | 'bloquea';

export type SpendAssessment = {
  state: SpendState;
  spentUSD: number;
  warnUSD: number;
  blockUSD: number;
  totalUSD: number;
  /** Motivo del bloqueo, para poder comunicarlo sin inventar nada. */
  motivo: string | null;
};

const inicioDeMes = (now = new Date()): Date =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));

/** Suma de `telnyxCost` del mes en curso, para un tenant o para todos. */
export async function gastoVozDelMes(opts: { tiendaId?: string } = {}): Promise<number> {
  const agg = await prisma.llamadaLog.aggregate({
    where: { ...(opts.tiendaId ? { tiendaId: opts.tiendaId } : {}), createdAt: { gte: inicioDeMes() } },
    _sum: { telnyxCost: true },
  });
  return agg._sum.telnyxCost ?? 0;
}

/**
 * Evalua el gasto del mes. `bloquea` solo cuando se supera el tope: nunca
 * se corta una llamada en curso desde aqui, esto es una precondicion para
 * activar o ampliar lineas.
 */
export async function evaluarGastoVoz(tiendaId: string): Promise<SpendAssessment> {
  const [spent, total] = await Promise.all([gastoVozDelMes({ tiendaId }), gastoVozDelMes()]);

  let state: SpendState = 'ok';
  let motivo: string | null = null;
  if (spent >= BLOCK_USD) {
    state = 'bloquea';
    motivo = `El tenant supero el tope de USD ${BLOCK_USD} en consumo de voz este mes.`;
  } else if (total >= BLOCK_ALL_USD) {
    state = 'bloquea';
    motivo = `El consumo de voz de toda la plataforma supero el tope global de USD ${BLOCK_ALL_USD}.`;
  } else if (spent >= WARN_USD) {
    state = 'advierte';
  }

  return { state, spentUSD: spent, warnUSD: WARN_USD, blockUSD: BLOCK_USD, totalUSD: total, motivo };
}

const htmlAlerta = (a: SpendAssessment, tiendaNombre: string) => `
  <p>Se detecto consumo de voz alto en <strong>${tiendaNombre}</strong>.</p>
  <ul>
    <li>Consumo del tenant este mes: <strong>USD ${a.spentUSD.toFixed(2)}</strong></li>
    <li>Consumo total de la plataforma: USD ${a.totalUSD.toFixed(2)}</li>
    <li>Umbral de aviso: USD ${a.warnUSD}</li>
    <li>Umbral de bloqueo: USD ${a.blockUSD}</li>
  </ul>
  <p>${a.motivo ?? 'Se supero el umbral de aviso; no se bloqueo nada.'}</p>
  <p>Revisa si hay un bucle de llamadas entrantes antes de ampliar lineas.</p>`;

/**
 * Avisa por correo. Nunca lanza: un fallo de SMTP no debe tumbar la activacion
 * de una linea que si se puede dejar funcionando.
 */
export async function avisarGastoVoz(
  a: SpendAssessment,
  tiendaNombre: string,
  to: string
): Promise<void> {
  if (a.state === 'ok') return;
  const asunto =
    a.state === 'bloquea'
      ? `[Upway] Consumo de voz BLOQUEADO — ${tiendaNombre}`
      : `[Upway] Consumo de voz alto — ${tiendaNombre}`;
  const cuerpo = a.motivo ?? `Consumo de USD ${a.spentUSD.toFixed(2)} este mes.`;
  try {
    await sendEmail({ to, subject: asunto, html: htmlAlerta(a, tiendaNombre), text: cuerpo });
  } catch (error) {
    console.error('[spend-guard] no se pudo enviar el aviso:', error);
  }
}

export { REAVISO_MS, UPWAY_INTERNAL_REVIEW_EMAIL };
