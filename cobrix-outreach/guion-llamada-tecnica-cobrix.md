# Guion — Llamada técnica Barakah Tech Hub × Cobrix

**Objetivo:** demostrar que conocemos el dominio de Cobrix (cobranza recurrente) de primera mano, mostrar el stack técnico, y cerrar con un siguiente paso concreto (demo técnica / piloto).

**Duración objetivo:** 30 min · **Participantes:** Sophia (CEO) + CTO por nuestra parte; tech lead / fundador por Cobrix.

---

## 1. Apertura (2 min)

> "Gracias por el tiempo. Soy [nombre], de Barakah Tech Hub. Hicimos esta llamada porque no venimos a venderles humo: construimos **Upway**, un sistema de cobranza recurrente para negocios de suscripción, que es el mismo problema de fondo que resuelve Cobrix. En 25 minutos queremos mostrarles cómo lo resolvimos y escuchar cómo lo resuelven ustedes, para ver dónde encajamos."

**Chequeo rápido:** ¿quién es el perfil técnico en la llamada? ¿qué rol tiene cada uno?

## 2. Contexto de Upway (5 min)

Cuéntalo como arquitectura, no como marketing:

- **Dominio:** vencimientos recurrentes, notificaciones, seguimiento de pagos, analíticas de impago — construido para clínicas, centros de salud, IPS y negocios en general.
- **Backend:** TypeScript · Node.js · PostgreSQL. Procesos asíncronos: workers con colas para vencimientos y recordatorios programados, reintentos con backoff, idempotencia en los flujos de cobro.
- **Frontend:** React / Next.js — dashboards operativos (pipeline de cobros, estado de cada cliente, historial de contactos).
- **IA en producción:** analíticas de pago con modelos de IA; mensajería conversacional por WhatsApp y voz (Vapi) para seguimiento y confirmación de citas/pagos.

**Frases clave que hay que decir sí o sí:**
- "Nuestros recordatorios no son cron jobs ingenuos: son colas con estados (PENDING/SENT/FAILED), reintentos y auditoría por lead."
- "Todo el ciclo de cobro queda trazado en un timeline por cliente — sabés qué pasó, cuándo y quién."

## 3. Preguntas para ellos (10 min) — dejar que hablen

1. ¿Cómo disparan hoy los vencimientos y las notificaciones? (¿cron, colas, terceros?)
2. ¿Qué pasarela(s) de pago usan y cómo manejan webhooks/reintentos?
3. ¿Cómo reducen el impago hoy? ¿Hay seguimiento conversacional (WhatsApp) o solo notificaciones?
4. ¿Dónde les duele más: cobertura técnica, velocidad de desarrollo, o casos borde de clientes?
5. ¿Usan IA en algún punto del flujo, o lo tienen en el roadmap?
6. ¿Qué módulos o integraciones demandan más los clientes y no pueden cubrir a tiempo?

> **Escucha activa:** anotar cada dolor. Cada dolor = oportunidad de cooperación.

## 4. Mapeo Upway → dolores de Cobrix (5 min)

Repetir SUS dolores y responder con experiencia concreta nuestra:

| Dolor típico | Nuestra respuesta |
|---|---|
| "Los webhooks de pago a veces se duplican o se pierden" | "En Upway tratamos cada webhook como idempotente y con registro auditable — pasa lo mismo en cobranza." |
| "No tenemos tiempo para armar el módulo X" | "Ese módulo ya lo construimos en Upway con el mismo stack: reutilización casi directa." |
| "El seguimiento de morosos es manual" | "Lo automatizamos con recordatorios programados + WhatsApp conversacional con IA." |

## 5. Modelos de cooperación (3 min)

Presentar los tres, dejar que ellos elijan:

1. **Integración de producto** — los clientes de Cobrix reciben el módulo de cobranza/IA de Upway como add-on.
2. **Desarrollo conjunto** — co-construimos el módulo que a ellos les falta; compartimos IP o costo.
3. **Capacidad técnica dedicada** — nuestro equipo extiende al de Cobrix en features puntuales.

## 6. Cierre y siguiente paso (2 min)

> "Te propongo algo concreto: te preparo en [X días] una demo técnica de 20 minutos — flujos de cobro, workers, y el agente de WhatsApp funcionando en vivo. ¿Te sirve [fecha/hora]?"

**Compromisos al colgar:**
- [ ] Enviar one-pager en PDF hoy.
- [ ] Agendar demo técnica con fecha concreta.
- [ ] Nombre + contacto del titular técnico anotado.

---

## Manejo de objeciones

| Objeción | Respuesta |
|---|---|
| "Ya tenemos equipo de desarrollo" | "Perfecto — no venimos a reemplazarlos. Ofrecemos módulos ya construidos en su mismo stack para que el equipo no empiece de cero." |
| "Es un momento malo / sin presupuesto" | "Los modelos 1 y 3 son por proyecto y sin costo fijo mensual. Arrancaríamos solo con el módulo que más les duele." |
| "¿No es competencia con Upway?" | "Upway atiende clínicas, centros de salud, IPS y negocios generales; Cobrix atiende su mercado. Somos complementarios — y el stack es el mismo, así que la cooperación es barata." |
| "Mándanos info y te aviso" | "Con gusto — y te dejo una demo grabada de 5 min para que la veas cuando puedas. ¿Te parece que hablemos 15 min la semana que viene?" |

## Notas previas a la llamada

- [ ] Probar demo de Upway ANTES (que la primera demo en vivo no sea con el cliente).
- [ ] Tener abierto: dashboard de cobranza + un flujo de recordatorio + agente de WhatsApp.
- [ ] Conocer: sitio de Cobrix, sus módulos públicos, 2-3 posibles dolores.
- [ ] Cámara + micro OK, entorno silencioso.
