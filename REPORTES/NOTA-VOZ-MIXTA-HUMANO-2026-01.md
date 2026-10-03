# NOTA DE VIABILIDAD — Voz mixta humano + IA sobre Telnyx

**Fecha:** enero 2026
**Estado:** verificación contra documentación oficial de Telnyx. **No es asesoría legal.**
**Relacionado:** `lib/telnyx/client.ts`, `app/api/voice/webhooks/route.ts`, `lib/voice/concurrency.ts`, `REPORTES/NOTA-INTEGRACION-SALUD-2026-09.md`, `REPORTES/LEGAL-DPA-PLANTILLA-BORRADOR.md`

---

## 0. Pregunta

¿Puede llegar a nuestro servidor el contenido de una llamada **en curso**, para que un humano documente o atienda en paralelo, **sin reconstruir lo que Telnyx ya nos da**?

**Respuesta: Sí.** Hay 4 vías documentadas, de menor a mayor coste. Y —hallazgo principal— **el modo mixto (humano e IA en la misma llamada) es nativo de la plataforma**, no hay que inventarlo.

Marcas de esta nota: ✅ = leído en la documentación oficial · ⚠️ = **no verificado**, requiere prueba o confirmación.

---

## 1. Punto de partida verificado en nuestro código

| Hecho | Evidencia |
|---|---|
| Hoy el asistente contesta dentro de Telnyx; nuestro webhook solo ve **ciclo de vida** (`call.initiated`, `call.hangup`) | `app/api/voice/webhooks/route.ts` |
| Solo exponemos **2 comandos** sobre una llamada viva | `lib/telnyx/client.ts`: `speakOnCall`, `hangupCall` |
| **No** hay `answer`, `transfer`, `streaming_start`, `ai_assistant_start`, `transcription_start` | búsqueda en `lib/telnyx/client.ts` |
| El asistente se crea con `voice_settings.voice` y se activa por `/ai/assistants` | `lib/telnyx/client.ts` (rutas corregidas en auditoría) |

**Consecuencia:** hoy no podemos leer la conversación ni intervenirla. El "copiloto" no es un problema de IA; es un problema de **no controlar la llamada**.

---

## 2. La pieza que faltaba: `ai_assistant_start`

✅ `POST /calls/{call_control_id}/actions/ai_assistant_start`

Es un **comando de Call Control**, es decir, se envía sobre una llamada que **nosotros** hemos contestado. Parámetros relevantes:

| Parámetro | Para qué |
|---|---|
| `participants: [{ id, role, name, onHangup }]` | **Varios participantes con rol.** `onHangup: "continue_conversation"` → al colgar un participante, la conversación sigue |
| `message_history: []` | Arrancar con contexto previo |
| `send_message_history_updates` | Recibir el historial **durante** la llamada |
| `transcription: { model, language }` | STT de la conversación |
| `interruption_settings: { enable }` | Interrupción (barge-in) |
| `greeting`, `assistant_id`, `voice`, `tools` | Config del asistente |

**Devuelve `conversation_id`.** Webhooks esperados: `call.conversation.ended` y ✅ **`call.conversation_insights.generated`**.

Y hay un comando hermano que cierra el círculo del humano-en-el-loop:

✅ `POST /calls/{call_control_id}/actions/ai_assistant_add_messages`
→ `messages: [{ role: "system", content: "..." }]`, `trigger_response: false`
→ **Un operador humano inyecta una instrucción o una frase al asistente en vivo.** Advertencia textual de la doc: *"may interrupt a user who is still speaking"*.

> Esto es el "sistema mixto" de la estrategia: **el humano no reemplaza al bot, lo pilota.** Y está documentado como comando, no como hipótesis.

---

## 3. Las 4 vías de datos (menor → mayor coste)

| # | Vía | Mecanismo | Qué recibimos | Latencia | Coste |
|---|---|---|---|---|---|
| 1 | **Insights post-llamada** | Webhook de la pestaña *Insights* del asistente + Conversations API | Resumen, sentimiento, campos personalizados, transcripción | Al colgar | ✅ incluido en el asistente |
| 2 | **Historial en vivo** | `ai_assistant_start` con `send_message_history_updates: true` | Turnos *usuario/assistant* en vivo | Segundos | ⚠️ confirmar |
| 3 | **Transcripción en vivo (STT)** | `transcription_start` | Texto con `interim_results` (engine A) o más preciso y barato (engine B) | Tiempo real | ✅ **$0.025/min** (Telnyx) · **$0.050/min** (Google) |
| 4 | **Audio crudo bidireccional** | `streaming_start` → `wss://` | Audio base64 (RTP), pista `inbound_track`/`both_tracks` | Tiempo real | ⚠️ no publicado |

### 3.1 Detalle de la vía 3 — STT nativo

✅ `transcription_start` acepta: `transcription_engine` (**A** = Google, único con `interim_results`; **B** = Telnyx, *"more accurate and less costly"*), `transcription_tracks` (`inbound` / `outbound` / `both`), `language`.
✅ Alerta de coste no obvio: si configuras un timeout de grabación por silencio, **Telnyx activa STT solo para detectar el silencio y lo factura igual**. Hay que contarlo en el presupuesto.

### 3.2 Detalle de la vía 4 — Media streaming

✅ `POST /calls/{call_control_id}/actions/streaming_start`. Parámetros verificados:
`stream_url`, `stream_track` (`inbound_track` / `outbound_track` / `both_tracks`), `stream_codec` (`PCMA`…), `stream_bidirectional_mode: "RTP"`, `stream_bidirectional_codec` (`G722`…), `stream_bidirectional_sampling_rate` (`16000`…), `stream_bidirectional_target_legs` (`both`), `stream_auth_token`, `client_state`, `command_id`.

✅ Se puede pedir también en el `dial` (campo `stream_url`) o en el `answer`.
✅ El fork **no degrada la llamada** (Telnyx duplica el medio; el receptor secundario *"never occupies the call stream"*).
✅ Devolver audio: `{ "event": "media", "media": { "payload": "<mp3 base64>" } }`, **máximo 1 payload por segundo**. Otros frames: `clear`, `mark`, `dtmf`, `error`.

⚠️ **La vuelta es mp3, no RTP.** Inyectar la voz de un humano por aquí exigiría transcodificar. Para voz humana real, el camino correcto es `transfer` (§4).

### 3.3 Vía extra — Conversation Relay

✅ Con `conversation_relay_start`, **Telnyx hace STT y TTS** y nuestra app recibe frames `prompt` (texto del llamante) y responde `text`. Frames: `prompt`, `dtmf`, `interrupt`, `error` ↔ `text`, `play`, `sendDigits`, `language`, `end`. Webhook `call.conversation.ended`.
→ Da el **texto en vivo sin que nosotros toquemos audio**. Alternativa directa a la vía 3 si el asistente nativo se queda corto.

### 3.4 Vía de producto nuevo — Asistente por WebSocket, sin telefonía

✅ `wss://api.telnyx.com/v2/ai/assistants/{assistant_id}/conversation`
Audio PCM16 desde web/móvil/kiosco, **sin número telefónico ni coste de PSTN**. Eventos `conversation.item.input_audio_transcription.completed`, `response.audio.delta`.
→ Habilita un canal nuevo (app, navegador, kiosco) con **la misma config del asistente**. Pertinente para Colombia: kioscos en EPS, bancos, alcaldías.

---

## 4. Transferencia a humano (el desborde)

✅ `POST /calls/{call_control_id}/actions/transfer` → `to` acepta **número humano o `sip:`**, más `from`, `webhook_url`, `timeout_secs`.
✅ **Fallback documentado:** *"If the transfer is unsuccessful… The original call will remain active and may be issued additional commands, potentially transferring the call to an alternate destination."* → se puede **reintentar a un segundo humano** sin perder al llamante.
✅ Webhooks: `call.initiated`, `call.bridged` (Leg B), `call.answered` o `call.hangup`.

> Esto es lo que convierte el tope de canales en una promesa cumplible: con IA + una línea de desborde, **"ninguna llamada se pierde"** deja de ser marketing.

---

## 5. Conversations API (auditoría y explotación del dato)

✅ Base `/ai/conversations`: `GET` lista conversaciones, `GET` una conversación, `GET /{id}/messages`, `GET /{id}/insights`, `GET` insights agregados, `PUT` metadatos.
✅ **Insight templates**: `POST /ai/conversations/insights` con `instructions`, `name`, **`json_schema`** y **`webhook`** → **el insight se entrega a nuestro endpoint con el esquema que definamos**.
→ Esto convierte la llamada en **dato estructurado auditable** (encaja con la tesis de identidad conforme de la vertical salud).
→ ⚠️ Al ser datos en la nube de Telnyx, el DPA debe declarar este flujo y fijar retención (ver `REPORTES/LEGAL-DPA-PLANTILLA-BORRADOR.md`).

---

## 6. Lo que esto cambia en el diseño de Upway

| Hoy | Con `answer` + `ai_assistant_start` |
|---|---|
| El asistente contesta solo; para nosotros es ciego | Nosotros contestamos y arrancamos el asistente |
| No se puede leer la conversación | `transcription_start` / `send_message_history_updates` / insights |
| El humano queda fuera | `participants` con rol + `ai_assistant_add_messages` + `transfer` |
| Promesa "ninguna llamada se pierde" no cumplible a 2 canales | El humano absorbe el pico |

**Funciones nuevas a añadir a `lib/telnyx/client.ts`** (mismo patrón que `speakOnCall` / `hangupCall`):
`answerCall` · `startAiAssistant` · `addAiAssistantMessages` · `transferCall` · `startTranscription` · `startStreaming`.

Y todo comando nuevo **debe** pasar por el control de concurrencia y de gasto ya existentes (`lib/voice/concurrency.ts`, `lib/telnyx/spend-guard.ts`) — no son caminos paralelos.

---

## 7. Riesgos y límites honestos

1. **Adoptar Call Control propio implica contestar nosotros.** Si hoy el número entra directo al asistente, migrar puede exigir reprovisionar el número. ⚠️ No verificado contra la cuenta real.
2. **`id` vs `call_control_id` sigue sin verificar con una llamada real** (bloqueador abierto de la sesión anterior). Sin eso, no se toca `app/api/voice/webhooks/route.ts`.
3. **El canal bidireccional devuelve audio en mp3, no RTP.** No es la vía para inyectar voz humana; para eso, `transfer`.
4. **Streaming, relay y STT consumen del mismo cupo** de concurrencia y presupuesto. El tope no desaparece por tener más comandos.
5. **Amplía el tratamiento de datos**: mandar audio/texto crudo a nuestro servidor es un flujo nuevo que el DPA debe declarar (Ley 1581, art. 26; Res. 866 donde aplique).
6. **Coste oculto documentado**: el timeout de grabación por silencio dispara STT y **se factura**.
7. **Los insights/conversaciones quedan alojados en Telnyx** → declarar retención y borrado.

---

## 8. Recomendación por fases

| Fase | Alcance | Coste / riesgo | Dependencia |
|---|---|---|---|
| **0 — Verificación** | 1 llamada real: confirmar `id` vs `call_control_id`, y los nombres exactos de los webhooks de historial/transcripción | Casi nulo | Nada |
| **1 — MVP honesto** | `ai_assistant_start` con `send_message_history_updates` + insight webhook → documentar a agenda. **Sin tocar audio.** | Bajo | Fase 0 |
| **2 — Copiloto en vivo** | `transcription_start` + panel de operador; `ai_assistant_add_messages` para intervenir; `transfer` para desborde | Medio | Fase 1 + decisión de SKU |
| **3 — Opcional** | Audio crudo (`streaming`) solo si se necesita el **timbre** y no el texto | Alto | Fase 2 con demanda comprobada |

**No construir la Fase 3 para resolver un problema de la Fase 2.** Es el error clásico: la vía más potente es la más cara y la que más trabajo cuesta reconstruir.

---

## 9. Decisión abierta

> **Nada de esto se implementa antes de la Fase 0.**

La pregunta que decide si esto es producto o manifiesto no es técnica: **¿algún cliente paga por el desborde humano y por la documentación de la llamada?** Si la respuesta es sí, la Fase 1 es baratísima y se puede lanzar ya. Si es no, esto se queda como nota y no se toca código.