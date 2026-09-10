# 📋 Informe de Auditoría Técnica y de Seguridad Integral — Upway (upway-app)

**Fecha de Ejecución:** Septiembre 2026  
**Alcance:** Arquitectura, Control de Acceso (RBAC / Multi-tenancy / IDOR), Seguridad de Webhooks y APIs, Integraciones de IA y Facturación, Calidad de Código y Despliegue.  
**Metodología:** Análisis estático de código fuente, inspección de endpoints API (App Router), revisión de configuración de despliegue, auditoría de dependencias y comparación evolutiva frente a la auditoría previa (`AUDITORIA-2026-01.md`).  
**Resultado Global:** **17 hallazgos** (7 Críticos P0, 5 Altos P1, 5 Medios P2).  
**Estado:** ⚠️ **Requiere Remediación Inmediata antes de Tráfico de Producción.**

---

## 📊 1. Resumen Ejecutivo y Comparativa Evolutiva

En la auditoría anterior (`AUDITORIA-2026-01.md`) se identificaron vulnerabilidades severas. La evaluación actual refleja que el equipo corrigió varios puntos:
- ✅ **C4 (Resuelto):** Se eliminó `lib/auth-utils.ts` (hashing débil) y se unificó a `bcryptjs`.
- ✅ **C5 Meta (Resuelto):** El webhook de Meta (`app/api/webhook/route.ts`) ahora valida adecuadamente la firma HMAC `X-Hub-Signature-256` y usa `after()` de Next.js.
- ✅ **A6 (Resuelto):** `lib/app-state.ts` fue migrado de memoria volátil a PostgreSQL/Prisma.
- ✅ **A9 (Resuelto):** Se eliminó la caché global `FAQ_CACHE` compartida en `lib/whatsapp.ts`.
- ✅ **C3 Parcial:** Endpoints como `toggle-ai`, `inventario` y `aprovisionar` incorporaron validaciones con `getOwnedTienda`.

**Sin embargo, la expansión funcional hacia los módulos `business` y `health` introdujo fallas de seguridad de extrema gravedad:**
1. Múltiples endpoints del módulo `business` carecen por completo de autenticación y exponen datos de todos los comercios y pacientes.
2. Todo el subsistema de roles del módulo `health` es un simulador cliente-servidor inseguro que confía en el parámetro `?role=...` enviado por la URL.
3. El middleware de protección (`proxy.ts`) no está siendo ejecutado por Next.js debido a un nombre de archivo erróneo.
4. El pipeline de despliegue en `render.yaml` usa `prisma db push --accept-data-loss`, lo que arriesga destrucción silenciosa de datos de clientes en producción.

---

## 🔴 2. Hallazgos Críticos (P0 — Riesgo Inmediato)

### [C1] IDOR Masivo y Fuga Total de Datos en Módulo Business
- **Archivos Afectados:**
  - `app/api/business/dashboard/route.ts` (L1-229)
  - `app/api/business/users/route.ts` (L1-22)
  - `app/api/business/appointments/route.ts` (L1-64)
  - `app/api/business/reminders/route.ts` (L1-48)
  - `app/api/business/automation/route.ts` (L1-52)
  - `app/api/business/leads/activity/route.ts` (L1-28)
- **Descripción:**
  - `dashboard/route.ts`: No valida sesión con `getSessionUser()`. Si no se provee `tiendaId`, ejecuta consultas con `where: undefined`, retornando agregados y listas completas de leads, citas, inbox de conversaciones, métricas financieras de voz Vapi y consumo de **todas las tiendas y clientes de la base de datos**. Si se envía cualquier `tiendaId`, permite a un atacante inspeccionar el CRM y facturación de la competencia.
  - `users/route.ts`: Expone públicamente los primeros 100 usuarios (`id`, `name`, `email`) sin ninguna autenticación.
  - `appointments/route.ts`: En `GET`, si falta `tiendaId`, retorna citas médicas/comerciales de todo el sistema (nombres de pacientes, teléfonos, horarios). En `POST`, permite a un usuario anónimo agendar citas en cualquier tienda.
  - `automation/route.ts`: Permite a cualquiera consultar y disparar automatizaciones de leads sin credenciales.
- **Impacto:** Fuga masiva de información confidencial de clientes, datos personales sensibles y riesgo de multas regulatorias (Habeas Data / Ley 1581 / HIPAA).
- **Remediación:** Aplicar `getSessionUser(req)` y validar pertenencia con `getOwnedTienda(req, prisma, tiendaId)` como primera instrucción en cada route handler. Rechazar inmediatamente peticiones sin sesión o sin propiedad de la tienda.

---

### [C2] Escalación de Privilegios Absoluta en Módulo Health (Roles en Query Params)
- **Archivos Afectados:**
  - `app/api/health/route.ts` (L5-6)
  - `app/api/health/analytics/route.ts` (L5-6)
  - `app/api/health/approvals/route.ts` (L165-167, L184-186)
  - `app/api/health/audit/route.ts` (L4)
  - `app/api/health/compliance/route.ts`
  - `app/api/health/faq/route.ts`
  - `app/api/health/inbox/route.ts` (L5-6)
  - `app/api/health/onboarding/route.ts` (L82-86, L131-136)
  - `app/api/health/policies/route.ts` (L9-10, L38-39, L77, L100)
  - `app/api/health/settings/route.ts` (L5-6)
  - `app/api/health/triage/route.ts` (L9-10, L38-40, L77, L103)
- **Descripción:**
  - La función `enforceHealthAccess({ role, module })` evalúa si el rol tiene permiso para el módulo, pero **el rol es provisto arbitrariamente por el cliente**:
    ```typescript
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') ?? 'clinic-admin';
    ```
  - En `health/triage/route.ts` y `health/policies/route.ts`, los métodos `PATCH` y `DELETE` reciben un `id` y ejecutan `prisma.healthTriageRule.delete({ where: { id } })` sin validar sesión, clínica u organización.
  - `health/audit/route.ts`: Endpoint `GET` abierto al público que expone la bitácora de auditoría y los registros de eventos de webhooks.
- **Impacto:** Cualquier atacante anónimo puede auto-asignarse rol de `compliance-reviewer`, `clinic-admin` o `triage-manager`, aprobar on-boardings clínicos, alterar o destruir reglas de triage médico y políticas de cumplimiento de cualquier organización.
- **Remediación:** Obtener el rol y el `organizationId` / `clinicId` **exclusivamente del JWT de sesión** (`token.role`, `token.organizationId`) verificado en el servidor. Prohibir la inyección de roles vía query parameters o payload body.

---

### [C3] Webhooks de CRM y Agenda sin Verificación de Firma ni Secreto
- **Archivos Afectados:**
  - `app/api/webhook/crm/route.ts` (L7-25)
  - `app/api/tools/agendar/route.ts` (L4-26)
  - `app/api/webhooks/events/route.ts` (L5-66)
- **Descripción:**
  - `webhook/crm/route.ts`: Vapi dispara llamadas de herramientas como `consultar_paciente` y `perfilamiento_y_agenda`. El endpoint **no valida el encabezado `x-vapi-signature`**. Un atacante puede enviar peticiones POST fingiendo ser Vapi para consultar si un paciente existe mediante su cédula (`consultar_paciente`, retornando nombre y motivo de consulta) o inyectar/modificar leads en la base de datos.
  - `tools/agendar/route.ts`: No valida firma ni token secreto. Basta con conocer el `assistantId` de una tienda para inyectar citas falsas en su agenda.
  - `webhooks/events/route.ts`: `GET` expone los últimos 25 eventos de integración sin autenticación; `POST` permite registrar eventos externos arbitrarios sin validación de origen.
- **Impacto:** Fuga de historiales clínicos/comerciales por cédula, envenenamiento de bases de datos operativas y suplantación de proveedores externos.
- **Remediación:** Integrar `verifyVapiSignature(rawBody, req.headers.get('x-vapi-signature'), process.env.VAPI_SERVER_SECRET)` en ambos endpoints y bloquear peticiones no firmadas en producción.

---

### [C4] Creación Abierta de Asistentes Vapi y Agotamiento de Fondos
- **Archivo:** `app/api/vapi/create/route.ts` (L4-78)
- **Descripción:**
  - El endpoint `POST /api/vapi/create` no valida sesión (`getSessionUser`) ni propiedad de la tienda (`getOwnedTienda`).
  - Utiliza la llave privada del sistema (`process.env.VAPI_PRIVATE_API_KEY`) para aprovisionar un asistente de voz en los servidores de Vapi (utilizando modelos comerciales de OpenAI y voces de ElevenLabs) y lo asigna a la `tienda_id` provista en el JSON.
- **Impacto:** Ataque de denegación de servicio económico (Financial Drain). Un script malicioso puede invocar este endpoint miles de veces, creando agentes de voz que consumirán los créditos de Upway en Vapi y ElevenLabs, además de secuestrar la configuración de voz de cualquier tienda.
- **Remediación:** Restringir el acceso con `getOwnedTienda` y limitar la creación de agentes por plan/tenant.

---

### [C5] Middleware Inoperante por Nomenclatura Incorrecta (`proxy.ts`)
- **Archivo:** `proxy.ts` (L1-39)
- **Descripción:**
  - En Next.js App Router, el middleware **debe llamarse estrictamente `middleware.ts`** en la raíz del proyecto (o dentro de `src/`).
  - El archivo actual está guardado como `proxy.ts` y exporta `export async function proxy(...)`. Por especificación del framework, Next.js **ignora este archivo por completo**.
  - En consecuencia, ninguna ruta bajo `/dashboard/*` o `/health/*` tiene protección previa por middleware.
  - **Vulnerabilidad adicional en la lógica:** En la línea 20, se lee `request.cookies.get('upway_billing_state')?.value` sin firma criptográfica. Si este archivo estuviera activo, cualquier usuario podría falsificar la cookie (`upway_billing_state=active`) y saltarse la pasarela de pago.
- **Impacto:** Falsa sensación de seguridad: la barrera de acceso a nivel de red/enrutamiento no existe en ejecución.
- **Remediación:** Renombrar a `middleware.ts`, exportar `export async function middleware(...)` y validar el estado de facturación **únicamente desde el JWT de sesión NextAuth firmado** (`token.accessState`), nunca desde cookies planas.

---

### [C6] Peligro de Destrucción de Datos en Producción (`render.yaml`)
- **Archivo:** `render.yaml` (L6)
- **Descripción:**
  - El comando de compilación para el entorno de producción ejecuta:
    ```yaml
    buildCommand: npm install --include=dev && npx prisma db push --accept-data-loss && NODE_OPTIONS=--max_old_space_size=450 npm run build
    ```
  - La bandera `--accept-data-loss` en `prisma db push` aplica cambios de esquema destruyendo columnas y tablas existentes sin solicitar confirmación si detecta una discrepancia.
- **Impacto:** Cualquier cambio de modelo, renombrado de campo o refactorización que se despliegue a producción borrará permanentemente datos reales de comercios y usuarios sin aviso.
- **Remediación:** Reemplazar `prisma db push --accept-data-loss` por el flujo formal de migraciones: `npx prisma migrate deploy`.

---

### [C7] Actualización No Autorizada (TOCTOU) en `lib/app-state.ts`
- **Archivo:** `lib/app-state.ts` (L74-84)
- **Descripción:**
  - En la función `updateProduct`:
    ```typescript
    const p = await prisma.producto.update({
      where: { id },
      data,
    });
    if (p.tiendaId !== tiendaId) return null; // ownership
    ```
  - La mutación sobre el producto en la base de datos se ejecuta **antes** de verificar si el producto pertenece a la `tiendaId` del usuario solicitante. Si pertenece a otra tienda, la base de datos ya fue modificada y el endpoint solo se limita a retornar `null`.
- **Impacto:** Modificación no autorizada de inventario y precios de tiendas ajenas.
- **Remediación:** Reemplazar por una verificación previa o usar `prisma.producto.updateMany({ where: { id, tiendaId }, data })`.

---

## 🟠 3. Hallazgos Altos (P1 — Seguridad, Estabilidad y Negocio)

### [A8] Cuentas Privilegiadas Hardcodeadas en Código
- **Archivos:**
  - `app/api/auth/[...nextauth]/route.ts` (L158-166)
  - `app/api/admin/access-codes/route.ts` (L49)
  - `lib/billing/access.ts` (L32-38)
- **Detalle:**
  - En `route.ts`, si `email === 'revisor_meta@upway.business'`, se omiten los chequeos de base de datos y se le asigna rol `admin`, `owner` y tokens sintéticos.
  - En `access-codes/route.ts`, el mismo correo tiene permiso automático de administrador para crear y activar códigos de acceso.
  - En `billing/access.ts`, el código `UPWAY-VIP` está cableado en código duro y entrega acceso activo VIP por 90 días sin pago a quien lo ingrese.
- **Acción:** Mover roles y permisos especiales a base de datos mediante flags (`user.role === 'SUPERADMIN'`) o variables de entorno restringidas. Eliminar códigos VIP embebidos en el bundle de producción.

---

### [A9] Pérdida de Registros Financieros por Promesas Huérfanas en Webhook de Vapi
- **Archivo:** `app/api/vapi/webhook/route.ts` (L61-124)
- **Detalle:**
  - El webhook responde `200 OK` de inmediato a Vapi y lanza una función asíncrona no esperada: `void (async () => { ... })()`.
  - En plataformas como Render o entornos serverless, el contenedor o worker puede pausar o terminar el ciclo de CPU en cuanto se envía el response HTTP, cortando la ejecución antes de que se inserte el registro en `prisma.llamadaLog.create(...)`.
- **Acción:** Usar `after()` de `next/server` (como se implementó correctamente en `app/api/webhook/route.ts`) para garantizar que la plataforma mantenga vivo el contexto hasta guardar el log de facturación.

---

### [A10] Compilación con Errores de Tipado Silenciados
- **Archivo:** `next.config.ts` (L20-21)
- **Detalle:**
  - La propiedad `typescript: { ignoreBuildErrors: true }` está activa.
  - Los errores de TypeScript durante el build son completamente ignorados, lo que permite que regresiones de tipado, imports inexistentes o incompatibilidades de firma de métodos pasen a producción inadvertidamente.
- **Acción:** Corregir los errores de tipado existentes y deshabilitar `ignoreBuildErrors: true`.

---

### [A11] Pasarela Bold Desconectada de la Base de Datos
- **Archivo:** `app/api/checkout/route.ts` (L27-31, L83-104)
- **Detalle:**
  - El endpoint de checkout genera la orden en Bold pero almacena el estado de suscripción exclusivamente en una cookie del navegador (`upway_billing_state`).
  - No actualiza el estado de la organización ni del usuario en la base de datos (`Organization` / `BillingAccessState`).
  - No existe ningún endpoint de webhook de Bold que reciba la confirmación de pago para cambiar el estado de `PENDING_PAYMENT` a `ACTIVE`.
- **Acción:** Implementar persistencia en BD del intento de pago y crear la ruta `/api/webhooks/bold` con validación de firma para procesar eventos IPN de Bold.

---

### [A12] Exposición de Sophie sin Límite de Tasa (Rate Limiting) ni Cuota de Audio
- **Archivo:** `app/api/sophie/route.ts` (L239-363)
- **Detalle:**
  - El endpoint público de Sophie acepta peticiones sin autenticación (diseñado para la landing).
  - Sin embargo, no tiene control de frecuencia (Rate Limiting) por IP y acepta audio en base64 sin restricción de tamaño, ejecutando transcripciones pesadas con Whisper (Groq) y hasta 6 llamadas a LLMs externos.
- **Acción:** Integrar rate limiting (ej. Upstash / memoria con ventana fija) y limitar el tamaño del payload de audio antes del procesamiento.

---

## 🟡 4. Hallazgos Medios (P2 — Calidad, Arquitectura y Deuda Técnica)

### [M13] Violación del Patrón Singleton en PrismaClient
- **Archivo:** `app/api/auth/register/route.ts` (L15)
- **Detalle:** Crea `const prisma = new PrismaClient();` en el módulo en lugar de importar la instancia compartida de `@/lib/prisma`. En producción causa saturación del pool de conexiones de Neon.

### [M14] Dependencias Sospechosas e Innecesarias en `package.json`
- **Archivo:** `package.json` (L17-19)
- **Detalle:** Las dependencias `@deepseek-ai/cordis-plugin-group`, `@deepseek-ai/dsh` y `@deepseek-ai/dsh-scope` no se utilizan en ningún punto del código y agregan más de 1.700 paquetes transitivos al árbol de `node_modules`.

### [M15] Vistas y Métricas Mock en Módulo Health
- **Archivo:** `app/health/page.tsx` (L8-34, L51)
- **Detalle:** Muestra datos simulados estáticos ("Laura Mendoza", "13 mayo 2024") y no refleja los registros reales de pacientes o citas que ya están estructurados en el esquema de Prisma.

### [M16] Código Muerto de Google Calendar
- **Archivos:** `app/api/integraciones/google/auth/route.ts` y `callback/route.ts`
- **Detalle:** Endpoints OAuth activos que dirigen a Google Calendar a pesar de que el módulo fue deprecado y sus columnas eliminadas de la base de datos. Representa superficie de ataque innecesaria.

### [M17] Configuración Inconsistente de `.gitignore`
- **Archivo:** `.gitignore` (L35)
- **Detalle:** La regla `.env*` ignora `.env.example` y `.env.production.example`, impidiendo el control de versiones de las plantillas de configuración. Se debe ajustar a `.env*.local` o incluir excepciones `!.env.example`.

---

## 📋 5. Matriz de Riesgo y Priorización de Remediación

| ID | Hallazgo | Severidad | Esfuerzo | Impacto Principal |
|:---|:---|:---:|:---:|:---|
| **C1** | IDOR Masivo en Módulo Business | 🔴 Crítico | Medio | Fuga de CRM, citas y facturación |
| **C2** | Bypass de Roles en Módulo Health | 🔴 Crítico | Medio | Escalación total de privilegios |
| **C3** | Webhooks CRM y Agenda sin Firma | 🔴 Crítico | Bajo | Inyección y robo de datos de pacientes |
| **C4** | Creación Abierta de Asistentes Vapi | 🔴 Crítico | Bajo | Agotamiento económico en Vapi |
| **C5** | Middleware `proxy.ts` Inoperante | 🔴 Crítico | Bajo | Falta de control de acceso perimetral |
| **C6** | `db push --accept-data-loss` en Render | 🔴 Crítico | Bajo | Riesgo de borrado accidental de BD |
| **C7** | TOCTOU en `updateProduct` | 🔴 Crítico | Bajo | Alteración no autorizada de inventario |
| **A8** | Backdoor `revisor_meta` y códigos VIP | 🟠 Alto | Bajo | Accesos no regulados |
| **A9** | Promesas huérfanas en Webhook Vapi | 🟠 Alto | Bajo | Pérdida de cobros por voz |
| **A10** | TypeScript `ignoreBuildErrors: true` | 🟠 Alto | Bajo | Código con errores en producción |
| **A11** | Flujo de Pagos Bold Desconectado | 🟠 Alto | Medio | Cuentas en limbo de pago |
| **A12** | Sophie sin Rate Limit | 🟠 Alto | Medio | Abuso y sobrecostos de IA |
| **M13** | Instanciación múltiple de Prisma | 🟡 Medio | Muy Bajo | Agotamiento de pool PostgreSQL |
| **M14** | Dependencias `@deepseek-ai` muertas | 🟡 Medio | Muy Bajo | Sobrecarga de dependencias |
| **M15** | Datos mock en Health Overview | 🟡 Medio | Medio | Inconsistencia funcional |
| **M16** | Endpoints OAuth de Google Calendar | 🟡 Medio | Muy Bajo | Superficie de ataque residual |
| **M17** | Regla `.env*` en `.gitignore` | 🟡 Medio | Muy Bajo | Desincronización de variables |

---

## 🚀 6. Plan de Acción Recomendado (Paso a Paso)

### Fase 1: Blindaje Inmediato (P0 — Día 1)
1. **Corregir Middleware:** Renombrar `proxy.ts` a `middleware.ts`, exportar `middleware`, y validar estado de sesión criptográfico (NextAuth JWT) en lugar de la cookie plana.
2. **Cerrar IDOR en Business:** Agregar validación con `getSessionUser` y `getOwnedTienda` a todos los métodos en `app/api/business/*`.
3. **Saneamiento de Roles en Health:** Eliminar la lectura de `role` desde `searchParams` y `body`. Tomar el rol exclusivamente de `session.user.role` y verificar pertenencia a `clinicId` / `organizationId`.
4. **Firmar Webhooks:** Exigir `verifyVapiSignature` en `/api/webhook/crm` y `/api/tools/agendar`.
5. **Asegurar Despliegue:** En `render.yaml`, cambiar `npx prisma db push --accept-data-loss` por `npx prisma migrate deploy`.
6. **Corregir `updateProduct`:** Validar `tiendaId` en la cláusula `where` antes o durante la mutación en `lib/app-state.ts`.
7. **Proteger Aprovisionamiento Vapi:** Agregar `getSessionUser` y validación de tienda en `app/api/vapi/create/route.ts`.

### Fase 2: Robustecimiento y Negocio (P1 — Día 2)
1. **Limpiar Backdoors:** Remover `revisor_meta@upway.business` hardcodeado y el código promocional `UPWAY-VIP`.
2. **Garantizar Facturación de Voz:** Migrar la ejecución en segundo plano de `app/api/vapi/webhook/route.ts` a `after()` de Next.js.
3. **Activar Type Checking:** Quitar `ignoreBuildErrors: true` en `next.config.ts`.
4. **Rate Limiting en Sophie:** Agregar limitador de peticiones por IP en `/api/sophie`.

### Fase 3: Higiene y Deuda Técnica (P2 — Día 3)
1. Desinstalar paquetes no utilizados: `npm uninstall @deepseek-ai/cordis-plugin-group @deepseek-ai/dsh @deepseek-ai/dsh-scope`.
2. Unificar Prisma singleton en `app/api/auth/register/route.ts`.
3. Desactivar o archivar las rutas de Google Calendar.
4. Ajustar `.gitignore` para no ocultar `.env.example`.
