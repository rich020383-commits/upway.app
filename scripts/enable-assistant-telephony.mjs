/**
 * Activa el cierre instantáneo de la demo: `conversation_ended_full_history`
 * (y los message history updates) en el AI Assistant (Sophie).
 *
 * POR QUÉ EXISTE: la cuenta solo emite `assistant.initialization`. Sin el
 * evento `call.conversation.ended`, el panel de /demo no puede cerrarse al
 * instante al colgar — queda el fallback por inactividad (2 min). Estos
 * settings NO existen en la interfaz del portal: son solo vía API sobre el
 * objeto del asistente (confirmado por soporte Telnyx, oct-2026).
 *
 * Uso:
 *   node --env-file=.env scripts/enable-assistant-telephony.mjs
 *
 * NO imprime secretos: solo el assistant id (no es secreto) y los flags.
 */

const API = 'https://api.telnyx.com/v2';
const KEY = process.env.TELNYX_API_KEY ?? '';
const ASSISTANT_ID = (process.env.TELNYX_AI_ASSISTANT_ID ?? '').trim();

if (!KEY || !ASSISTANT_ID) {
  console.error(
    'Faltan TELNYX_API_KEY o TELNYX_AI_ASSISTANT_ID.\n' +
      'Corre el script con: node --env-file=.env scripts/enable-assistant-telephony.mjs'
  );
  process.exit(1);
}

// 1) POST: aplicar telephony_settings (POST actualiza el asistente, mismo
//    patrón que updateAssistantVoice en lib/telnyx/client.ts).
const post = await fetch(`${API}/ai/assistants/${encodeURIComponent(ASSISTANT_ID)}`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    telephony_settings: {
      conversation_ended_full_history: true,
      send_message_history_updates: true,
    },
  }),
});
const postBody = await post.json().catch(() => ({}));
if (!post.ok) {
  const detail = postBody?.errors?.[0]?.detail ?? JSON.stringify(postBody).slice(0, 300);
  console.error(`POST /ai/assistants/{id} -> HTTP ${post.status}: ${detail}`);
  process.exit(1);
}
console.log('POST OK: telephony_settings enviados.');

// 2) GET: verificar que quedó persistido en el asistente.
const get = await fetch(`${API}/ai/assistants/${encodeURIComponent(ASSISTANT_ID)}`, {
  headers: { Authorization: `Bearer ${KEY}` },
});
const verify = await get.json().catch(() => ({}));
const settings =
  verify?.data?.telephony_settings ?? verify?.telephony_settings ?? null;

console.log(`Assistant: ${ASSISTANT_ID}`);
console.log(
  'telephony_settings:',
  settings ? JSON.stringify(settings, null, 2) : '(el GET no devolvió telephony_settings — revisa la respuesta cruda si falla la demo)'
);

if (settings && settings.conversation_ended_full_history === true) {
  console.log(
    '\nOK: conversation_ended_full_history = true.\n' +
      'Al colgar una llamada de demo llegará call.conversation.ended al webhook y\n' +
      'el panel se cerrará AL INSTANTE (el fallback por inactividad queda como red de seguridad).'
  );
} else {
  console.log('\nAVISO: no se pudo confirmar conversation_ended_full_history en el GET.');
}