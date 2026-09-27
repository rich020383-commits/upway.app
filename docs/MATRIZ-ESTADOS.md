# Matriz de transiciones de estado

Auditoría 2026-09 · pase 2 (máquina de estados).

Regla que se verifica en cada tabla: **todo estado que el sistema consume tiene
un productor alcanzable**. Un estado que el código lee, muestra o usa como
condición, pero que nadie puede escribir, es un callejón sin salida: la pantalla
tiene una etiqueta para un caso que no puede ocurrir, y quien lo consulta se
apoya en una garantía que el sistema no da.

`P` = productor (quién lo escribe) · `C` = consumidor (quién lo lee).

---

## 1. VerticalOnboardingStatus — Center / Inmobiliaria

| Estado | P | C | Veredicto |
|---|---|---|---|
| `DRAFT` | `app/api/onboarding/route.ts:251` | `case-status.tsx`, `case-access.ts:57` | ok |
| `IN_PROGRESS` | `app/api/onboarding/route.ts:250` | `case-status.tsx` | ok |
| `PENDING_REVIEW` | `app/api/onboarding/route.ts:246` | `case-status.tsx`, `case-access.ts:57` | ok |
| `APPROVED` | `app/api/vertical/activate/route.ts:133` | **`case-access.ts:30`** (abre la voz) | ok |
| `ACTIVE` | `app/api/vertical/activate/route.ts:202` | **`case-access.ts:30`** (abre la voz) | ok |
| `NEEDS_CHANGES` | — | `case-status.tsx:81` (etiqueta + "Editar y reenviar") | **sin productor** |
| `BLOCKED` | — | `case-status.tsx:99` | **sin productor** |
| `ARCHIVED` | — | `case-status.tsx` | **sin productor** |

**Lo que sí importa y está bien:** los dos estados que abren permisos de voz
(`APPROVED`, `ACTIVE`) tienen productor real, y ambos están en
`REVIEW_LOCKED_STATUSES` (`app/api/onboarding/route.ts:42-47`), así que un cliente
que reenvíe el wizard no degrada un caso ya aprobado.

### Hallazgo V1 — el embudo vertical no tiene salida de rechazo

Health sí la tiene: `app/api/health/approvals/route.ts:220-222` produce
`BLOCKED` (rechazo) y `NEEDS_CHANGES` (pedir ajustes).

En Center/Inmobiliaria **no existe equivalente**. Del `PENDING_REVIEW` la única
salida es aprobar (`vertical/activate`). Consecuencias:

- Si el equipo revisa un caso vertical y decide que no, **no hay forma de
  registrarlo**: queda en "En revisión" para siempre, y el cliente ve un estado
  que nunca cambia.
- El equipo de revisión no tiene herramienta: tendría que tocar la base a mano.
- `case-status.tsx:340` ya ofrece el enlace "Editar y reenviar" para
  `NEEDS_CHANGES`, y ese texto **nunca se va a ver**.

No es un bug de seguridad (es un estado que restringe, no que abre), es un hueco
operativo. Corrección propuesta: dar a `POST /api/vertical/activate` una acción
de rechazo, con la misma protección de token interno que ya tiene, escribiendo
`NEEDS_CHANGES` o `BLOCKED`. No se implementó en este pase por ser una
funcionalidad nueva y no un defecto.

---

## 2. HealthOnboardingStatus — Health

| Estado | P | C | Veredicto |
|---|---|---|---|
| `DRAFT` | `register/route.ts:101`, `health/onboarding:124,134` | `lib/health/data.ts:75` | ok |
| `IN_PROGRESS` | derivado del paso, `health/onboarding:193` | `activation.ts:125` | ok |
| `PENDING_REVIEW` | `health/onboarding:193` | `activation.ts:125` | ok |
| `NEEDS_CHANGES` | `health/approvals:222`, `health/onboarding:198` | aprobaciones | ok |
| `APPROVED` | `health/approvals:360` | **`case-access.ts:29`** | ok — **solo servidor** |
| `ACTIVE` | `health/activate:217` | **`case-access.ts:29`** | ok — **solo servidor** |
| `BLOCKED` | `health/approvals:222` | aprobaciones | ok |
| `TESTING`, `PAUSED`, `ARCHIVED` | — | solo el type union | sin productor (inerte) |

### Hallazgo H1 — CRÍTICO: el cliente podía auto-aprobarse

Este es el hallazgo del pase 2 y el más grave de la auditoría.

`app/api/health/onboarding/route.ts:173` hacía:

```ts
const status = String(body.status ?? getHealthStatusForStage(normalizedStep));
```

El `status` venía **del cuerpo de la petición**, que controla el cliente. Lo único
protegido era `ACTIVE` (la línea siguiente). Con ello, cualquier clínica
autenticada podía hacer:

```
POST /api/health/onboarding
{ "currentStep": "clinic-setup", "status": "APPROVED", "formData": {} }
```

y escribirse `APPROVED` a sí misma. Y `APPROVED` es exactamente lo que
`lib/case-access.ts:29` trata como aprobado, lo que abre en `voice-access.ts:48`:

```ts
canClone: true,      // biometría de una voz + costo del proveedor
canProvision: true,  // encender un asistente
canCall: true,       // llamadas telefónicas reales
```

O sea: **clonar voces, aprovisionar el asistente y hacer llamadas reales sin
aprobación comercial ni pago.** El candado de `voice-access.ts` sí existía y
funcionaba; el problema es que la llave que lo abría era escribible por el
cliente. El candado estaba en la puerta correcta, pero la puerta se podía abrir
a pulso.

Alcance real: **auto-aprobación únicamente**, no de terceros. El `clinicId` sale
del contexto autenticado y nunca del cuerpo (ya corregido en una auditoría
anterior), así que una clínica no puede aprobar la de otro.

**Corrección aplicada.** El estado se deriva en el servidor con lista blanca:

```ts
const pedido = String(body.status) as HealthOnboardingStatus;
const status = CLIENT_SETTLEABLE_STATUSES.has(pedido)
  ? pedido
  : getHealthStatusForStage(normalizedStep);
```

`CLIENT_SETTLEABLE_STATUSES` (`lib/health/onboarding.ts:45`) admite solo
`DRAFT`, `IN_PROGRESS`, `PENDING_REVIEW` y `NEEDS_CHANGES` — lo único que el
wizard legítimo necesita pedir. `APPROVED`, `ACTIVE`, `TESTING`, `PAUSED`,
`BLOCKED` y `ARCHIVED` quedan fuera y los decide Upway. `NEEDS_CHANGES` entra a
propósito porque solo restringe: pedir cambios sobre lo propio no abre ningún
permiso. El freno de `ACTIVE` se conserva como segunda barrera.

Regresión cubierta en `app/api/health/onboarding/route.test.ts` (7 tests): un
cliente que mande `APPROVED`, `ACTIVE` (incluso con `approval: true`) o cualquiera
de los estados reservados no consigue escribirlos, mientras que
`PENDING_REVIEW` y `NEEDS_CHANGES` siguen funcionando.

La vertical nunca tuvo este bug: `app/api/onboarding/route.ts:245-251` deriva el
estado del `submit` y del paso, sin leer `body.status`.

---

## 3. HealthOnboardingStepStatus — tabla `HealthOnboardingStep`

| Estado | P | C | Veredicto |
|---|---|---|---|
| los 7 valores | — | — | **tabla sin usar** |

Existe la tabla `HealthOnboardingStep` y el enum con 7 valores (`NOT_STARTED`,
`IN_PROGRESS`, `COMPLETE`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `BLOCKED`),
con su clave foránea e índices. **Ninguna línea de código de la aplicación la lee
o escribe**: cero referencias fuera de `prisma/schema.prisma` y las migraciones.

### Hallazgo H2 — superficie muerta en el esquema

El progreso por paso se lleva en un único par de la sesión
(`currentStep: String` + `status`), no en filas. El enum sugiere un seguimiento
por paso con aprobación y rechazo propios que **no existe**. No es un bug de
ejecución (nada lee la tabla, así que no puede dar datos falsos), pero es una
mina: el esquema promete granularidad que la aplicación no tiene.

Pendiente de decisión: eliminar la tabla o cablearla de verdad. Requiere
migración, así que no se tocó en este pase.

---

## 4. Facturación y agenda

| Máquina | Sin productor | Nota |
|---|---|---|
| `BillingAccessState` | `PAUSED`, `SUSPENDED`, `CANCELLED` | `lib/billing/access.ts:83` mapea a `'suspended'` en texto libre, no al enum. Inerte. |
| `ActivationPaymentStatus` | `EXPIRED`, `CANCELLED` | Bold nunca notifica esos estados. Inerte. |
| `WaitlistStatus` | `EXPIRED`, `CANCELLED` | Inerte. |
| `LeadStatus` | `ARCHIVED` | **sí se usa como filtro** en `business/dashboard/route.ts:97`, pero nada lo escribe: los leads ganados y perdidos nunca se archivan, así que el filtro nunca descarta nada. Impacto bajo (contadores), no bloqueante. |

Ninguno de estos rompe un flujo: son estados que el esquema permite y la
aplicación no exercise. Se listan para que no se interpreten como funcionalidad
disponible.

---

## Método y límites

- Búsqueda estática sobre los 355 archivos `.ts/.tsx` del repositorio, cruzando
  cada valor de enum contra el esquema de Prisma.
- La tabla `HealthOnboardingStep` y los estados sin productor se confirman por
  ausencia de referencias, no por lectura de todos los call sites.
- **No se pudo comprobar en ejecución**: no hay navegador, ni logs de Render, ni
  acceso a la base de producción. El alcance de H1 está verificado por lectura
  del código y cubierto con tests, pero no con un intento real de auto-aprobación
  contra producción.