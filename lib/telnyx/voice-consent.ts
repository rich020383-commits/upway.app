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
 * Minimización de datos para el guion del asistente.
 *
 * El transcript completo viaja a la red de Telnyx (ASR + LLM + TTS ahí mismo,
 * sin terceros). Reducir lo que sale por el prompt baja el volumen de dato
 * sensible expuesto, sin tocar arquitectura.
 *
 * OJO — la excepción de identidad es obligatoria y no es negociable: el
 * catálogo cerrado exige "pida la cédula dígito a dígito y repita el número
 * completo para confirmar" y la relectura es lo que da valor probatorio al
 * registro conforme (Res. 866/2021). Una regla de minimización a secas
 * rompería la captura de identidad en silencio. Por eso la excepción dice
 * explícitamente que PREVALECE.
 *
 * La distinción que sostiene todo: el ORIGEN del dato nunca es el dictado
 * libre (`NEVER_FROM_TRANSCRIPTION`), pero la RELECTURA sí es obligatoria.
 * Una cosa no es la otra.
 *
 * No es asesoría legal: es el freno técnico que exige el área legal.
 */
export const AGENT_DATA_MINIMIZATION = [
  'REGLA DE MINIMIZACION DE DATOS (aplica en toda la conversacion SALVO el paso de identidad):',
  '- No repitas el nombre completo ni el numero de documento, salvo que estes dentro del paso de captura de identidad.',
  '- Refierete a la persona como "su", "el paciente" o "la paciente".',
  '- No resumas ni repitas el motivo de la consulta mas alla de lo necesario para responder.',
  '- No leas ni escribas ningun dato de identidad que no te hayan pedido en el paso de identidad.',
  '',
  'EXCEPCION OBLIGATORIA — PASO DE CAPTURA DE IDENTIDAD (PREVALECE sobre todo lo anterior):',
  'Cuando tu guion ordene capturar un documento (cedula, registro, pasaporte, etc.), SIEMPRE lee el numero COMPLETO en voz alta, digito a digito si el catalogo lo indica, y pide confirmacion explicita del titular antes de cerrar el paso. Esto es una obligacion legal (Res. 866/2021): omitir la relectura deja el registro sin valor probatorio.',
  'Recuerda: el numero NUNCA se toma del dictado libre. Llega del catalogo cerrado o digito a digito; la relectura es la confirmacion, no el origen.',
].join('\n');

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

/** Limite real de Telnyx para `instructions` (ver upsertAssistantForTienda). */
export const TELNYX_INSTRUCTIONS_MAX = 8000;

/**
 * Compone las instrucciones del asistente: cabecera de contexto + regla de
 * minimizacion + guion del cliente.
 *
 * El recorte se come del GUION DEL CLIENTE, nunca de la regla: si el guion
 * llega al limite de Telnyx, lo que se pierde es texto opcional del cliente
 * (con la marca de corte visible), no el freno de minimizacion. Sin este
 * helper, anteponer la regla al principio hacia que el `slice(0, 8000)` del
 * cliente cortara por el final y la regla quedara descuadrada.
 */
export function buildAgentInstructions(input: {
  businessName: string;
  nicho: string;
  tiendaId: string;
  reglas: string;
}): string {
  const header = `(Negocio: ${input.businessName} | Nicho: ${input.nicho} | TiendaId: ${input.tiendaId})\n`;
  const head = `${header}\n${AGENT_DATA_MINIMIZATION}\n\nGUION DEL NEGOCIO:\n`;
  const room = TELNYX_INSTRUCTIONS_MAX - head.length;
  const reglas = input.reglas.trim();
  if (room <= 0) return head.trimEnd();
  if (reglas.length <= room) return `${head}${reglas}`;
  return `${head}${reglas.slice(0, room - 1).trimEnd()}…`;
}
