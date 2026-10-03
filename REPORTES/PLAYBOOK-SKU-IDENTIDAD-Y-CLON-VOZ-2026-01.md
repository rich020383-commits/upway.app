# PLAYBOOK DE SKU — Dos productos individuales: Identidad Conforme y Clon de Voz

**Fecha:** enero 2026
**Estado:** operativo. Precios y técnicas verificados contra el código y contra la tarifa pública de Telnyx.
**Complemento de:** `REPORTES/PLAYBOOK-VENTA-IDENTIDAD-2026-01.md` (allí van juntos; aquí van **por separado**).

---

# PARTE A — MÓDULO IDENTIDAD CONFORME, vendido individualmente

## A1. Qué es exactamente (las 5 piezas que lo componen)

No es "un checkbox". Son cinco cosas construidas y probadas:

| # | Pieza | Qué hace | Archivo |
|---|---|---|---|
| 1 | **Catálogos cerrados** | Tipo de documento (`CC, CE, TI, RC, NU, PA, CD, SC, PE, PT, DE, MS, AS`), sexo (`M, F, I, N`), municipio **DIVIPOLA de 5 dígitos**. **Nunca texto libre.** | `lib/health/identity/catalogs.ts` |
| 2 | **Validador determinista** | Validación separada del LLM: nombres separados, fecha, DIVIPOLA, rango de fecha. **Si no se entiende un dato de identidad, se vuelve a preguntar — nunca se infiere.** | `lib/health/identity/conformingRecord.ts` (**36 tests**) |
| 3 | **Certificación + reporte** | Genera el registro conforme con `completenessPct`, `issues`, `confirmedAt`, `certifiedAt`, `retentionMode` y **hash SHA-256 de integridad** | `lib/health/identity/persistence.ts` (**30 tests**) |
| 4 | **Consola de evidencia** | `/health/identity` — **% conforme, % confirmado por el paciente, entregas al HIS, integridad del hash** recálculado contra la fila | `app/api/health/identity/console/route.ts` + `app/health/identity/page.tsx` |
| 5 | **API máquina-a-máquina** | `GET /api/v1/identity/{documentType}/{documentNumber}` con llave `upw_live_`, sha256 + `timingSafeEqual`, revocación inmediata | `app/api/v1/identity/...` + `lib/health/identity/apiKeys.ts` |

**Y ya está conectado al flujo de llamada:**
`app/api/tools/agenda/route.ts` hace **captura guiada** — si el agente envía tipo de documento, **debe ser código del catálogo**; si no cuadra, le indica **volver a pregunta**. La identidad se certifica **sin bloquear la cita**.

### A1.1 El contrato que le entregas al cliente (ya escrito)

`docs/INTEGRACION-API-IDENTIDAD.md` — 8 secciones:

- Qué entrega y **qué no** (no RDA, no RIPS, no crea pacientes)
- Crear la llave en `/health/settings`
- Ejemplo `curl` con respuesta `200` completa
- **Códigos de error** (`401` / `400` / `404` / `5xx`) y qué hacer en cada uno
- Catálogos cerrados
- Tres formas de integración: **API (pull) / Webhook (push) / Export manual**
- Responsabilidades Ley 1581 + DPA
- **Checklist de integración de 5 pasos**

> **Punto de venta técnico:** le entregas al equipo del cliente **una guía que ya puede seguir sin ti**. Eso acorta la venta a nivel de TI.

---

## A2. Qué NO es (declararlo en la propuesta)

- ❌ **No** transmite RDA ni RIPS — es del prestador
- ❌ **No** crea ni modifica pacientes en su sistema
- ❌ **No** incluye diagnóstico, procedimiento ni prescripción
- ❌ **No** es HCE ni integración profunda de HIS
- ❌ **No** guarda el dato por defecto: `retentionMode: TRANSIENT` (custodia solo con acuerdo)

**La clave de match es `documentType + documentNumber`** — la misma que usa el MPI nacional. **Upway entrega esa clave; el HIS decide.**

---

## A3. A quién le vendes

| Segmento | Quién decide | Por qué compra | Ciclo |
|---|---|---|---|
| **Consultorio / centro médico** | El dueño | La recepcionista toma el dato mal o incompleto | Semanas |
| **Clínica / IPS** | Gerente o coordinador de admisión | Rechazos de RIPS por dato inconsistente | Semanas-meses |
| **Proveedor de software HCE** (+120) | Dueño / líder de producto | Le exigen identidad conforme y no la tiene | Meses |
| **Auditores y contadores de salud** | Socio | **Ya ven el dolor** del RIPS rechazado → te refieren | Inmediato (canal) |
| **EPS / red** | Comité | Volumen + SLA | Meses (deal desk) |

> **Insight clave para venderlo SOLO:** este módulo **no requiere la voz**. Un cliente que ya tiene su propio sistema de citas o su propio bot puede comprar **únicamente** la identidad conforme. Es el único SKU que puede venderse **ajeno a tu plan de voz** — y por eso es el que abre puertas nuevas.

---

## A4. Cuánto cobra — y el lío del IVA que tienes que resolver

### A4.1 El precio base

```ts
export const IDENTITY_MODULE_COP   = 290000;   // por sede / mes
export const IDENTITY_MODULE_ID    = 'identidad-conforme';
export const IDENTITY_MODULE_LABEL = 'Identidad conforme (Res. 866/2021)';
```

- **Margen: ~100%** — es software puro. En §4.5 del informe está estimado en **88%**, con rango **$290.000–$350.000/sede**.
- **KPI fijado en el código:** *% de cuentas con el módulo activo — **meta >70% a 6 meses**.*
- **Regla comercial publicada por Sophie:** *"**No hay descuentos** sobre el minuto adicional ni sobre el módulo de identidad conforme."*
- Se revisa **solo** por (a) IPC acumulado o (b) cambios del catálogo / anexo técnico de MinSalud que obliguen a re-certificar.

### A4.2 ✅ RESUELTO (corregido 10-ene-2026): hay UN solo precio

> **Corrección honesta:** mi alerta original decía que había *"tres versiones contradictorias"* y que *"un 19% mal cobrado se repite en cada factura"*. **Eso era incorrecto.** Al revisar el código con calma, **las tres fuentes dicen lo mismo**:

| Fuente | Dice |
|---|---|
| Comentario en `lib/health/plans.ts` | *"por sede y mes, **sin IVA**, como adicional al plan base"* |
| `planQuote(monthly, { withIdentityModule: true })` | Suma `290.000` y **aplica IVA 19% sobre `base + módulo`** → **cobra $345.100 + IVA** |
| `lib/sophie/knowledge.ts` (lo que Sophie le dice al cliente) | *"adicional de **$X con IVA incluido (base $290.000)**"* → **cobra $345.100 con IVA dentro** |

**Las tres coinciden en UN precio: $290.000 es la BASE gravable → $345.100 con IVA 19%.** Desglose:

- Comentario (`sin IVA`): el cliente paga **$290.000**
- `planQuote` (`+ IVA`): el cliente paga **$345.100** (290.000 + 55.100)
- Sophie (`con IVA incluido`): el cliente paga **$345.100** (290.000 base + 55.100 de IVA)

> **✅ Decisión tomada (10-ene-2026):** se corrigieron **los dos comentarios** de `lib/health/plans.ts` (el que decía *"sin IVA"*, ambiguo, y el que decía *"Precio FINAL (+ IVA)"*, falso). **No se tocó ningún precio ni ninguna función**: `planQuote()`, Sophie, `/precios` y el onboarding ya eran consistentes. **No había error de facturación.**

### A4.3 Precio recomendado para venta individual

| Escenario | Precio |
|---|---|
| **Estimación propia (§4.5 del informe)** | $290.000 – $350.000 / sede / mes |
| **Rango superior justificable** | hasta **$350.000/sede** si incluye **la API + la consola** |
| **Por consulta (canal B2B2B)** | ⚠️ **Sin precio hoy.** Hay que definirlo: por consulta, por licencia mensual o por cuenta conectada |
| **Descuento** | ❌ **Prohibido** por la regla publicada de Sophie |

---

## A5. Cómo se empaqueta VENDIDO POR SEPARADO

Cuando no va ligado a tu plan de voz, empaquétalo así:

### Opción 1 — Módulo puro (para quien ya tiene su sistema)

```
┌──────────────────────────────────────────────────────────┐
│  IDENTIDAD CONFORME (Res. 866/2021)                      │
│  Por sede · mes                                          │
│                                                          │
│  ✔ Captura guiada con catálogo cerrado (nunca texto libre)│
│  ✔ Confirmación dígito a dígito con el paciente          │
│  ✔ Registro certificado con hash de integridad           │
│  ✔ Consola de evidencia (/health/identity)               │
│  ✔ API + llaves de API + guía de integración             │
│  ✔ Grabación de la confirmación como prueba              │
│                                                          │
│  $290.000/sede/mes   ·   sin descuento   ·   + IVA       │
│  Implementación: $590.000 – $1.900.000 (si hay API)      │
└──────────────────────────────────────────────────────────┘
```

### Opción 2 — Tres niveles (anclaje)

| | **Solo identidad** | **+ API al HIS** ⭐ | **Por red** |
|---|---|---|---|
| Captura guiada y certificación | ✅ | ✅ | ✅ |
| Consola de evidencia | ✅ | ✅ | ✅ |
| API `upw_live_` + llaves | ❌ | ✅ | ✅ |
| Webhook push | ❌ | ✅ | ✅ |
| Multi-sede | ❌ | ❌ | ✅ |
| Precio | $290.000/sede | $350.000/sede | Cotización |
| Implementación | No aplica | $590.000+ | Deal desk |

### Opción 3 — El gancho sin plan de voz

> **"No necesita contratarnos para llamadas. Conectamos la identidad a su sistema existente."**

Esto es lo que **ningún competidor de voz** te puede contestar: tú vendes la capa de identidad **a quien no quiere tu voz**.

---

## A6. Cómo se entrega (por SKU, sin plan de voz)

| Paso | Qué pasa | ¿Ya existe? |
|---|---|---|
| 1 | Firma DPA (borrador en `REPORTES/LEGAL-DPA-PLANTILLA-BORRADOR.md`) | ✅ borrador |
| 2 | RNBD ante la SIC | ❌ **pendiente** |
| 3 | Cliente crea la llave en `/health/settings` | ✅ `app/api/health/api-clients` |
| 4 | Su equipo lee `docs/INTEGRACION-API-IDENTIDAD.md` | ✅ escrito |
| 5 | Prueba en desarrollo: `200`, `404`, `401` | ✅ checklist en el doc |
| 6 | Firmado el DPA, pase a producción | ⚠️ **requiere migración aplicada** |
| 7 | El HIS guarda `evidenceRef` junto a su paciente | ✅ en la respuesta |
| 8 | Revisión mensual en `/health/identity` (KPIs) | ✅ consola |

> **Lo que faltó en todo el flujo:** `1` (papel), `2` (papel), `6` (cuota de Neon). **Cero código nuevo.**

---

## A7. Cómo se cobra individualmente

| Concepto | Cuándo | Cuánto |
|---|---|---|
| **Módulo identidad** | Mensual, por sede | $290.000 (+ IVA según A4.2) |
| **Implementación** | Único, al firmar | $590.000 – $1.900.000 (solo si hay API al HIS) |
| **Plan de voz** | — | **No aplica** — es venta independiente |
| **Descuento** | — | **Prohibido** (regla de Sophie) |

**Canal de cobro:** el mismo que ya tienes — **link de Bold** + webhook. No hay que construir nada.

> ⚠️ **Regla de prepago que aplica igual:** no financies el módulo. Cobro mensual adelantado, igual que la recarga.

---

## A8. Cómo se promociona (por separado del plan de voz)

### A8.1 El mensaje — una frase

> **"Su sistema guarda el dato del paciente como se lo dictan. El nuestro certifica que el paciente lo confirmó dígito a dígito, con catálogo cerrado y evidencia de integridad — para que cuando le rechacen un RIPS, usted tenga la prueba."**

Anclas: **rechazo de RIPS** (dolor con fecha) · **catálogo cerrado** (Res. 866) · **evidencia** (hash).

### A8.2 Los tres titulares

| Comprador | Titular |
|---|---|
| Dueño de clínica | *"El dato lo anota mal la recepcionista. Que lo confirme el paciente, dígito a dígito."* |
| Proveedor de HCE | *"Identidad conforme en su software, sin construirla. API documentada, 66 tests."* |
| Auditor / contador | *"Evidencia verificable de cada identidad: hash, fecha y confirmación del titular."* |

### A8.3 La demo — 7 minutos, sin necesitar tu voz

1. **Se llama a su recepcionista** (no a ti) y le dicen que atienda como siempre.
2. El agente pide el documento → **la recepcionista escucha el error**: había tomado mal el número.
3. El agente **corrige con catálogo cerrado** y **relee dígito a dígito**.
4. Abres `/health/identity` y muestras: **% conforme, % confirmado, integridad**.
5. Le pasas un `curl` real con su dato → **ver `integrityVerified: true`**.

> **Por qué funciona:** no vendes "IA". Vendes **una pantalla con porcentajes y un hash**. En un comité de compras de IPS, **la evidencia convence más que la demostración tecnológica**.

### A8.4 Canales (prioridad para venta individual)

| # | Canal | Por qué |
|---|---|---|
| 1 | **Contadores y auditores de salud** | **Ven el RIPS rechazado antes que nadie** y te refieren |
| 2 | **+120 proveedores de HCE** | CAC casi nulo; ellos ya venden a las clínicas |
| 3 | **LinkedIn** a coordinadores de admisión / facturación | El dolor es operativo y específico |
| 4 | **Asociaciones de IPS y clínicas** | Comprador agrupado |
| 5 | Ferias de salud | Lo último |

> **Diferencia con el plan de voz:** aquí el canal **#1 no es la demo de llamada**, son **los contadores**. Son quienes le duelen los rechazos.

---

## A9. Objeciones específicas de este SKU

| # | Objeción | Respuesta |
|---|---|---|
| 1 | **"Ya capturamos los datos bien"** | *"Entonces midámoslo: abra la consola y vea su % de conformidad real. El rechazo de RIPS no avisa de cuál fue el dato que falló."* |
| 2 | **"¿No es solo un formulario?"** | *"Un formulario no lo hace el paciente delante de usted. Aquí el paciente **confirma dígito a dígito** y queda la grabación."* |
| 3 | **"¿Mi sistema no puede hacerlo?"** | *"Sí. La pregunta es cuánto le cuesta certificarlo, mantener los catálogos al día con SISPRO y probarlo. Nosotros ya lo tenemos con 66 tests."* |
| 4 | **"¿Dónde queda mi dato?"** | *"`retentionMode: TRANSIENT` — por defecto no lo custodiamos. Si quiere custodia, firmamos acuerdo. Usted guarda `evidenceRef`."* |
| 5 | **"¿Por qué por sede?"** | *"Porque la sede es la unidad que opera y factura. Una clínica con 3 sedes paga 3 — es el mismo KPI que usted audita por sede."* |
| 6 | **"Es caro para 'solo un módulo'"** | *"Es ~100% de margen para mí porque es software, pero para usted **es la mitad del costo de un auditor** y está 24/7. Y el rango de §4.5 va hasta $350.000."* |

---

## A10. Bloqueos específicos de este SKU

| # | Bloqueo | Severidad | Solución |
|---|---|---|---|
| 1 | **RNBD ante la SIC** | 🔴 Sin esto no puedes vender el tratamiento de datos | Trámite |
| 2 | **Migración de identidad sin aplicar** (Neon en cuota) | 🔴 **El registro no se guarda** | Liberar cuota y correr `20260919_identity_conforming_record/` |
| 3 | **Tres versiones del precio / IVA** | 🟠 Te hace mandar presupuestos distintos | Alinear comentario, `planQuote` y Sophie |
| 4 | **Precio por consulta B2B2B inexistente** | 🟠 El canal de escala no puede cotizar | Definir modelo |
| 5 | **Contraste de catálogos vs SISPRO** | 🟡 Sin certificación | Comparar contra el Anexo Técnico vigente |
| 6 | **Integración del validador al intake de voz** | 🟡 La demo de la A8.3 depende de esto | Conectar `app/api/tools/agenda` al flujo completo |

> **Nota:** el paso *"borde de la API de agenda"* y *"captura guiada"* **ya avanzaron** — `app/api/tools/agenda/route.ts` ya valida tipo de documento contra catálogo y demografía con el validador determinista. Lo que falta es el **tablero de conformidad unificado** y la migración.

---

# PARTE B — CLON DE VOZ, vendido individualmente

## B1. Qué es exactamente

**Una voz sintética con la voz de una persona real, con autorización legal registrada.**

### B1.1 Dos formas de crearlo (`POST /api/voice/clones`)

| Modo | Cómo | Límites |
|---|---|---|
| **Desde muestra** | `multipart/form-data` → sube el audio | ≤5MB, **2–60 s** (ideal **5–10 s**) |
| **Por diseño** | `JSON {mode:'design'}` → prompt → `createVoiceDesign` → `createVoiceCloneFromDesign` | Sin muestra previa |

Modelo: **`Qwen3TTS`** (`lib/telnyx/client.ts`).

### B1.2 El consentimiento — la pieza que lo hace vendible

`lib/voice-clone-consent.ts`:

| Elemento | Detalle |
|---|---|
| **Versión del texto** | `CONSENT_SCRIPT_VERSION = 'v1-2026-09'` → permite demostrar **qué se leyó en cada autorización** |
| **Quién autoriza** | **El TITULAR de la voz** — *"la sede no puede consentir en nombre de su empleado ni de su socio"* |
| **Quién se beneficia** | La sede (`businessName`) |
| **Qué se graba** | El párrafo **se lee EN VOZ ALTA y se graba**: ese audio **es** la prueba |
| **Orden** | Se lee **ANTES** que la muestra → *"para que quede al principio de la grabación y no se pueda recortar"* |
| **Audio de autorización** | **No se guarda.** Se hashea SHA-256 y se descarta **en la misma petición** → *"Upway no se convierte en custodio de una biométrica"* |
| **Evidencia guardada** | `consentingDocument`, `sampleSha256`, `sampleSeconds`, `voiceCloneId`, `grantedAt` |
| **Muestra** | `buildSampleScript()` → 5–10 s (Qwen3TTS recorta a 10 s) |
| **Revocación** | `deleteVoiceClone` → **primero borra en Telnyx, después marca revocada**. Si falla, **no** se registra la revocación |

Schema: **`VoiceCloneAuthorization`**, con la migración `20260926_voice_clone_authorization`:
> *"Autorización de clonación de voz (Ley 1581: la voz es dato biométrico sensible). Guarda la EVIDENCIA (hashes + metadatos)"*

### B1.3 Los cinco permisos que lo gobiernan (`lib/voice-access.ts`)

| Permiso | Significado | Se abre en |
|---|---|---|
| `canBrowse` | Ver el catálogo de voces | ✅ desde `REVIEW` |
| `canPreview` | **Reproducir** muestras | ✅ desde `REVIEW` |
| `canClone` | **Crear** una voz propia | ❌ **solo `APPROVED`** |
| `canProvision` | Encender el asistente | ❌ solo `APPROVED` |
| `canCall` | Llamadas reales | ❌ solo `APPROVED` |

Razón escrita en el código: *"CLONAR, APROVISIONAR y LLAMAR se abren al aprobar el caso. Son precisamente lo que se está vendiendo y **lo que cuesta plata**"*.
Y en `checkVoiceRateLimit('clone', ...)`: *"Diseño/clon de voz: **una de las operaciones más caras del proveedor**"*.

---

## B2. Qué NO es (obligatorio decirlo — está en tu propio consentimiento)

- ❌ **No es una copia.** *"una aproximación estadística y no una copia"*
- ❌ **No sirve para suplantar.** *"no puede usarse para suplantar a mí ni a terceros"* — **prohibido en los términos**
- ❌ **No mejora con más audio:** *"Quality has a ceiling set by your source audio"*
- ❌ **No hereda emociones distantes:** una voz de narración calmada suena distinta pidiendo emoción fuerte
- ❌ **No la clonas tú por un empleado:** la autorización es **del titular**

---

## B3. A quién le vendes

| Segmento | Quién autoriza | Por qué paga | Ciclo |
|---|---|---|---|
| **Dueño de clínica / consultorio** | Él mismo (titular) | *"Que suene como yo, no como un robot"* | Días — **emocional, el más rápido** |
| **Inmobiliaria** (vertical propia) | El asesor / dueño | La voz de **su** asesor vende casas | Días |
| **Center / call center** | Operador estrella | Voz de los mejores vendedores, 24/7 | Semanas |
| **Marca / retailer** | Dueño de marca | Identidad sonora de marca | Semanas |
| **Herencia de voz de un dueño** | El dueño | **El negocio sigue atendiendo sin él al teléfono** | Emocional, alto valor |

> **La propuesta emocional más fuerte de todo tu catálogo:** *"Su voz atiende aunque usted no esté."* Ningún otro SKU la tiene.

---

## B4. Cuánto cuesta — y cuánto deberías cobrar

### B4.1 💰 El costo real (calculado sobre la tarifa pública de Telnyx)

Telnyx publica: **5.000.000 caracteres ≈ 6.700 minutos hablados** → **≈ 746 caracteres por minuto**.

| Concepto | Tarifa Telnyx | Por minuto de habla |
|---|---|---|
| **Qwen3TTS** ← *tu modelo de clon* | **$0.000032 / carácter** | 746 × 0.000032 = **$0,0239 USD/min ≈ $74 COP** |
| Telnyx TTS (base) | $0.000003 / carácter | $0,00224 USD/min ≈ **$7 COP/min** |
| ElevenLabs (competencia) | $0,00018 – $0,0003 / carácter | — |

**Tu venta de minutos: $690 COP/min** → con voz clonada, la síntesis es **~10,7%** del precio de venta; con TTS base, **~1,0%**.

> ⚠️ **Cálculo derivado de la tarifa pública, no un precio facturado.** Verificar en Mission Control → Billing. **`lib/health/plans.ts` no registra el costo del clon** — solo dice *"cuesta plata en el proveedor"*. **Ese es el hueco de datos que falta para fijar precio.**

### B4.2 ✅ CONFIRMADO (10-ene-2026): crear el clon NO cobra

**Verificado en producción: se crearon 4 clones y no hubo descuento alguno en la cuenta.** Consistente con la tarifa pública de Telnyx:

La página de precios de Telnyx dice:

> *"Voice Design Lab **included**"* · *"$0 **platform fee**"*

⚠️ **No encontré tarifa publicada por crear un clon.** Indicio: **crearlo es gratis y se paga por uso.** **Confirmarlo en el portal o con soporte** — esa respuesta define si tu SKU es de cobro único o recurrente.

### B4.3 Tres modelos de precio (elige uno)

| Modelo | Cómo se cobra | Cuándo conviene |
|---|---|---|
| **① Setup único + uso** | Cobro único por crear; los minutos ya van en el plan | Si crear sí tiene tarifa y quieres trasladarla |
| **② Add-on mensual** ⭐ | **Por sede/mes**, igual que `IDENTITY_MODULE_COP` | Si crear **no** tiene tarifa → **margen ~100%** |
| **③ Incluido en plan alto** | Solo en Clínica Pro / IPS Plus | Para no regalarlo en el plan de entrada |

**Ancla de precio:** `IDENTITY_MODULE_COP = 290.000/sede/mes` es un add-on de software **con ~100% de margen**. El clon es **más caro de operar** (síntesis a ~$74 COP/min) pero **más valioso emocionalmente**.

> **Propuesta de rango para decidir:** add-on **$150.000–$250.000/sede/mes**, o **$300.000–$500.000 de setup** si prefieres cobro único. ⚠️ **No es dato de mercado** — es tu rango de decisión, igual que §4.5 lo marcó para identidad.

### B4.4 🚨 El hallazgo que frena tu catálogo

**El clon de voz NO está en ningún catálogo comercial.** Verificado:

- ❌ No aparece en `features` de ningún plan (Health, Center ni Inmobiliaria)
- ❌ No tiene constante de precio tipo `VOICE_CLONE_COP`
- ❌ No aparece en `lib/sophie/knowledge.ts` (Sophie **no puede cotizarlo**)
- ❌ No aparece en las páginas `/salud`, `/center`, `/inmobiliarias` ni `/precios`
- ✅ Sí existe el endpoint, el gate, la evidencia, la revocación y los tests

> **Estás regalando el SKU más caro de operar y el más emotivo de vender.** Está detrás de un `canClone: true` que se abre al aprobar, y nadie lo cotiza.

---

## B5. Cómo se empaqueta

### Opción 1 — "Tu voz" (add-on puro)

```
┌──────────────────────────────────────────────────────────┐
│  TU VOZ — clon de voz con autorización legal             │
│  Por sede · mes                                          │
│                                                          │
│  ✔ 5–10 s de muestra y listo                            │
│  ✔ Autorización grabada del titular (versión v1-2026-09) │
│  ✔ Evidencia SHA-256 — sin custodiar la biométrica       │
│  ✔ Revocación que borra el clon en el proveedor          │
│  ✔ Previsualización antes de aprobar                     │
│                                                          │
│  $150.000 – $250.000/sede/mes  ·  o setup único          │
└──────────────────────────────────────────────────────────┘
```

### Opción 2 — Tres niveles (anclaje)

| | **Catálogo Upway** | **Tu voz** ⭐ | **Voz de marca** |
|---|---|---|---|
| Voces predefinidas | ✅ | ✅ | ✅ |
| **Clon de la voz del titular** | ❌ | ✅ 1 voz | ✅ varias voces |
| Autorización legal + evidencia | ❌ | ✅ | ✅ |
| Revocación certificada | ❌ | ✅ | ✅ |
| Precio | Incluida | $290.000/sede | Cotización |

### Opción 3 — Upsell dentro del flujo (el más efectivo)

**El cliente ya escuchó las voces del catálogo. Después del preview, una sola línea:**

> *"¿Quiere que suene como usted? Necesitamos 10 segundos de su voz y su autorización grabada. Cuesta $X/mes."*

**Momento óptimo de venta:** en la misma llamada de aprobación, **cuando `canClone` acaba de abrirse**. El cliente ya está emocionado con el producto.

### Opción 4 — El pack emocional (para dueños mayores)

> **"Legado de voz"**: se graba la autorización y la muestra, y el negocio queda con la voz de su dueño.
> Cobro: setup alto + mensualidad baja.

⚠️ **Requiere que la revocación y la vigencia ("durante la vigencia de esta relación comercial") estén claras en el contrato.** Tu propio consentimiento ya lo dice.

---

## B6. Cómo se entrega (el flujo completo, ya implementado)

| # | Paso | Quién | Qué pasa | ¿Ya existe? |
|---|---|---|---|---|
| 1 | **Aprobación del caso** | Upway | Estado → `APPROVED` (el estado **se deriva en el servidor**) | ✅ |
| 2 | **Previsualizar** | Cliente | Navega el catálogo y **reproduce** voces (rate limit `catalog`) | ✅ desde `REVIEW` |
| 3 | **Grabar consentimiento** | Titular | Lee `buildConsentScript()` **en voz alta** → queda al principio del audio | ✅ |
| 4 | **Grabar muestra** | Titular | Lee `buildSampleScript()` → **5–10 s** | ✅ |
| 5 | **Subir** | Cliente | `POST /api/voice/clones` (≤5MB, 2–60 s) | ✅ |
| 6 | **Creación** | Telnyx | `createVoiceCloneFromUpload` → `Qwen3TTS` | ✅ |
| 7 | **Evidencia** | Upway | Se hashea el audio de autorización y **se descarta**; se guarda `consentingDocument` + `sampleSha256` | ✅ |
| 8 | **Asignar** | Cliente | Elige la voz para su asistente (`Telnyx.Qwen3TTS.{id}`) | ✅ |
| 9 | **Revocar (si aplica)** | Titular | `DELETE` → **borra en Telnyx primero**, luego marca `revokedAt` | ✅ |

**Validaciones ya puestas:**
- Rate limit específico `'clone'` — *"una de las operaciones más caras"*
- `voiceCapabilityDenied(user.id, 'clone')` — cierra el paso 5 si no está `APPROVED`
- El nombre de la persona es **obligatorio** (`cloneConsentSchema`)
- `authorizationRecorded: false` no rompe la operación, **pero se registra el error**

> **Detalle de oro para vender:** el **orden del consentimiento antes de la muestra** no es un detalle técnico — es lo que hace que la prueba **no se pueda recortar**. Úsalo en la venta: *"La ley pide que la autorización sea grabada y tú decides cuándo revocarla."*

---

## B7. Cómo se cobra

| Concepto | Cuándo | Cuánto |
|---|---|---|
| **Creación del clon** | Único, al crear | ⚠️ **Verificar si Telnyx cobra** (B4.2). Indicio: **$0** |
| **Add-on mensual** | Mensual | $150.000 – $250.000 / sede *(rango a decidir)* |
| **Síntesis (uso)** | En los minutos del plan | ~**$74 COP/min** con Qwen3TTS (B4.1) |
| **Extraer la muestra original** | — | **Gratis:** `getVoiceCloneSample()` devuelve el WAV (el preview lo usa como fallback) |

**Canal de cobro:** link de **Bold** + webhook — el mismo que ya tienes.

> ⚠️ **Calcula esto antes de fijar precio:** si un cliente con plan de 600 min usa voz clonada **todo** el tiempo, su síntesis cuesta **600 × $74 ≈ $44.400/mes** extra, contra ~$4.140 con TTS base. **Es un margen que se mueve** — por eso el add-on mensual es más seguro que cobrar "uso".

---

## B8. Cómo se promociona

### B8.1 El mensaje — una frase

> **"Su voz atiende, agenda y recuerda las citas — con su permiso grabado, y usted la puede revocar cuando quiera."**

Anclas: **su voz** (emoción) · **permiso grabado** (cumplimiento) · **revocación** (control).

### B8.2 Los tres titulares

| Comprador | Titular |
|---|---|
| Dueño de clínica | *"Que su consultorio suene como usted, no como un robot."* |
| Inmobiliaria | *"Su mejor asesor vende 24 horas — con su propia voz."* |
| Dueño mayor / marca | *"Su voz sigue atendiendo aunque usted no esté."* |

### B8.3 La demo — la más corta de tu catálogo (2 minutos)

1. Le das un texto: **"Grabe 10 segundos"**.
2. Subes la muestra.
3. Eliges su clon y presionas **preview**.
4. **Suena su voz hablando.**
5. Cierre: *"En su llamada real, esta voz va a atender y agendar."*

> **Por qué es la mejor demo que tienes:** **no hay que explicar nada.** El cliente se escucha y ya entendió. Comparado con identidad conforme (que exige pantalla + hash + `curl`), **este cierra solo**.

### B8.4 Canales

| # | Canal | Por qué |
|---|---|---|
| 1 | **Upsell post-preview** (B5 Opción 3) | Ya está emocionado, cuesta cero |
| 2 | **Inmobiliarias** (vertical propia) | Ciclo de días, comprador claro |
| 3 | **Dueños de clínica mayores** | Dolor emocional + pack `Legado de voz` |
| 4 | **LinkedIn con audio real "antes/después"** | Audios > slides |
| 5 | **Centros de llamadas (Center)** | Voz de los mejores operadores |

> **Regla:** **nunca vendas el clon con un audio genérico.** Siempre con **la voz del prospecto**.

---

## B9. Objeciones específicas de este SKU

| # | Objeción | Respuesta |
|---|---|---|
| 1 | **"¿Y si suena raro, no soy yo?"** | *"Es una aproximación estadística, no una copia. Por eso **escucha el preview antes de aprobar**. Si no le gusta, no se usa."* |
| 2 | **"¿Y si suplantan mi voz?"** | *"Está **prohibido en los términos**, y la autorización es **tuya y grabada**. Si revocas, **se borra el clon en el proveedor**, no solo aquí."* |
| 3 | **"¿Qué pasa si me voy?"** | *"Revocas: borramos en Telnyx **primero** y solo entonces registramos. Si falla el borrado, **no** afirmamos que se revocó."* |
| 4 | **"¿Guardan mi voz?"** | *"El audio de autorización **no se guarda**: se hashea SHA-256 y se descarta **en la misma petición**. La muestra sí, es la que crea el clon."* |
| 5 | **"Mi empleado puede autorizar"** | *"No. **La voz es suya**, no de la sede. Usted autoriza; la sede es la beneficiaria."* |
| 6 | **"¿Y si le pido emoción y suena mal?"** | *"La calidad tiene techo según su muestra. Le decimos la verdad: 10 segundos buenos, sin ruido, en su tono normal."* |

---

## B10. Bloqueos específicos de este SKU

| # | Bloqueo | Severidad | Solución |
|---|---|---|---|
| 1 | **No tiene precio ni SKU** | 🔴 **Nadie puede comprarlo** | Añadir constante + entrada en `lib/sophie/knowledge.ts` |
| 2 | **Costo de creación desconocido** | 🔴 No sabes tu margen | Ver Mission Control → Billing / soporte Telnyx |
| 3 | **Costo de uso (Qwen3TTS) no está en tu plan** | 🟠 `plans.ts` no contempla los ~$74 COP/min | Calcular y meterlo en `planMath` |
| 4 | **Vigencia del consentimiento vs revocación** | 🟡 *"durante la vigencia de esta relación comercial"* — ¿y si el cliente se va? | Definir en el contrato |
| 5 | **RNBD ante la SIC** | 🟡 La voz es biométrica sensible | Mismo trámite que identidad conforme |
| 6 | **El titular debe estar presente** | 🟡 No puedes clonar "por" un tercero | Flujar en el onboarding quién firma |

---

# PARTE C — Los dos SKU, lado a lado

| | **Identidad Conforme** | **Clon de Voz** |
|---|---|---|
| **Una frase** | *"El paciente confirma dígito a dígito y usted tiene la evidencia"* | *"Su voz atiende aunque usted no esté"* |
| **Tipo de venta** | Racional, de cumplimiento | **Emocional** |
| **Precio hoy** | ✅ $290.000/sede/mes | ❌ **No existe** |
| **En catálogo** | ✅ Health (checkbox + Sophie) | ❌ **Invisible** |
| **¿Se vende sin plan de voz?** | ✅ **Sí — su ventaja** | ⚠️ Parcial (asigna voz a un asistente) |
| **Margen** | ~100% (software puro) | ~100% si crear es gratis; **uso ~$74 COP/min** |
| **Ciclo** | Semanas | **Días** (preview → cierre) |
| **Mejor canal** | Contadores / auditores de salud | **Upsell post-preview** |
| **Mejor demo** | Consola `/health/identity` + `curl` con `integrityVerified` | **2 min: su propia voz** |
| **Bloqueo rojo** | RNBD + migración Neon | **No tiene precio** |
| **Comprador** | Comité / técnico | **Dueño, en persona** |

> **La lectura final:** identidad conforme es tu **venta de fondo** — racional, duradera, con contratos y comité. El clon de voz es tu **venta rápida** — emocional, de días, sin comité y con la mejor demo que tienes. **Y el clon es el único que hoy nadie puede comprar porque nadie sabe cuánto cuesta.**

## Decisiones pendientes (5)

1. **Identidad — precio real:** ¿$290.000? ¿$345.100? ¿$290.000 + IVA? → alinear comentario, `planQuote()` y Sophie.
2. **Identidad — precio por consulta** del canal B2B2B (los +120 proveedores de HCE).
3. ✅ **Clon — costo de creación: CERRADA** — **$0** (4 clones creados en producción sin descuento).
4. ✅ **Clon — modelo de cobro: CERRADA** — add-on mensual por sede, **`VOICE_CLONE_MODULE_COP = 190.000`** (base gravable; $226.100 con IVA).
5. **Clon — costo de uso:** meter Qwen3TTS (~$74 COP/min) en el cálculo de márgenes.

> **Ninguna de las 5 es código nuevo.** Son decisiones de precio — y hasta que se tomen, **los dos SKU no se pueden vender en serio**.