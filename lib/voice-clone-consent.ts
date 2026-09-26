import crypto from 'node:crypto';
import { z } from 'zod';

/**
 * Autorización para clonar una voz — el requisito que hace legal la clonación.
 *
 * POR QUÉ EXISTE
 * --------------
 * Una voz clonada es dato biométrico sensible (Ley 1581 de 2012, art. 5). La
 * autorización solo es válida si la da el TITULAR de la voz: la sede no puede
 * consentir en nombre de su empleado ni de su socio. Lo que sí puede hacer la
 * sede es ser la BENEFICIARIA: "esta voz se usa para el asistente de MI sede".
 *
 * Eso es exactamente lo que se registra aquí:
 *   - Titular    → quién autoriza (persona, con su documento)
 *   - Beneficiario → la sede que usa la voz
 *   - Evidencia  → hash del audio de la autorización + del audio de la muestra
 *   - Revocación → cómo se retira y qué pasa con el clon
 *
 * QUÉ PROTEGE Y QUÉ NO
 * --------------------
 * SÍ protege: poder demostrar ante un tercero (titular, autoridad, cliente)
 * que la persona autorizó, para qué, cuándo y con qué alcance; y tener el
 * proceso para honrar la revocación borrando el clon.
 *
 * NO protege por sí solo: NO autoriza a clonar la voz de un tercero (eso
 * requiere su autorización, no la de la sede), NO habilita suplantar a nadie
 * (prohibido en los términos) y NO reemplaza la revisión de un abogado.
 *
 * POR QUÉ NO GUARDAMOS EL AUDIO DE LA AUTORIZACIÓN
 * -------------------------------------------------
 * Guardarlo convertiría a Upway en custodio de una biométrica. Con el hash
 * SHA-256 basta para probar que el audio existió y no se alteró, sin que
 * jamais almacenemos la voz de la persona. El audio viaja, se hashea y se
 * descarta en la misma petición.
 *
 * Esto no es asesoría legal. Es el registro técnico que el área legal puede
 * sustentar; la redacción final la debe revisar un abogado.
 */

/** Versión del texto leído: permite demostrar qué se leyó en cada autorización. */
export const CONSENT_SCRIPT_VERSION = 'v1-2026-09';

/**
 * Párrafo de autorización. Se lee EN VOZ ALTA y se graba: ese audio es la
 * prueba. Se lee antes que la muestra para que quede al principio de la
 * grabación y no se pueda recortar.
 */
export function buildConsentScript(input: {
  consentingName: string;
  businessName: string;
  document?: string | null;
}): string {
  const nombre = (input.consentingName ?? '').trim() || '[mi nombre]';
  const sede = (input.businessName ?? '').trim() || '[la sede]';
  const doc = (input.document ?? '').trim();
  const identidad = doc ? `, identificado con el documento ${doc}` : '';
  return (
    `Yo, ${nombre}${identidad}, autorizo de forma libre, previa, informada e inequívoca ` +
    `a Upway y a ${sede} a utilizar la grabación de mi voz para crear una voz sintética ` +
    `que represente al asistente de la sede, durante la vigencia de esta relación comercial. ` +
    `Entiendo que la voz clonada es una aproximación estadística y no una copia, ` +
    `que será usada únicamente para atender y agendar, y que no puede usarse para suplantar ` +
    `a mí ni a terceros. Sé que esta voz es un dato sensible, que Upway actúa como encargado ` +
    `del tratamiento y que puedo revocar este consentimiento en cualquier momento ` +
    `escribiendo a la sede, lo que elimina la voz clonada.`
  );
}

/**
 * Párrafo de muestra para el clon. Corto a propósito: el modelo que usamos
 * (Qwen3TTS) recorta solo a 10 segundos, así que leer más es tiempo perdido.
 */
export function buildSampleScript(input: { name?: string | null; businessName?: string | null }): string {
  const nombre = (input.name ?? '').trim() || 'su asesor';
  const sede = (input.businessName ?? '').trim() || 'la empresa';
  return (
    `Buenos días, le habla ${nombre}, de ${sede}. ` +
    `Le recuerdo que su cita es el martes quince a las nueve de la mañana. ` +
    `Puede confirmar su asistencia al cuatro diez, doscientos veintidós mil. Gracias.`
  );
}

/** Ideal del modelo Qwen3TTS: 5–10 s. Más no es mejor. */
export const CLONE_IDEAL_SECONDS = { min: 5, max: 10 };
/** Cortes de seguridad para no gastar tiempo ni cuota en una grabación inútil. */
export const CLONE_HARD_SECONDS = { min: 2, max: 60 };

/** Datos que acompañan a cada clon. El nombre de la persona es obligatorio. */
export const cloneConsentSchema = z.object({
  consentingName: z.string().trim().min(2, 'Escribe el nombre de quien autoriza').max(120),
  consentingDocument: z.string().trim().max(40).optional(),
  purpose: z.string().trim().min(3).max(200).optional(),
});

export type CloneConsent = z.infer<typeof cloneConsentSchema>;

/** Hash SHA-256 en hex. Es la evidencia: prueba existencia e integridad. */
export function hashAudio(bytes: ArrayBuffer | ArrayBufferView): string {
  // Acepta ArrayBuffer (como devuelve File.arrayBuffer) y vistas tipadas
  // (Uint8Array) sin copiar de más ni leer fuera del rango real.
  const buf = ArrayBuffer.isView(bytes)
    ? Buffer.from(bytes.buffer as ArrayBuffer, bytes.byteOffset, bytes.byteLength)
    : Buffer.from(bytes);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/** Finalidad por defecto cuando la sede no escribe una. */
export function defaultPurpose(businessName?: string | null): string {
  const sede = (businessName ?? '').trim() || 'la sede';
  return `Agente de voz de ${sede}: atender llamadas, informar y agendar.`;
}
