# 📋 Reporte de Auditoría Técnica — upway-app

**Fecha:** {{date}}
**Alcance:** Estructura del proyecto, seguridad (autenticación/autorización/webhooks), calidad de código, configuración y lint.
**Método:** Revisión manual de código fuente + ejecución de ESLint acotado (`app/api`, `lib`, `auth.ts`).
**Resumen:** 13 hallazgos — 5 críticos, 5 altos, 3 medios. Lint: 20 errores.

---

## 🔴 HALLAZGOS CRÍTICOS

### C1. Credenciales reales en `.env` local
- **Archivo:** `.env` (líneas 4–64)
- **Detalle:** contiene URL de Neon con contraseña (`npg_...`), tokens de WhatsApp/Meta, Google, Vapi, Bold, Groq, Mistral, OpenRouter, Cerebras, SambaNova, LinkedIn y secretos de OAuth.
- **Riesgo:** fuga total de infraestructura si el archivo se comparte o quedó en el historial de Git.
- **Acción:** verificar `git log --all -- .env`; si estuvo versionado alguna vez, **rotar todas las llaves**.

### C2. Contraseña fija en código (backdoor de revisor)
- **Archivo:** `app/api/auth/login/route.ts:23`
- **Detalle:** credenciales `revisor_meta@upway.business` / `MetaReview2026` hardcodeadas, con prioridad máxima sobre la validación normal.
- **Riesgo:** cualquiera que obtenga el código compilado obtiene acceso privilegiado.
- **Acción:** mover a variable de entorno con hash, o rol en base de datos.

### C3. Endpoints de mutación sin autenticación (IDOR masivo)
| Endpoint | Problema |
|---|---|
| `app/api/tienda/toggle-ai/route.ts:6-16` | Cualquiera pausa/reactiva la IA de **cualquier tienda** enviando `tiendaId`. |
| `app/api/tienda/aprovisionar/route.ts:10-98` | Acepta `userId` del cliente y crea/actualiza tiendas arbitrarias sin sesión. |
| `app/api/meta/callback/route.ts:105-130` | Sin `tienda_id` hace `findFirst()` (primera tienda de la BD) y le escribe el token; acepta `metaAccessToken` crudo. |
| `app/api/tienda/config/route.ts:17` | Actualiza cualquier tienda por ID sin sesión. |
| `app/api/inbox/route.ts:8` | Autoriza por `?email=`: cualquiera lee conversaciones ajenas; el POST usa tokens del cliente. |
| `app/api/checkout/route.ts:5-16` | El **precio del pago** llega del frontend; se pueden crear links de Bold con monto arbitrario. |

- **Acción:** aplicar `auth()` (ya existe en `auth.ts:27`, HMAC firmado) a todos estos routes y validar pertenencia (`tienda.userId === session.user.id`). En checkout, calcular el precio server-side según el `plan`.

### C4. Hash de contraseñas débil (SHA-256 + salt de `Math.random`)
- **Archivo:** `lib/auth-utils.ts:3-17`
- **Detalle:** salt no criptográfico y una sola pasada de SHA-256. Nota: `register/route.ts:26` y `login/route.ts:33` ya usan bcrypt correctamente.
- **Acción:** eliminar `auth-utils.ts` y unificar todo a bcrypt.

### C5. Webhooks sin verificación de firma
- **Archivos:** `app/api/webhook/route.ts:16` (Meta POST), `app/api/vapi/webhook/route.ts:13`, `app/api/webhook/neon/route.ts:6`
- **Detalle:** el webhook de Meta valida el verify token en GET pero no el header `X-Hub-Signature-256` en POST; Vapi y Neon no validan nada.
- **Riesgo:** inyección de mensajes falsos al pipeline de IA/CRM y registros financieros (`LlamadaLog`) falsos.
- **Acción:** validar firma HMAC de Meta con `META_APP_SECRET`; secret compartido para Vapi/Neon.

---

## 🟠 HALLAZGOS ALTOS

### A6. Estado en memoria (no persistente y global)
- **Archivo:** `lib/app-state.ts:52-53`
- **Detalle:** usuarios y productos en arrays en memoria; los datos se pierden al reiniciar y comparten pool entre tenants, aunque Prisma ya tiene los modelos `Producto`/`User`.
- **Acción:** migrar los flujos de inventario/auth-demo a Prisma + Neon.

### A7. Datos demo y fallbacks peligrosos
- `lib/app-state.ts:22-29`: usuario demo `demo@upway.app` / `upway123`.
- `app/api/inventario/route.ts:6,15` y `[id]/route.ts:6`: `tiendaId` por defecto `'1172769935927318'` (un phone ID de Meta, no una tienda).
- `lib/whatsapp.ts:393`: `telefonoAdmin` de respaldo fijo `573116778098` en handoffs.
- `app/api/meta/callback/route.ts:77`: PIN de registro fijo `'123456'`.

### A8. Errores silenciados
- `lib/whatsapp.ts:361-363` (catch vacío en status de Meta), `app/api/meta/callback/route.ts:91-99` (registro de línea "no crítico"), `auth.ts:56-58` (parseo de sesión sin log).

### A9. Caché FAQ global sin aislamiento por tenant
- **Archivo:** `lib/whatsapp.ts:127,187`
- **Detalle:** `FAQ_CACHE` compartida entre tiendas; se limpia completa al llegar a 200 entradas (posible fuga de respuestas entre tenants).

### A10. Código muerto en callback de Google
- **Archivo:** `app/api/integraciones/google/callback/route.ts:14`
- **Detalle:** módulo deprecado que solo registra un log pero mantiene la ruta OAuth activa (superficie de ataque innecesaria). Desactivar la ruta.

---

## 🟡 HALLAZGOS MEDIOS

### M11. Configuración duplicada/incoherente
- `.env:4` vs `.env:66`: dos `DATABASE_URL` (directo y pooler) — gana el último.
- `prisma/schema.prisma:5-8` no declara `directUrl` pese a usar pooler (`pgbouncer=true`): agregar `directUrl = env("DIRECT_URL")` para migraciones.
- `NEXTAUTH_URL=https://upway.business` vs `NEXT_PUBLIC_APP_URL=http://localhost:3000` en el mismo `.env`.
- `.env.example` tiene 5 variables frente a ~20 usadas por el código.

### M12. PrismaClient por route en vez del singleton
- `app/api/tienda/config/route.ts:4`, `app/api/auth/register/route.ts:6`, `app/api/tienda/aprovisionar/route.ts:5` crean su propio cliente; `lib/prisma.ts` ya existe. En `aprovisionar` el global solo se guarda si NODE_ENV≠production → fuga de conexiones en producción. Usar `import { prisma } from '@/lib/prisma'` en todos.

### M13. Dependencias sospechosas
- **Archivo:** `package.json:16-18` — `@deepseek-ai/cordis-plugin-group`, `@deepseek-ai/dsh`, `@deepseek-ai/dsh-scope` (versiones `-rc`).
- **Detalle:** no corresponden a SDK oficiales conocidos de DeepSeek; verificar procedencia con `npm view` y eliminar si no se usan.

---

## ✅ RESULTADOS DE LINT

Comando: `npx eslint --quiet "app/api/**/*.ts" "lib/**/*.ts" "auth.ts"`

**20 errores** (todos `@typescript-eslint/no-explicit-any`, salvo 1 `prefer-const`):

| Archivo | Errores |
|---|---|
| `app/api/simulador/route.ts` | 4 (líneas 325, 349, 373, 397) |
| `lib/whatsapp.ts` | 7 (210, 230, 255, 256, 259, 277, 321) |
| `app/api/auth/[...nextauth]/route.ts` | 2 (47, 160) |
| `app/api/auth/login/route.ts` | 1 (62) |
| `app/api/checkout/route.ts` | 1 (38) |
| `app/api/tienda/aprovisionar/route.ts` | 1 (52) |
| `app/api/vapi/create/route.ts` | 2 (13 `prefer-const`, 73) |
| `app/api/webhook/crm/route.ts` | 1 (36) |
| `app/api/whatsapp/guardar/route.ts` | 1 (58) |

Nota: `npm run lint` completo se cuelga >120 s en esta máquina; el run acotado sí finaliza.

---

## 🔜 PLAN DE REMEDIACIÓN SUGERIDO (orden)

1. Rotar secretos + auditar historial de Git (C1).
2. Autenticación + ownership en endpoints críticos (C3).
3. Firmas HMAC en webhooks Meta/Vapi/Neon (C5).
4. Unificar bcrypt y eliminar backdoor + datos demo (C2, C4, A7).
5. Migrar `app-state.ts` a Prisma (A6).
6. Consolidar configuración y singleton de Prisma (M11, M12).
7. Limpiar `any` reportados por ESLint.
