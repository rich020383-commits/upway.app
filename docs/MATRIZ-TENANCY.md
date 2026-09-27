# Tenancy y control de acceso

Auditoría 2026-09 · pase 3.

Pregunta que se verifica en cada ruta: **¿el tenant se deriva de la sesión, o
acepta un identificador de la petición?** Lo segundo es acceso a datos de otro
cliente. Y cuando el tenant sí se valida, la pregunta siguiente es si los
*recursos* referenciados por id (un lead, una conversación) pertenecen a ese
tenant: validar la puerta no sirve si la llave abre otro cuarto.

---

## 1. Base ya sólida (sin cambios necesarios)

`getOwnedTienda` (`lib/session.ts:76`) es el patrón correcto y está bien aplicado:

- siempre filtra por `userId` derivado del JWT firmado, nunca del cuerpo;
- si llega un `tiendaId`, exige **además** la pertenencia (`{ id, userId }`);
- falla cerrado con 404 (no 403, para no confirmar existencia de lo ajeno);
- bloquea explícitamente al `meta-reviewer` (id que no existe en `User`).

Cobertura verificada: **ninguna** ruta de `app/api/business/*` ni de
`app/api/voice/*` queda sin `getSessionUser`/`getOwnedTienda`. Las de voz
(`calls`, `clones`, `agents`, `authorizations`, `voices`) acotan todas por
`userId`, incluidas las que tocan datos biométricos.

`requireAdmin` (`lib/admin-guard.ts`) también es correcto: sesión válida **y**
email en la lista de `ADMIN_EMAILS`.

---

## 2. Hallazgo T1 — IDOR de escritura cruzada entre inquilinos

**Archivo:** `lib/business-ops.ts:360` (`createAppointmentFromLead`)

Era:

```ts
let lead = params.leadId ? await prisma.lead.findUnique({ where: { id: params.leadId } }) : null;
```

`findUnique` por id, **sin `tiendaId`**. La ruta que la llama
(`app/api/business/appointments`) valida correctamente la tienda, así que a
primera vista parecía segura; el agujero estaba un nivel más abajo, en la función
de negocio.

### Impacto

La cadena completa, no solo una fuga:

1. `POST /api/business/appointments` con `{ tiendaId: miTienda, leadId: <ajeno> }`.
2. La tienda se valida ✅, pero el lead se carga sin filtro ❌.
3. Se crea una cita en **mi** tienda con `leadId` del lead ajeno.
4. `PATCH` la confirma → `confirmAppointment` hace
   `lead.update({ where: { id: appointment.leadId } })`: **cambia el estado y
   `lastContactAt` de un lead de otro cliente.**
5. Además le cuelga `createLeadPipelineActivity` y `createFollowUpReminder`.

El paso 5 agrava el caso: `LeadActivity` y `LeadReminder` **no tienen columna de
tenant** (heredan la del lead), así que la escritura aterrizaba en el timeline del
otro cliente. No era lectura, era **escritura**.

### Corrección aplicada

- El lead y la conversación se resuelven con `findFirst({ id, tiendaId })`.
- Si el body trae un `leadId` explícito que no es de este tenant, **se dice**
  (`Lead no encontrado para esta tienda`) en vez de crear en silencio un lead
  duplicado que escondería lo ocurrido.
- El `conversationId` que queda en la cita se revalida; si no es del tenant, se
  guarda `null` en vez del id ajeno.
- Defensa en profundidad en `confirmAppointment`: el `lead.update` pasa a
  `updateMany({ id, tiendaId })`. Si algún camino futuro volviera a meter un lead
  ajeno, la escritura no sale.

**Regresión:** `lib/business-ops.test.ts` (5 tests). Comprobado que fallan con el
código vulnerable (2 de 5 en rojo) y pasan con la corrección.

---

## 3. Hallazgo T2 — relay de correo abierto

**Archivo:** `app/api/health/notify/route.ts` (POST)

El comentario del archivo afirmaba:

> "la autenticación la cubre el middleware (proxy.ts) para /health/*"

Es **falso**, y justo al revés. `proxy.ts:74-77` deja pasar `/api/health/*` sin
sesión a propósito ("Permitir rutas API de health sin sesión"). La ruta tampoco
llamaba a `getSessionUser`. El único otro filtro era el de origen, que no sirve
como control de acceso por dos motivos independientes:

- `if (origin && !allowedOrigins.some(...))` — **sin cabecera `Origin` el chequeo
  no se ejecuta**. Un `curl` o cualquier script lo salta entero.
- La lista incluye `` `https://${host}` ``, y `host` sale de la cabecera `Host`
  que envía el cliente: es una comprobación autorreferencial.

### Impacto

El endpoint envía dos correos con la cuenta de Upway:

- el aviso interno al equipo de activación, con contenido del atacante;
- el **ACK al cliente**, a `str(formData.contactEmail)` — **la dirección que
  elige quien llama** — con el nombre y la clínica que también elige.

O sea: un **relay de correo abierto** con remitente legítimo (phishing y daño a
la reputación del dominio) y, en paralelo, inundación del buzón interno. Sin
sesión y **sin rate limit**, no había nada que lo frenara.

### Corrección aplicada

- Exige sesión con `getHealthSession` (la página `/health/onboarding` ya la
  tiene y manda `credentials: 'include'`, así que el uso legítimo no se rompe).
- Cuota de 5 notificaciones por minuto y usuario. La clave es el usuario, no la
  IP: `x-forwarded-for` lo falsifica quien llama, y el propio `lib/rate-limit.ts`
  advierte de eso. Así una sesión comprometida tampoco inunda buzones.
- El chequeo de origen se conserva, etiquetado como anti-CSRF y **no** como
  autenticación, para que nadie vuelva a confiar en él.

**Regresión:** `app/api/health/notify/route.test.ts` (3 tests). Comprobado que
fallan con el código vulnerable (2 de 3 en rojo) y pasan con la corrección.

---

## 4. Observaciones sin cambios (no son bugs)

- **`processDueReminders`** tiene un filtro de tenant *opcional* en
  `lib/business-ops.ts:567`: sin `tiendaId` procesa recordatorios de todas las
  tiendas. Pero **no tiene ningún llamador**: es código muerto, así que hoy no es
  un riesgo. Si algún día se conecta a un cron, hay que exigir el tenant.
- **`assignLeadToUser`** no valida el tenant por dentro (`tx.lead.update` por
  `id`), pero sus dos llamadores (`app/api/business/leads`, `lib/autopilot`)
  validan antes. Riesgo residual, no bug vivo.
- **`ADMIN_EMAILS` no está en `.env`.** Como `isAdminEmail` compara contra una
  lista vacía, las rutas de administración (`test-email`, `test-notify`) quedan
  cerradas con 403 siempre. Falla cerrado, así que no es una falla de seguridad,
  pero impide probarlas en local. Hay que verificar que sí esté definida en
  Render.
- **`TELNYX_PUBLIC_KEY` sí está** en `.env`: la verificación de firma Ed25519 del
  webhook está activa. Sin ella, el webhook rechazaría todo en producción.

---

## Método y límites

- Se revisaron las 24 rutas bajo `app/api/business/`, `app/api/voice/` y
  `app/api/health/`, más los helpers `lib/session.ts`, `lib/admin-guard.ts`,
  `lib/business-ops.ts` y `proxy.ts`.
- Los dos hallazgos se confirmaron leyendo la cadena completa (ruta → helper →
  mutación) y no solo la puerta de entrada. En ambos casos la ruta validaba el
  tenant correctamente y el defecto estaba más adentro, que es justo lo que un
  chequeo de superficie no encuentra.
- **Sin verificación en ejecución**: no hay navegador, ni logs de Render, ni
  acceso a la base de producción. T1 y T2 están cubiertos por tests que se
  comprobaron en rojo contra el código vulnerable, pero no se intentaron de
  verdad contra el despliegue.