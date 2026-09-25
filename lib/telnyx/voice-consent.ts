/**
 * Consentimiento y aviso de privacidad en la voz (Ley 1581 de 2012).
 *
 * Dos controles distintos y ambos obligatorios:
 *
 * 1. AVISO EN EL CANAL. La politica de tratamiento de Upway dice que la
 *    autorizacion se informa y recoge "al inicio de la llamada/conversacion;
 *    la grabacion y el transcript son evidencia". El aviso viaja en el
 *    `greeting` del AI Assistant de Telnyx, asi que TODA llamada atendida por
 *    el agente lo escucha antes de que empiece a recoger datos.
 *
 * 2. CONSENTIMIENTO PREVIO PARA MARCAR. `POST /api/voice/calls` dispara una
 *    llamada saliente a un numero arbitrario. Marcar a alguien sin su
 *    consentimiento previo es un riesgo directo de Ley 1581 (y de campanas de
 *    marcacion), por eso el endpoint exige `consent: true` explicito.
 *
 * No es asesoria legal: es el freno tecnico que exige el area legal
 * (REPORTES/LEGAL-POLITICA-TRATAMIENTO-BORRADOR.md, seccion 4).
 */

/** Limite real de Telnyx para `greeting` (ver upsertAssistantForTienda). */
export const TELNYX_GREETING_MAX = 500;

/**
 * Aviso que encabeza cada conversacion atendida por el agente.
 * Corto a proposito: tiene que sonar natural en el primer segundo de llamada.
 */
export const VOICE_PRIVACY_NOTICE =
  'Aviso: esta llamada puede ser grabada y transcrita para prestarte el servicio y dejar constancia de lo acordado. ' +
  'Si no autorizas el tratamiento de tus datos, indicalo y finalizamos.';

/** Mensaje de error cuando falta el consentimiento para marcar. */
export const CALL_CONSENT_REQUIRED_MESSAGE =
  'Debes confirmar que el destino autorizo ser llamado y el tratamiento de sus datos (Ley 1581) antes de iniciar una llamada.';

/**
 * Saludo del asistente: aviso de privacidad + presentacion.
 * El aviso va primero y nunca se recorta; si el total excede el limite de
 * Telnyx se acorta la presentacion, nunca el aviso.
 */
export function buildVoiceGreeting(input: {
  agentName: string;
  businessName: string;
}): string {
  const agentName = input.agentName.trim() || 'el equipo';
  const businessName = input.businessName.trim() || 'Upway';

  const notice = VOICE_PRIVACY_NOTICE;
  const presentation =
    `Hola, soy ${agentName}, de ${businessName}. ` +
    'Te ayudo con consultas, agenda y seguimiento. ¿En qué te puedo ayudar hoy?';

  if (notice.length + 1 + presentation.length <= TELNYX_GREETING_MAX) {
    return `${notice} ${presentation}`;
  }

  const room = TELNYX_GREETING_MAX - notice.length - 1;
  const trimmed = presentation.slice(0, Math.max(0, room - 1)).trimEnd();
  return `${notice} ${trimmed}…`;
}
