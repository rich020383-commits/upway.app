# PLAYBOOK DE VENTA — Identidad Conforme + Agente Recepcionista (Upway Health)

**Fecha:** enero 2026
**Estado:** operativo. Precios tomados de `lib/health/plans.ts` y `REPORTES/NOTA-INTEGRACION-SALUD-2026-09.md` §4.5.
**Advertencia:** los precios de §4.5 del informe son **estimación propia, no dato de mercado**. Validar antes de mandar una propuesta firmada.

---

## 1. Qué estás vendiendo (y qué NO)

### 1.1 El producto — en una oración

> **"Su consultorio contesta todas las llamadas, le toma los datos al paciente con catálogo cerrado, se los confirma dígito a dígito al paciente, y le entrega ese registro con evidencia de integridad — sin contratar a nadie."**

### 1.2 Las tres cosas que SÍ haces (ya implementadas)

| Pieza | Qué es en palabras del cliente | Archivo |
|---|---|---|
| **Atiende** | Contesta 24/7, sigue *su* guion, agenda | plan Consultorio |
| **Confirma** | Pide el documento con catálogo cerrado (Res. 866/2021) y lo relee dígito a dígito al paciente | `lib/health/identity/conformingRecord.ts` (36 tests) |
| **Audita** | Grabación + log de eventos + hash de integridad | `lib/health/identity/persistence.ts` (30 tests) |

### 1.3 Lo que NO vendes (decirlo en voz alta cierra más negocios de lo que abre)

Del encabezado de `lib/health/plans.ts`:

- ❌ **Criterio clínico autónomo** — las reglas de triaje son el protocolo de la sede; el agente solo lo sigue.
- ❌ **HCE ni integración profunda de HIS.**
- ❌ **No transmite RDA ni RIPS** — eso es del prestador.
- ❌ **No crea ni modifica pacientes** — su HIS decide.
- ❌ **No diagnostica, no prescribe, no deriva.**

> **Por qué esto vende:** en salud, quien promete de más pierde el contrato al primer inconveniente. Declarar el límite es lo que te hace vendible en un comité de compras de IPS.

---

## 2. A quién le vendes (tres compradores, en orden de facilidad)

### 2.1 Comprador A — El clínico / IPS que está perdiendo pacientes

| Atributo | Dato |
|---|---|
| **Quién decide** | El propietario (consultorio/centro médico) o el gerente (clínica/IPS) |
| **Quién sufre el dolor** | La recepcionista, y el dueño que ve la caja |
| **Dolor concreto** | *"Llaman y no contestan"* → paciente que no agenda, se va a otro lado |
| **Dolor normativo (fresco, con fecha)** | Endurecimiento de la **Res. 948 de 2026** (jun–jul 2026): RVG14, RVC023, RVC053, RVC057–RVC063, RVC066, RVC084, RVC086–RVC089 pasaron de *Notificación* a **Rechazo**; RVC094–RVC098 nacieron como **Rechazo** desde jul-2026. Efecto: **si el RIPS no cumple, no se genera el CUV y la factura no se puede radicar.** |
| **Ticket** | $429.000 – $4.890.000/mes + setup |
| **Ciclo** | Días a semanas (dueño directo) |

### 2.2 Comprador B — El proveedor de software de HCE/HIS (el canal que **ya identificaste**)

Informe §3.5 y §4.4:

> *"MinSalud ha prestado asistencia técnica a **más de 120 proveedores de software de HCE**. Ese es el canal B2B2B de largo plazo: **licenciar la capa de identidad conforme en vez de competir contra ellos.** Ticket por cuenta menor, volumen mayor, **costo de adquisición casi nulo**, y **sin heredar la obligación del RDA**."*

| Atributo | Dato |
|---|---|
| **Quién decide** | Dueño o líder de producto de la empresa de software |
| **Dolor** | Sus clientes (IPS/consultorios) les exigen identidad conforme y ellos no la tienen; construirla es caro y regulado |
| **Qué le vendes** | **Acceso a la API** — `GET /api/v1/identity/{documentType}/{documentNumber}` con llave `upw_live_` |
| **Por qué ganas tú** | Ya lo construiste con 66 tests de identidad; **ellos no quieren competir en eso** |
| **Por qué ganan ellos** | Dejan de emprender un proyecto de cumplimiento regulatorio |
| **Ciclo** | Largo (semanas a meses), pero costo de adquisición casi nulo |

### 2.3 Comprador C — EPS / red grande

- **No se vende por catálogo**: >60.000 min → **solo cotización (deal desk)**, **nunca bajo $550 COP/min all-in** (30% de margen) — regla en `lib/pricing/rules.ts`.
- `requiresTelnyxApproval: true` en IPS Plus → hay que ampliar capacidad del proveedor.
- `autoActivatable: false` → **jamás se auto-activa.**

> **Orden práctico:** vende primero a **A** (ciclo corto, dinero rápido), mientras el **B** madura (es el que escala). C es el premio de después.

---

## 3. Cuánto cuesta (tu catálogo real, sin adornos)

### 3.1 Planes (`lib/health/plans.ts`)

| Plan | Para quién | Mensual | Setup | Min incl. | Números | **Simultáneas** | Grabación | Auto-activable |
|---|---|---|---|---|---|---|---|---|
| **Consultorio** (`consultorio-600`) | consultorio, centro médico | **$429.000** | $390.000 | 600 | 1 | **2** | 90 días | ✅ |
| **Clinica Pro** (`clinica-pro-1800`) | clínica, centro médico | **$1.199.000** | $690.000 | 1.800 | 2 | **5** | 1 año | ✅ |
| **IPS Plus** (`ips-plus-8000`) | IPS | **$4.890.000** | $1.290.000 | 8.000 | 4 | **20** | 1 año | ✅ (Telnyx approval) |
| Enterprise (`plans-enterprise.ts`) | EPS / red | > $60k min | — | — | — | — | — | ❌ solo cotización |

- **Overage: $690 COP/min** único para todos (45,1% de margen).
- **Regla de oro:** el escalón incremental cuesta **menos por minuto** que el overage → *subir de plan siempre es más barato que quedarse abajo pagando excedente.*
- `ALL_HEALTH_PLANS = [...HEALTH_PLANS, ...HEALTH_PLANS_ENTERPRISE]`.

### 3.2 El add-on que sostiene el margen

```ts
export const IDENTITY_MODULE_COP = 290000;   // por sede/mes
export const IDENTITY_MODULE_ID  = 'identidad-conforme';
export const IDENTITY_MODULE_LABEL = 'Identidad conforme (Res. 866/2021)';
```

- **Margen: cercano al 100%** — es software puro, no cuesta minutos.
- Es la línea que **sustenta el margen blended cuando el cliente crece**.
- **KPI comercial fijado en el código:** *% de cuentas con el módulo activo — **meta >70% a 6 meses**.*
- Se cobra **por sede y mes**; se revisa solo por (a) IPC acumulado o (b) cambios de catálogo / anexo técnico de MinSalud que obliguen a re-certificar.
- Cálculo único: `planQuote(monthlyBase, { withIdentityModule: true })` → suma, + IVA 19%.

### 3.3 Tu costo real

| Concepto | Costo |
|---|---|
| Voz CO | $0.065 USD/min |
| IA | ~$0.0575 USD/min |
| **ALL-IN** | **~$0.1225 USD/min ≈ $379 COP** (TRM 3.090) |
| Número CO | $13.50 USD/mes ≈ **$41.715 COP** |
| Venta a | $690 COP/min → **45,1% de margen en overage** |

**Márgenes de la tarifa final** (sin contar el módulo):

- A **uso completo** (100%): **37,3% / 36,1% / 34,6% / 32,3%** (baja al subir de plan)
- A **utilización de planeación** (55%): **61–62%**, y ya **no cae** con el tamaño del cliente

> **Lectura estratégica:** el margen de voz **cae** cuando el cliente crece; el módulo de identidad a $290.000 **no cae** (es fijo por sede). Por eso el módulo no es un extra: **es lo que hace que la cuenta grande sea rentable.**

---

## 4. Cómo se empaqueta (ofertas, no precios sueltos)

> Regla: **nunca envíes una tabla de precios.** Envías tres opciones con nombre, y el cliente elige una. Nadie compra "un producto"; la gente compra **el plan que le corresponde**.

### 4.1 La oferta de entrada — "la puerta"

| Elemento | Contenido |
|---|---|
| **Nombre** | Agente Recepcionista (entrada, 400 min) |
| **Precio** | **$549.000/mes** (§4.5 del informe) |
| **Margen** | ~65% |
| **Para quién** | Consultorio de 1–2 personas que no ha comprado nada |

⚠️ **DESAJUSTE DETECTADO — resolverlo antes de vender nada:**
§4.5 dice **"Agente Recepcionista, 400 min, $549.000"**, pero `lib/health/plans.ts` tiene **`consultorio-600`: 600 min por $429.000**.

Son **dos precios de entrada distintos** para el mismo cliente. Si mandas los dos, pierdes credibilidad. → **Decisión pendiente: cuál es el precio de entrada oficial.**

### 4.2 La oferta completa — el paquete que se debe vender SIEMPRE

```
┌──────────────────────────────────────────────────────────┐
│  PAQUETE "Consultorio Sin Perder Pacientes"              │
│                                                          │
│  ✔ Agente de voz 24/7 · 600 min · 1 número dedicado CO   │
│  ✔ Toma y confirmación de datos (catálogo cerrado)       │
│  ✔ Grabación 90 días + log de evidencia                  │
│  ✔ Implementación única: guion + catálogo + pruebas      │
│                                                          │
│  + IDENTIDAD CONFORME (Res. 866/2021)                    │
│    confirmación dígito a dígito + evidencia de hash      │
│                                                          │
│  $429.000/mes  +  $290.000/sede/mes  =  $719.000/mes     │
│  + IVA          ·  Setup: $390.000 (único)               │
└──────────────────────────────────────────────────────────┘
```

**Por qué este paquete:** vendes el add-on **empaquetado con el plan**, no como checkbox opcional suelto. El KPI del código es **>70% de cuentas con módulo activo a 6 meses**; la única forma de llegar ahí es que **por defecto** la propuesta incluya identidad.

### 4.3 Los tres niveles (anclaje: el primero es el cebo, el tercero el objetivo)

| | **Consultorio** | **Clínica Pro** ⭐ | **IPS Plus** |
|---|---|---|---|
| Mensual | $429.000 | **$1.199.000** | $4.890.000 |
| + Identidad | +$290.000 | +$290.000 | +$290.000 × sedes |
| Minutos | 600 | 1.800 | 8.000 |
| **Simultáneas** | **2** | **5** | **20** |
| Setup | $390.000 | $690.000 | $1.290.000 |
| Grabación | 90 días | 1 año | 1 año |
| Margen voz (uso completo) | 37,3% | 36,1% | 34,6% |

> ⚠️ **Aviso honesto — el techo de 2 canales del plan Consultorio:**
> Con **2 llamadas simultáneas** no puedes prometer "atiende todo". La promesa correcta para el plan de entrada es **"atiende 24/7 y no cuelga sin contestar"**. Si prometes desborde, el desborde es **humano** — que es exactamente el modelo de la nota de voz mixta (`REPORTES/NOTA-VOZ-MIXTA-HUMANO-2026-01.md`).

### 4.4 La oferta de implementación (el ticket grande de una sola vez)

§4.5 del informe:

| Componente | Precio | Margen |
|---|---|---|
| **Implementación Clínica (one-time)** | **$590.000 – $1.900.000** | ~80% |

**Qué facturas ahí** (esto es lo que justifica el precio): configurar sede, redactar guion, cargar catálogo de datos, probar llamadas, provisionar número y firma del DPA.

### 4.5 La oferta B2B2B (la que escala sin vender)

Para los **+120 proveedores de HCE**:

| Qué le ofreces | Cómo se cobra |
|---|---|
| La API `GET /api/v1/identity/...` + `docs/INTEGRACION-API-IDENTIDAD.md` | Por consulta / licencia mensual / cuenta conectada |
| White-label: **ellos** ponen la llave en **su** producto | Tú no vendes al IPS, **ellos** venden |
| **Tú no heredas la obligación del RDA** | Ellos siguen siendo el HIS |

> **Esta es la oferta más rentable del playbook:** costo de adquisición casi nulo, y tu producto ya está **documentado** y con **checklist de integración de 5 pasos**.

---

## 5. Cómo se entrega (el flujo white-glove que ya tienes)

No lo estás inventando: este flujo está escrito en el código. Cada paso existe.

### 5.1 El recorrido completo, paso a paso

| # | Paso | Quién | Qué pasa | Archivo |
|---|---|---|---|---|
| 1 | **Caso de uso** | Cliente | Llena el formulario (`/health/onboarding`), elige plan, marca el checkbox de identidad | `app/health/onboarding/page.tsx` |
| 2 | **Revisión** | Upway | Estado `PENDING_REVIEW` → el caso queda esperando | `VerticalOnboardingSession` |
| 3 | **Aprobación** | Upway | El equipo aprueba; el estado derivado se calcula **en el servidor** (el cliente no se puede aprobar solo) | `app/api/health/approvals/route.ts` |
| 4 | **Link de pago** | Upway → cliente | Se genera link de **Bold** y se envía correo con botón de pago | `createActivationPaymentLink` |
| 5 | **Pago** | Cliente | Webhook de **Bold** confirma el pago | `lib/billing/bold.ts` |
| 6 | **Implementación** | Upway | Guion + catálogo + pruebas | `IMPLEMENTATION_INTAKE_FIELDS` |
| 7 | **Provisión** | Upway | Se enciende la voz **en la misma llamada de validación** | `lib/voice-access.ts` |
| 8 | **Operación** | Ambos | El cliente recibe llamadas y su panel | — |

> **Detalle que importa:** el gate de voz se abre en **`APPROVED`**, no en `ACTIVE`, **a propósito**: *"exigir ACTIVE dejaría al cliente sin voz justo en el paso donde se la estás configurando"*. Es un flujo de servicio, no un auto-servicio.

### 5.2 El intake de implementación (lo que debes tener ANTES de firmar)

`IMPLEMENTATION_INTAKE_FIELDS` — 9 obligatorios, 5 opcionales:

**Obligatorios:**
1. `facilityType` — Tipo de sede (consultorio / centro médico / clínica / IPS / EPS)
2. `legalName` — Razón social
3. `nit` — NIT
4. `contactName` — Contacto operativo
5. `contactPhone` — Celular del contacto
6. `contactEmail` — Email del contacto
7. `dailyCalls` — Llamadas/día estimadas
8. `avgCallMinutes` — Duración media (min)
9. `planId` — Plan elegido

**Opcionales:** `preferredAreaCode` (indicativo), `existingPhone` (número a portar), `crmOrAgenda` (agenda/CRM actual), `integrationMode`, `hisSystem` (HIS/HCE actual).

> **Truco comercial:** el campo `dailyCalls` + `avgCallMinutes` te da el **minuto-a-minuto real del cliente antes de firmar**. Si te dice "12 llamadas de 8 minutos" = 96 min/día ≈ 2.880 min/mes → **te conviene vender IPS Plus (8.000) y no Clinica Pro (1.800)**, y evitar un overage que te haría perder margen. **Nunca firmes sin esos dos campos.**

### 5.3 El modo de integración (define el trabajo ANTES de firmar, no después)

`INTEGRATION_MODE_OPTIONS`:

| ID | Label | Qué implica |
|---|---|---|
| `api-pull` | API (su sistema consulta a Upway) | El HIS llama a `/api/v1/identity/...`. **Recomendado** |
| `webhook-push` | Webhook (Upway empuja a su sistema) | Tú expones un endpoint |
| `csv-manual` | Export manual (sin integración técnica) | **Más barato de implementar, más rápido de cerrar** |
| `no-definido` | Aún no lo definimos | ⚠️ Señal de que la venta va a estancarse |

> **Regla de oro:** con `csv-manual` cierras un contrato **sin que nadie programe**. Es la puerta para clientes sin equipo técnico. El `api-pull` es el upsell.

### 5.4 Qué se le entrega al cliente al cierre

1. **Número dedicado CO** operando (plan-dependent: 1 / 2 / 4).
2. **Agente configurado** con su guion y su catálogo.
3. **Acceso al panel** `/health/*`.
4. **Llaves de API** en `/health/settings → "Llaves de API para su sistema"`.
5. **`docs/INTEGRACION-API-IDENTIDAD.md`** (guía técnica ya escrita para su equipo).
6. **Acuerdo de tratamiento de datos (DPA).**
7. **Tablero de conformidad** y grabaciones con la retención del plan (90 días / 1 año).

---

## 6. Cómo se cobra (y por qué el modelo te protege)

### 6.1 Dos canales de cobro, ya implementados

| Canal | Para qué | Archivo |
|---|---|---|
| **Link de pago Bold** | Activación: setup + primer mes | `createActivationPaymentLink` en `app/api/health/approvals/route.ts` |
| **Recarga Bold** | Consumo mensual adelantado | `createBoldPaymentLink` en `app/api/recarga/route.ts` |
| **Webhook de Bold** | Confirma el pago y libera el acceso | `lib/billing/bold.ts` |

> **Bold es pasarela colombiana** — no la presentes como "integración de pagos": para un cliente colombiano, que el botón pague en pesos y con medios locales **es parte de la confianza**.

### 6.2 El modelo de prepago — la regla que NO se rompe

`recargaBreakdown()` en `lib/health/plans.ts`:

> *"El cliente carga la recarga del mes por adelantado. De esa recarga se reserva el **costo Telnyx EXACTO** (minutos incluidos + números dedicados) y **el resto es margen que retiramos de inmediato (dividendo). Nunca financiamos el consumo.**"*

Qué implica en venta:

- **Nunca des meses gratis ni "30 días para pagar"**: financiar consumo es financiar a Telnyx con tu plata.
- `coversCost: marginCOP >= 0` → un plan con margen negativo **no se vende**. El check ya existe.
- `simulateRecarga()` devuelve `needsTopUpCOP` → es el recordatorio automático de recarga.

### 6.3 Cómo se desglosa una factura

```
Factura mensual (plan Consultorio + identidad):
  Plan base                $  429.000
  Módulo identidad/sede    $  290.000
  ───────────────────────────────────
  Subtotal                 $  719.000
  IVA 19%                  $  136.610
  ───────────────────────────────────
  TOTAL                    $  855.610

Factura única de activación:
  Setup consultorio        $  390.000        (Bold, único)
  [Implementación clínica] $  590.000 – 1.900.000   (según alcance)
```

✅ **RESUELTO (10-ene-2026) — no había desajuste:** `IDENTITY_MODULE_COP` (290.000) **es la BASE gravable**, y tanto `planQuote()` como Sophie y `/precios` le suman el 19% → **$345.100 con IVA**. Las tres son consistentes. Lo único malo era la **redacción de los dos comentarios**, ya corregida: decían *"sin IVA"* y *"Precio FINAL (+ IVA)"* cuando el código hace "base + 19%". **No se tocó ningún precio.**
El comentario de `IDENTITY_MODULE_COP` decía *"por sede y mes, **sin IVA**"*, lo que se leía como "exento de IVA". En realidad el código hace **base + 19%**. Se corrigió la redacción de ambos comentarios; **ninguna función ni ningún precio cambió**.

### 6.4 Cuándo se factura

| Momento | Qué se cobra |
|---|---|
| Al aprobar y pagar | Setup (+ implementación si aplica) |
| Mensual | Plan + módulo × sedes |
| Al superar minutos | Overage $690/min, descontado de la recarga |

---

## 7. Cómo se promociona (mensaje, canales, objeciones)

### 7.1 El mensaje central — una sola frase

> **"Deje de perder pacientes porque nadie contestó el teléfono. Su consultorio atiende 24/7, toma el dato con catálogo cerrado, lo confirma dígito a dígito con el paciente y se lo entrega a su sistema con evidencia — sin contratar a nadie."**

Tres anclas en esa frase:

1. **Pérdida** — pacientes que no contestaron
2. **Cumplimiento** — catálogo cerrado, Res. 866, dígito a dígito, evidencia
3. **Sin contratar a nadie** — costo hundido cero

### 7.2 Un titular por comprador

| Comprador | Titular |
|---|---|
| **A — Dueño de consultorio/clínica** | *"Llaman y nadie contesta. Con Upway nunca vuelve a pasar."* |
| **B — Proveedor de HCE** | *"Identidad conforme para su software, sin construirla: API documentada, catálogos Res. 866, 66 tests."* |
| **C — IPS / EPS** | *"Evidencia auditable de identidad en cada encuentro, con reporte de conformidad exportable."* |

### 7.3 Dónde lo dices (canales en orden de conversión)

| # | Canal | Por qué | Costo |
|---|---|---|---|
| 1 | **Tu propio producto, en vivo** | La demo más fuerte es que **le contesten al prospecto**: dale un número y que llame | Casi cero |
| 2 | **LinkedIn** hacia dueños y gerentes de clínica / centro médico | El comprador A es identificable; B es dueño de software | Bajo |
| 3 | **Directorios y gremios de salud** | El comprador está agrupado | Bajo |
| 4 | **Alianzas con contadores y auditores de salud** | Ellos ven el dolor del **RIPS rechazado** antes que nadie | Cero |
| 5 | **Los +120 proveedores de HCE** (canal B) | **Costo de adquisición casi nulo** (tu propia nota) | Cero |
| 6 | **Ferias y congresos de salud** | A y C en un mismo lugar | Alto — lo último |

> **Regla práctica:** no inviertas en anuncios hasta que **3 personas hayan pagado el setup**. Antes de eso, cada peso en anuncios es un peso que no validó nada.

### 7.4 La demo — el cierre más barato que tienes

**Script de demo (10 minutos):**

1. **"Llame ahora"** — le das un número y el prospecto llama desde su celular.
2. El agente contesta, pregunta el motivo de consulta.
3. **Pide el documento** con catálogo cerrado.
4. **Lo confirma dígito a dígito** — el prospecto escucha **su propio número** leído de vuelta.
5. Le muestras `report.integrityVerified: true` y el **`evidenceRef`** en el panel.
6. Si tiene HIS, le muestras el `curl` de `docs/INTEGRACION-API-IDENTIDAD.md` corriendo.

> **Por qué cierra:** el prospecto **se escucha a sí mismo** dentro del flujo. Ninguna presentación de slides hace eso. Ya tienes la puerta de entrada: `app/api/simulador/route.ts` (Whisper `whisper-large-v3`, `language: 'es'`).

### 7.5 Las seis objeciones y cómo se contestan

| # | Objeción | Respuesta |
|---|---|---|
| 1 | **"¿Y si no entiende al paciente?"** | *"No infiere. Si no entiende un dato de identidad, lo vuelve a preguntar. Nunca adivina — por eso es catálogo cerrado."* |
| 2 | **"¿Y la privacidad de mis pacientes?"** | *"Por defecto no lo custodiamos (`retentionMode: TRANSIENT`). Si necesita custodia, firmamos acuerdo. Hay DPA e integridad verificable."* |
| 3 | **"¿Y si falla?"** | *"Grabación 90 días/1 año + log de eventos + hash. Y hay desborde humano: ninguna llamada se pierde."* |
| 4 | **"Es muy caro"** | *"Un minuto de excedente cuesta $690. ¿Cuánto le vale una llamada perdida de un paciente que agenda en otro lado?"* |
| 5 | **"¿Esto cumple la norma?"** | *"Es Res. 866/2021 con catálogos cerrados, no texto libre. Lo que NO hacemos: RDA, RIPS, HCE ni criterio clínico — eso sigue siendo suyo."* |
| 6 | **"Ya tengo una recepcionista"** | *"No la reemplazamos: deja de perder llamadas cuando está ocupada o cuando cierra. Es **relevo**, no despido."* |

**La objeción 6 es la más importante** y conecta con toda la tesis de la nota de voz mixta: **el modelo no desplaza al humano, lo desborda.**

---

## 8. Qué te falta para facturar (lo NO-código — el bloqueo real)

> *"Fase 0 de código está cerrada, pero la venta sigue bloqueada por lo no-código: RNBD ante la SIC, política de tratamiento, plantilla de DPA, y contraste de los catálogos contra el Anexo Técnico vigente en SISPRO. **El código ya es vendible; el papel todavía no.**"* — `REPORTES/NOTA-INTEGRACION-SALUD-2026-09.md`

### 8.1 Los cuatro bloqueos legales (en este orden)

| # | Bloqueo | Qué es | Quién lo resuelve |
|---|---|---|---|
| 1 | **RNBD ante la SIC** | Registro Nacional de Bases de Datos (Ley 1581). **Sin esto, tratar datos de salud es irregular.** | Abogado o tú con el formulario de la SIC |
| 2 | **Política de tratamiento** | Qué datos, para qué, cuánto tiempo | Abogado — **borrador ya existe**: `REPORTES/LEGAL-POLITICA-TRATAMIENTO-BORRADOR.md` |
| 3 | **Plantilla de DPA por cliente** | Acuerdo encargado–responsable, obligatorio por contrato | Abogado — **borrador ya existe**: `REPORTES/LEGAL-DPA-PLANTILLA-BORRADOR.md` |
| 4 | **Contraste de catálogos vs SISPRO** | Tipo de documento y sexo contra el Anexo Técnico vigente | Tú, contra el micrositio de SISPRO |

> **Buenas noticias:** de los 4, **2 ya tienen borrador en tu repo**. Solo faltan el RNBD y la revisión formal.

### 8.2 Los pendientes técnicos de Fase 1 (actualizado hoy)

| Pendiente (nota sep-2026) | Estado hoy |
|---|---|
| **5. Auth máquina-a-máquina (`ApiClient`)** | ✅ **CERRADO** — `lib/health/identity/apiKeys.ts` (sha256 + `timingSafeEqual`), `app/api/health/api-clients`, `GET /api/v1/identity/...` |
| **Documentación de integración** | ✅ **CERRADA** — `docs/INTEGRACION-API-IDENTIDAD.md` (8 secciones, checklist de 5 pasos) |
| **1. Aplicar la migración de identidad** | ❌ **BLOQUEADA** — la base Neon excedió su cuota. El SQL está en el repo y es revisable, **no se ha tocado la base** |
| **2. Integración al intake de voz** | ❌ Pendiente — conectar el validador a `lib/whatsapp.ts` y `app/api/simulador/route.ts` |
| **3. Borde de la API de agenda** | ❌ Pendiente — exigir `documentType` en `app/api/health/agenda/route.ts` |
| **4. Tablero de conformidad** | ❌ Pendiente |

> ⚠️ **Esto es lo que te impide facturar HOY:** la migración de identidad **no está aplicada**. Sin `PatientIdentity` viva en la base, el registro no se guarda. **El primer bloqueo operativo es liberar la cuota de Neon o mover la base.**

### 8.3 El orden real de los bloqueos

```
1. Neon (cuota) ──► 2. RNBD ante la SIC ──► 3. Migración aplicada
   bloquea todo        bloquea la venta        bloquea la operación
                                         ──► 4. Integrar al intake
                                               bloquea la demo real
                                         ──► 5. Contraste SISPRO
                                               bloquea la certificación
```

**Ninguno de esos 5 es código nuevo.** Son trámites y decisiones.

---

## 9. Los primeros 30 días (plan accionable)

### Semana 1 — Desbloquear

| Día | Acción | Resultado |
|---|---|---|
| 1-2 | **Liberar Neon** (subir plan o mover base) | Migración aplicable |
| 1 | **Aplicar la migración** `20260919_identity_conforming_record/` | Tablas vivas |
| 2-4 | **RNBD ante la SIC** | Puede tratar datos legalmente |
| 3-4 | **Contraste de catálogos vs Anexo Técnico SISPRO** | Catálogos certificados |

### Semana 2 — Decidir los tres precios

| Decisión | Por qué urge |
|---|---|
| **¿$429.000/600 min o $549.000/400 min como entrada?** | Hay **dos precios de entrada** en tus documentos. Sin resolverlo no mandas propuesta. |
| **¿IVA sobre el módulo sí o no?** | El comentario y `planQuote()` discrepan: 19% de diferencia en cada factura. |
| **¿Precio por consulta de la API B2B2B?** | Es el canal de escala y hoy **no tiene precio**. |

### Semana 3 — Preparar el cierre

- [ ] Terminar la **integración del validador al intake** → la demo deja de ser simulada
- [ ] Exigir `documentType` en la API de agenda
- [ ] Plantilla de propuesta construida con `planQuote()` (punto único de cálculo)
- [ ] DPA listo para firma (el borrador ya está)

### Semana 4 — Vender

| Día | Acción |
|---|---|
| 29 | Listar **20 consultorios / centros médicos** con dueño identificable |
| 30 | Escribir a **10 proveedores de HCE** del canal de +120, con la API como cebo |
| 30 | Preparar el **"Llame ahora"**: un número demo operativo |

**Métrica de la semana 4:** no es "visitas" — es **cuántos prospectos llamaron al número demo**.

---

## 10. Lo que NO debes hacer

1. **No vendas RDA, RIPS ni HCE.** Es de ellos; heredarlo es caro y no es tu negocio — tu propia nota dice *"licenciar la capa, no competir"*.
2. **No prometas criterio clínico ni triaje autónomo.** Son las reglas de la sede; el agente solo las sigue.
3. **No anuncies antes de 3 pagos de setup.** No has validado nada.
4. **No financies consumo.** El modelo prepago existe exactamente por eso.
5. **No mandes dos precios de entrada.** Resuelve el desajuste de §4.1.
6. **No prometas "atiende todo" en el plan de 2 canales.** Promete "no cuelga sin contestar"; si hace falta desborde, el desborde es **humano**.
7. **No regales la voz clonada sin ponerle precio.** Cuesta biometría y plata al proveedor, y hoy **no tiene SKU propio**.
8. **No descartes el canal B2B2B** por pensar que es "menos importante": es el de **costo de adquisición cero**.

---

## 11. Resumen en una página

```
PRODUCTO    Agente recepcionista 24/7 + identidad conforme (Res. 866/2021)
            con evidencia de integridad.
            NO da RDA, RIPS, HCE ni criterio clínico.

A QUIÉN     A: Dueño de consultorio/clínica   → $429K–$4.890K/mes, ciclo corto
            B: +120 proveedores de HCE        → API, costo de adquisición cero
            C: EPS/red >60k min               → solo deal desk, piso $550 COP/min

PRECIO      Consultorio  $429.000    (600 min · 2 simultáneas · setup $390K)
            Clinica Pro  $1.199.000  (1.800 min · 5 simultáneas · setup $690K)
            IPS Plus     $4.890.000  (8.000 min · 20 simultáneas · setup $1.290K)
            + Identidad  $290.000/sede/mes  (~100% margen · KPI >70% de cuentas)
            + Implementación (única) $590K – $1.900K
            Overage $690 COP/min para todos (45,1% de margen)

EMPACETAR   Plan + módulo SIEMPRE juntos. Tres opciones con nombre,
            nunca una lista de precios.
            La identidad va DENTRO de la propuesta, no como checkbox opcional.

ENTREGAR    Onboarding → PENDING_REVIEW → aprobación → link Bold → pago →
            guion + catálogo + pruebas → provisionamiento en la llamada
            de validación → panel + llaves de API + DPA + doc de integración.

COBRAR      Bold (activación) + recarga prepago.
            Nunca financiar consumo.
            ⚠️ Resolver el IVA del módulo antes de facturar.

PROMOCIONAR Mensaje: "deje de perder pacientes porque nadie contestó".
            Demo = que el prospecto llame y se escuche a sí mismo. Costo cero.
            Canales: producto vivo → LinkedIn → contadores de salud →
            proveedores de HCE → directorios → ferias.

BLOQUEOS    1) Neon en cuota  2) RNBD ante la SIC  3) migración aplicada
            4) integrar intake  5) contraste SISPRO
            → NINGUNO es código nuevo.

30 DÍAS     S1 desbloquear · S2 decidir 3 precios · S3 preparar cierre ·
            S4 vender (meta: prospectos que llaman al demo)

DECISIONES  1) ¿$429.000 o $549.000 como entrada?
PENDIENTES  2) ¿IVA sobre el módulo?
            3) ¿Precio por consulta de la API B2B2B?
```

> **La verdad, sin endulzar:** lo que te separa de facturar no es programar. Es **una cuota de base de datos, un trámite en la SIC y tres decisiones de precio.**