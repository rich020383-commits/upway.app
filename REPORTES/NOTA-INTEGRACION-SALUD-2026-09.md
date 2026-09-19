# NOTA DE IMPLEMENTACIÓN — Upway en el ecosistema de salud colombiano

**Fecha:** septiembre 2026
**Estado:** propuesta de estrategia y arquitectura. No es asesoría legal.
**Relacionado:** `REPORTES/AUDITORIA-2026-09.md` (bloqueador P0), `lib/health/plans.ts`, `lib/health/plans-enterprise.ts`

---

## 0. Propósito

Decidir **dónde puede y dónde no puede jugar Upway** en la cadena de valor de la salud colombiana, sin convertirse en HCE y sin asumir responsabilidad reguladora ajena.

Conclusión anticipada: **Upway solo puede jugar en el eslabón donde el dato nace (identidad y admisión) y en los eslabones administrativos que dependen de ese dato. No puede jugar en los eslabones clínicos, porque no tiene el dato clínico y no debe tenerlo.**

---

## 1. Estado verificado del marco normativo (a sep-2026)

> Verificar caducidad antes de usar en material comercial. Las normas de salud colombianas rotan rápido.

| Tema | Norma vigente | Nota |
|---|---|---|
| Interoperabilidad HCE / RDA | **Ley 2015 de 2020**, **Res. 866 de 2021**, **Res. 1888 de 2025** | RDA obligatorio vía API REST FHIR R4. Vigente desde 15-abr-2026 |
| Guía de implementación RDA | `minsalud.fhir.co.rda#1.0.0` (FHIR R4) | 47 perfiles, 25 extensiones, 80 CodeSystems, 82 ValueSets |
| **RIPS como soporte de FEV** | **Res. 948 de 2026** (14-may-2026) | **DEROGA la Res. 2275 de 2023** y sus modificatorias 558 y 1884 de 2024 |
| Prescripción / MIPRES | **Circular 0019 de 2026** | Deja sin efecto la Circular 44/2025 |
| Oportunidad de citas | **Res. 1552 de 2013** | Obligado: **la EPS**, no la IPS |
| Protección de datos | **Ley 1581 de 2012** + Decreto 1074/2015 | RNBD ante la SIC |
| Historia clínica | **Ley 23 de 1981**, **Res. 1995 de 1999** | |

### 1.1 Hallazgo crítico: la Res. 2275 de 2023 está derogada

Cualquier material que cite "Res. 2275 de 2023" como norma vigente del RIPS **está desactualizado**. La referencia correcta es **Res. 948 de 2026**.

Cambios que introduce la Res. 948 de 2026:

- **CUCON** (Código Único de Contrato): cadena de **64 caracteres asignada automáticamente por el SIIFA** al registrar el acuerdo de voluntades (**Res. 1962 de 2025**). **No lo genera el software del prestador.** Viaja en el FEV-XML dentro del campo `NUMERO_CONTRATO` (grupo `AdditionalInformation`). Si el RIPS informa un CUCON inválido o de contrato no vigente, **MinSalud rechaza, no se genera el CUV y no se puede radicar**. Es **mutuamente excluyente con número de póliza**: sin contrato hay que informar `FACTURA_SIN_CONTRATO` con la causal correcta (6 causales taxativas: urgencias, ADRES/SOAT/planes voluntarios, tutelas, portabilidad, sin contrato autorizado excepcional, trasplantes). Reportar la causal equivocada también rechaza.
- **Coberturas pasaron de 15 a 17 valores** desde 1-jun-2026: el código `1` ("Plan financiado por UPC") se reemplaza por `16` (UPC Régimen Contributivo) y `17` (UPC Régimen Subsidiado). Software no parametrizado reporta el código viejo y rechaza.
- **Endurecimiento de reglas de validación**: desde **1-jun-2026** pasaron de *Notificación* a *Rechazo*: **RVG14, RVC023, RVC053, RVC057–RVC063, RVC066, RVC084 y RVC086–RVC089** (al menos 16 reglas identificadas). En sentido contrario se flexibilizó **RVG15**. Desde **1-jul-2026** nacen como *Rechazo*: **RVC094, RVC095, RVC096, RVC097 y RVC098**.
- **Efecto del rechazo**: si el RIPS no cumple, el **MUV no genera el CUV** y **la factura no se puede radicar**. No hay cobro.
- **Transición a CIE-11** y **códigoVIDA**: campos paralelos, condicionales y diferidos. No obligatorios aún, pero ya presentes en la estructura.
- **SIIFA** integrado; nueva modalidad **Pago Global Prospectivo**; exclusión de actores (cirugía estética, investigación, reconocimiento de conductores) e inclusión de fabricantes/importadores/titulares de registro sanitario que venden directo a EPS.
- **Anexos Técnicos 1 y 2 salieron del cuerpo normativo** y pasan a ser Documentos Técnicos en el micrositio SISPRO, actualizables sin nueva resolución. → Requiere monitoreo mensual.

**Implicación de negocio:** el endurecimiento de julio 2026 generó presión operativa inmediata en prestadores. Eso es dolor fresco y con fecha, no dolor teórico.
---

## 2. Correcciones a los supuestos del análisis "Cashflow OS"

Se evaluó una propuesta de suite de 6 pisos post-HCE. **La tesis general es correcta** (hay cadena de valor después del intake). **La ejecución tiene 5 errores que deben corregirse antes de construir.**

### Error 1 — Asume que Upway ya tiene el dato clínico

El análisis dice repetidamente:

> "Si ya validaste CC + CIE-10 + CUPS para RDA, re-usas eso para armar RIPS"
> "Tú ya tienes: hora de llamada + hora de cita + CIE-10 + cierre RDA"

**Falso.** Upway, como canal de admisión, **no produce**:

- diagnóstico ni código CIE-10/CIE-11
- procedimientos ni códigos CUPS
- medicamentos ni códigos IUM
- valor facturado, modalidad de pago, contrato (CUCON)
- cierre de RDA

Esos datos los crea **el acto médico**. Si Upway los tuviera, sería HCE — exactamente lo que se decidió no ser.

**Consecuencia:** todo servicio que dependa de cruzar CIE-10 contra CUPS **no es construible con lo que Upway tiene hoy**. Requiere (a) integración de lectura al HIS, o (b) convertirse en HCE. Ambas suben la dificultad operativa de 4/10 a 7–9/10.

### Error 2 — Confunde la capa DIAN con la capa MUV

El "Semáforo DIAN" propone validar "¿este CUPS puede facturarse con este CIE-10?" y etiquetarlo como validación DIAN.

**Eso no es DIAN.** Es el **MUV (Mecanismo Único de Validación) del MinSalud**, que es quien emite el CUV. La DIAN valida otra cosa: CUFE, NIT, numeración, impuestos de la factura electrónica.

Son dos capas distintas, con dos reguladores distintos. Mezclarlas produce un producto mal diseñado y mal vendido.

### Error 3 — "Alerta Pertinencia IA" invade el acto médico y no tiene dataset

El análisis propone alertar al médico: *"EPS suele glosar TAC para R51 sin signos de alarma, ¿seguro?"*, apoyado en "10M glosas históricas".

Tres problemas:

1. **Upway no tiene 10 millones de glosas históricas.** Ese dataset no existe en el repositorio ni en la operación.
2. La pertinencia clínica la decide **la EPS** con auditoría médica, y se discute en el proceso de glosas. Es materia clínica.
3. Si Upway alerta y el médico ignora la alerta, **Upway queda en la cadena de responsabilidad** de una decisión clínica.

**Riesgo: alto. Recomendación: descartar.**

### Error 4 — El "Score de Cobrabilidad" promete una predicción sin fuente

El análisis propone decirle a la clínica *"esta cita tiene 98% probabilidad de pago a 90 días"* basándose en "paciente CC 123 tiene ADRES activo".

**Corrección verificada (no está en el análisis original):** sí existe una fuente de afiliación, y es más útil de lo que el análisis supone.

- **ADRES — "Consulta tu EPS"**: consulta **pública, sin autenticación, sin costo e inmediata**, declarada por ADRES para uso de **hospitales, clínicas e IPS** en procesos de **admisión, atención, facturación, auditoría o validación operativa**. Devuelve **EPS activa, régimen, estado/vigencia de afiliación, tipo de afiliado y fechas**. → Es una consulta **manual de navegador**, no una API oficial.
- **Automatización**: existen APIs de terceros no oficiales que consultan la BDUA por documento y devuelven EPS, régimen, estado, tipo de afiliado e historial de traslados (p. ej. PlacApi `POST /api/eps`, 1 crédito). **No son entidades del Gobierno** y operan sobre fuentes públicas.

**Veredicto corregido:** el "Score de Cobrabilidad al 98% a 90 días" **sigue siendo inviable** (requiere CUCON, contrato vigente, histórico de glosas y comportamiento de pago del pagador — Upway no tiene nada de eso). **Pero "Verificación de Aseguramiento y Radicabilidad" SÍ es construible y vendible hoy**, con un valor operativo real e inmediato:

- anticipar en el primer contacto si el paciente está **afiliado o desafiliado** (evita atender y no poder cobrar),
- resolver **régimen** para determinar si aplica copago y por qué vía se cobra,
- **depurar identidad contra BDUA** (nombre y municipio de referencia aportan al match de identidad del punto 3).

**Condiciones obligatorias antes de construirlo:**
1. **Riesgo de término de uso**: automatizar por scraping una consulta pública puede violar condiciones de uso del portal. Preferir convenio/API oficial, o proveedor con condiciones contractuales claras.
2. **Ley 1581**: el dato de afiliación es dato de salud asociado a persona identificada. Requiere finalidad declarada, autorización y trazabilidad de cada consulta.
3. **Almacenamiento**: guardar el **resultado** con su fecha, no la consulta en claro, y nunca usarlo como criterio de negación de atención.

**Reformulación honesta del servicio:** no "te digo si te van a pagar", sino **"te digo si el paciente tiene aseguramiento vigente y si el encuentro es radicable, antes de que lo atiendas"**.

Además, con la Res. 948 vigente, **sin CUV no hay radicación**, así que la cobrabilidad depende de la calidad del RIPS del prestador, no de una predicción externa.

**Prometer un porcentaje de pago sin base estadística es publicidad engañosa y riesgo reputacional.** Descartar, o reformular como "checklist de radicabilidad", que sí es verificable.

### Error 5 — "Espejo Supersalud" tiene el sujeto obligado equivocado

El análisis afirma que la clínica será multada por demorar 20 días cuando "el límite legal es 3 días".

**El obligado por los 3 días hábiles de la Res. 1552 de 2013 es la EPS**, no la IPS. Texto verificado:

> "Las Entidades Promotoras de Salud (EPS), deberán garantizar la asignación de citas de medicina general u odontología general... La asignación de estas citas no podrá exceder los tres (3) días hábiles, contados a partir de la solicitud."

Y para especializada, la misma resolución fija **5 días hábiles** solo para responder la **autorización previa** (Parágrafo 1, Art. 1). Y el Art. 6 asigna la vigilancia a **Supersalud sobre las EPS**.

**Una IPS no reporta individualmente "oportunidad de cita" a Supersalud ni recibe multa por ese artículo.** Lo que sí existe para IPS son indicadores de calidad del SOGCS y PAMEC. El framing "te van a multar" está mal asignado y te descalifica frente a un gerente de clínica que conoce su régimen.

**Riesgo: alto. Reformular o descartar.**
---

## 3. Dónde SÍ puede jugar Upway (verificado y construible)

El error del análisis no es la ambición: es el punto de entrada. Upway **sí** tiene acceso a la cadena de valor, pero por **un solo eslabón**: el dato administrativo y de identidad que nace en el primer contacto.

### 3.1 El hallazgo que abre la puerta: códigoVIDA y CUCON en el RIPS

La Res. 948 de 2026 mete en el RIPS dos campos que **no son clínicos**:

| Campo | Naturaleza | ¿Upway puede aportar? |
|---|---|---|
| **códigoVIDA** | Identidad unificada del paciente (MPI nacional) | **SÍ** — se resuelve por identidad demográfica |
| **CUCON** | Contrato prestador–pagador (vía SIIFA) | **Parcial** — es dato administrativo del prestador, no del paciente |

Esto conecta exactamente con el trabajo previo sobre identidad conforme.

**Tesis corregida:**
> Upway no valida CIE-10 ni CUPS. Upway garantiza que **la identidad del paciente resuelva correctamente contra el MPI/códigoVIDA** y que **los datos administrativos del encuentro sean consistentes**. Eso elimina una familia concreta de rechazos del MUV, sin tocar el acto médico.

Es verificable, es medible, y no requiere ser HCE.

### 3.2 Los tres servicios viables

| # | Servicio | Qué valida | Dato clínico requerido | Dificultad |
|---|---|---|---|---|
| **1** | **Identidad Conforme** (base) | Tipo doc, número, nombres separados, fecha nac., sexo, DIVIPOLA, confirmación del paciente | Ninguno | **3/10** |
| **2** | **Pre-RIPS Administrativo** | Identidad + códigoVIDA + consistencia de datos administrativos del encuentro | Ninguno | **5/10** |
| **3** | **Handoff Estructurado al HIS** | Entrega versionada del registro conforme vía API/webhook | Ninguno | **5/10** |

Los tres comparten la misma base: **la capa de identidad determinista.** Se construye una vez y habilita los tres.

### 3.3 El servicio que NO es viable como canal

| Servicio propuesto | Por qué no |
|---|---|
| Garantía RIPS (cruzar CUPS vs CIE-10) | Requiere dato clínico que Upway no produce |
| Semáforo DIAN | Capa reguladora distinta (DIAN ≠ MUV); requiere facturación |
| Alerta Pertinencia IA | Acto médico + dataset inexistente |
| Score de Cobrabilidad | Sin acceso a ADRES, régimen, contratos ni histórico de glosas |
| Espejo Supersalud | Obligado es la EPS, no la IPS |

**Regla de decisión permanente:**

> Si el dato lo crea el médico, Upway no lo toca. Si el dato lo crea el paciente en el primer contacto, Upway lo certifica.

### 3.4 Por qué esto sí es un foso competitivo

Un agente recepcionista se clona en 3 meses. **Un catálogo de validación alineado a Res. 866/2021, con evidencia de confirmación del paciente, trazabilidad y un SLA medible, no.**

Y hay ventaja de timing: el endurecimiento de la Res. 948 (jun–jul 2026) puso presión operativa real sobre prestadores. Hay dolor fresco con fecha.

**Nota sobre el destino estratégico:** MinSalud ha prestado asistencia técnica a **más de 120 proveedores de software de HCE**. Ese es el canal B2B2B de largo plazo: licenciar la capa de identidad conforme en vez de competir contra ellos. Ticket por cuenta menor, volumen mayor, costo de adquisición casi nulo, y **sin heredar la obligación del RDA**.
---
### 3.5 Inteligencia competitiva verificada — Saludtools (sep-2026)

Fuente: paginas publicas de saludtools.com consultadas el 19-sep-2026.

**Precios oficiales (médico/mes):** Standard **$89.000** · Plus **$147.000** · Premium **$168.000** · Usuario admin extra **$31.000**. Anual: $964.000 / $1.589.000 / $1.816.000. Ajuste de **+5,1%** desde enero 2026 (IPC 2025).

**Lo que Saludtools SÍ construye:**
- Historia clínica, agenda, facturación electrónica y **nuevos RIPS** (su motor normativo).
- **Interoperabilidad Nacional Res. 1888/2025** — declaran que garantizan el cumplimiento del RDA. **Ahí no entramos.**
- **Historia clínica por voz** (dictado del médico, dentro de la consulta) y **triage pre-consulta** (Premium).
- API de integraciones + documentación para developers.

**Lo que Saludtools NO construye — lo compra por alianza.** Tiene **dos** alianzas de automatización conversacional, ninguna propia:

| Alianza | Quién aporta la conversación | Alcance | Beneficio cruzado |
|---|---|---|---|
| **Saludtools + Lubot** | Lubot | WhatsApp con IA 24/7: responde, agenda, recordatorios, seguimiento | 10% OFF planes Basic/Pro de Lubot · 2º mes gratis de Saludtools |
| **Saludtools + Agentik** | Agentik | WhatsApp inteligente que recibe, agenda y responde | 20% OFF Plus/Premium Saludtools · 15% en implementación Agentik |

**Tres conclusiones verificadas:**

1. **Su "voz" es del médico, no del paciente.** El dictado clínico ocurre *dentro* de la consulta. El canal telefónico del paciente, *antes* del acto médico, no está cubierto. El propio chat de Saludtools lo confirma: *"Hoy no contamos con un agente de voz en número fijo para toma de datos/RDA"*.
2. **El carril WhatsApp ya tiene dos incumbentes con descuento cruzado.** Entrar como "otro WhatsApp con IA" es entrar tercero y a pelear precio. **El diferencial de Upway no puede ser WhatsApp: es voz telefónica entrante + identidad conforme.**
3. **Validación de la Ruta C.** Saludtools ya demostró, dos veces y con contrato, que **prefiere aliarse antes que construir** la capa conversacional. Upway no necesita desplazarlo: necesita ser el tercer aliado — y el único de voz telefónica.

**Reformulación del posicionamiento:** no "somos un agente recepcionista" (clonable en 3 meses, ya hay dos), sino **"el único canal telefónico que entrega el dato del paciente conforme y listo para el RDA"**.

**Cautela:** uno de sus artículos cita una **"Circular 044 de 2026"** sobre Mipres, que **no está verificada** contra fuente oficial y difiere de la Circular 0019 de 2026 registrada en la sección 1. No usar esa referencia hasta confirmarla.

## 4. Plan de implementación

### 4.0 Decisiones de arquitectura (cerradas)

| # | Decisión | Razón |
|---|---|---|
| D1 | **Upway NO será HCE** | No heredamos la obligación del RDA ni la habilitación REPS |
| D2 | **Upway NO transmite RDA ni RIPS** | Lo transmite el prestador. No prometemos SLA sobre proceso ajeno |
| D3 | **Upway SÍ certifica el dato que nace en el primer contacto** | Es nuestro único eslabón defendible |
| D4 | **La IA interpreta; el validador certifica** | Nada probabilístico escribe en un campo conforme |
| D5 | **Un campo cerrado vence a un campo abierto** | Elimina la clase entera de error de STT en identificadores |

### 4.1 Fase 0 — Desbloqueo · inmediata, bloquea la venta

Sin esto, no hay venta en salud. Ver `REPORTES/AUDITORIA-2026-09.md`.

**Estado verificado el 19-sep-2026** — los P0 de código quedaron resueltos:

| Hallazgo | Archivo | Estado |
|---|---|---|
| **C1 — IDOR masivo** | `app/api/business/appointments/route.ts` | ✅ Resuelto: `tiendaId` desde sesión, sin lectura cross-tenant |
| **C2 — Rol desde query param** | UI de health (`?role=`) | ✅ Resuelto: rol desde JWT/servidor |
| **C2b — Bitácora pública** | `app/api/health/audit/route.ts` | ✅ Resuelto: exige sesión + scope |
| **C3 — Webhook sin firma** | `app/api/webhook/crm/route.ts` | ✅ Resuelto: `x-vapi-signature`; ya no existe `consultar_paciente` sin autorización |
| **C3-b — Bitácora envenenable** | `app/api/webhooks/events/route.ts` | ✅ Resuelto (esta sesión): GET con sesión + scope de clínica (deny-by-default → 403 sin `clinicId`); POST exige `WEBHOOK_EVENTS_SECRET` y es **fail-closed** (503 en producción si falta) |
| **C4 / C5 / C6 / C7** | varios | ✅ Verificados como resueltos (middleware/proxy, TOCTOU con ownership previo, `render.yaml` limpio) |
| **A12 — `/api/sophie` sin rate limit** | `app/api/sophie/route.ts` | ✅ Resuelto (esta sesión): `lib/rate-limit.ts`, 30 req/60s por IP, configurable por entorno |

**Limitación conocida del rate limit:** el contador vive en memoria del proceso. Con varias instancias el límite efectivo es `limit × instancias`. **No es solución para infra multi-instancia** (requiere Redis/Upstash) y **nunca debe ser la única barrera de un recurso sensible**.

**Trabajo nuevo de esta sesión:**
- `lib/rate-limit.ts` + `lib/rate-limit.test.ts` (15 tests)
- `lib/health/identity/catalogs.ts` — catálogos cerrados de tipo de documento, sexo y DIVIPOLA
- `lib/health/identity/conformingRecord.ts` + `.test.ts` (36 tests)
- `WEBHOOK_EVENTS_SECRET`, `SOPHIE_RATE_LIMIT`, `SOPHIE_RATE_WINDOW_MS` documentados en `.env.example` y `.env.production.example`

**Validación (19-sep-2026):** `npx vitest run` → **213 tests / 15 archivos, todos en verde**. `npx tsc --noEmit` → **0 errores** (los 19 preexistentes de `.next/types/validator.ts`, `app/api/simulador/route.ts` y `components/HeroSphere.tsx` fueron corregidos en esta sesión).

**Deuda técnica corregida en esta sesión (bloqueaba Fase 1):**
- `app/api/simulador/route.ts` — 6 errores TS por `ChatCompletionMessageToolCall.function` resueltos con acceso tipado. Es la ruta de intake de voz/WhatsApp donde aterriza la captura conforme.
- `components/HeroSphere.tsx` — 12 errores TS por `type Particle` incompleto (faltaban `currentX/currentY/scale`). Fix de tipos sin cambio de comportamiento.

**Pendiente, NO de código:** RNBD ante la SIC, política de tratamiento, plantilla de DPA por cliente, y revisión legal de la categorización de Upway frente a Res. 1888 y Ley 1581.

### 4.2 Fase 1 — Identidad Conforme (el producto base)

**Modelo (hoy insuficiente).** `upway-health/clinic-template/prisma/schema.prisma`:

```prisma
model Paciente {
  telefono  String  @unique   // clave natural de WhatsApp
  nombre    String?           // campo libre único
  documento String?           // SIN tipo de documento
}
```

**Campos a añadir:** `documentType` (catálogo Res. 866/2021), `givenNames`, `familyNames`, `birthDate`, `sex`, `municipalityCode` (DIVIPOLA).

**Agenda nativa.** `lib/agenda/service.ts` y `app/api/health/agenda/route.ts` usan `patientName / patientPhone / patientEmail / patientDocument` como strings libres. Añadir tipo de documento, nombres separados y validación en el borde de la API.

**Intake de voz.** `lib/whatsapp.ts`, `app/api/simulador/route.ts` (Whisper `whisper-large-v3`, `language: 'es'`) hoy van de transcripción a campo. Cambiar a: **transcripción → intención → captura guiada con catálogos cerrados y doble confirmación**. Regla dura: **si no se entiende un dato de identidad, se vuelve a preguntar** — nunca se infiere.

**Validador determinista**, separado del LLM: catálogos cerrados, DIVIPOLA, validación de rango de fecha, relectura de confirmación por el paciente, y registro de la corrección con evidencia.

#### Estado de avance de Fase 1 (19-sep-2026)

| Componente | Archivo | Estado |
|---|---|---|
| Catálogos cerrados (tipo de documento, sexo) | `lib/health/identity/catalogs.ts` | ✅ Construido |
| Validación determinista de documento | `lib/health/identity/catalogs.ts` | ✅ Construido |
| Validación de nombres separados, fecha, DIVIPOLA | `lib/health/identity/catalogs.ts` | ✅ Construido |
| Certificación de identidad + reporte de conformidad | `lib/health/identity/conformingRecord.ts` | ✅ Construido |
| Guion de confirmación del paciente (relectura dígito a dígito) | `lib/health/identity/conformingRecord.ts` | ✅ Construido |
| Batería de pruebas | `lib/health/identity/conformingRecord.test.ts` | ✅ **36 tests pasando** |

| Persistencia (schema Prisma) | `prisma/schema.prisma` | ✅ Construido: `PatientIdentity`, `IdentityConfirmation`, `IdentityHandoff` + 3 enums |
| Migración SQL (revisable, sin aplicar) | `prisma/migrations/20260919_identity_conforming_record/` | ✅ Generada por *diff* de esquemas (107 líneas, solo aditiva) |
| Mapeo puro a Prisma | `lib/health/identity/persistence.ts` | ✅ Construido: `buildPatientIdentityData`, hash de integridad, verificación |
| Pruebas de persistencia | `lib/health/identity/persistence.test.ts` | ✅ **30 tests pasando** |

**Suite completa del proyecto:** `243 tests / 16 archivos` en verde · `tsc --noEmit: 0 errores` · `prisma validate: schema válido`.

**Pendiente de Fase 1:**
1. **Aplicar la migración** — bloqueado por entorno: la base Neon excedió su cuota. El SQL está en el repo y es revisable; **no se ha tocado la base**.
2. **Integración al intake** — conectar el validador al flujo de `lib/whatsapp.ts` y `app/api/simulador/route.ts`, sustituyendo transcripción→campo por captura guiada.
3. **Borde de la API** — validar y exigir tipo de documento en `app/api/health/agenda/route.ts`.
4. **Tablero de conformidad** y registro de evidencia de confirmación.
5. **Auth máquina-a-máquina (`ApiClient`)** — **prerequisito de seguridad**: sin esto, exponer la identidad por API sería un IDOR de datos de salud (mismo error que C1, con peor severidad).

**Nota sobre el hash de integridad:** `lib/health/identity/persistence.ts` normaliza el registro **antes** de calcular el hash. Un teléfono con espacios generaría un hash que nunca podría verificarse; hay un test de regresión que cubre ese caso.

⚠️ **Fase 0 de código está cerrada (sección 4.1), pero la venta sigue bloqueada por lo no-código:** RNBD ante la SIC, política de tratamiento, plantilla de DPA, y contraste de los catálogos contra el Anexo Técnico vigente en SISPRO. El código ya es vendible; **el papel todavía no.**

### 4.3 Fase 2 — Aseguramiento y radicabilidad

Sobre la base de Fase 1:
- **Consulta de aseguramiento** contra BDUA (preferir vía oficial/convenio; si es proveedor tercero, con contrato y bajo Ley 1581).
- **Checklist de radicabilidad**: identidad conforme + aseguramiento vigente + campos administrativos del encuentro completos.
- **Tablero** con evidencia: % conformes, campos faltantes, correcciones, consultas de aseguramiento con fecha.

**NO construir:** semáforo DIAN, alerta de pertinencia clínica, predicción de pago, espejo Supersalud (razones en la sección 2).

### 4.4 Fase 3 — Handoff y canal B2B2B

- Interfaz `HealthRecordAdapter` con **un solo adapter real** contra un HIS/HCE piloto, payload versionado.
- SDK/API documentada hacia los **+120 proveedores de software de HCE** que MinSalud asistió técnicamente → licenciar la capa, no competir.

### 4.5 Empaquetado comercial

| Componente | Precio/mes | Margen incremental |
|---|---|---|
| Agente Recepcionista (entrada, 400 min) | **$549.000** | ~65% |
| Identidad Conforme | **$290.000–350.000 / sede** | ~88% |
| Aseguramiento y Radicabilidad | **$150.000–250.000 / sede** | ~85% |
| Implementación Clínica (one-time) | $590.000–1.900.000 | ~80% |

**Ojo:** estos precios son **estimación**, no dato de mercado. Validar contra costo real de infraestructura, soporte y costo por consulta de aseguramiento antes de contratar.

### 4.6 SLA honesto (lo que SÍ se puede garantizar)

| Métrica | Meta propuesta |
|---|---|
| Atenciones con los N campos acordados capturados | ≥ 98% |
| Identidad confirmada por el paciente (doble captura) | ≥ 95% |
| Registros sin campos faltantes del set acordado | ≥ 95% |
| Municipio con código DIVIPOLA válido | 100% |
| Tipo de documento del catálogo (nunca texto libre) | 100% |
| Correcciones trazadas | 100% |

**NO garantizable:** tasa de RDA aceptado, tasa de RIPS sin glosa, transmisión del HIS, diagnósticos ni prescripciones. Calibrar las metas con una prueba real de ~200 capturas antes de comprometerlas por escrito.

### 4.7 Pendientes de verificación antes de vender

- [ ] Confirmar con abogado la categorización de Upway ante Res. 1888 y Ley 1581.
- [ ] Definir vía de consulta BDUA (oficial vs. tercero) y su encuadre legal.
- [ ] Confirmar cifras reales de glosa y cartera con el cliente piloto (las del análisis original **no están verificadas**; la cifra verificada es **cartera de $12,8 billones reportada por 28 EPS a Supersalud a jun-2025**, excluyendo Nueva EPS).
- [ ] Confirmar si el endurecimiento de la Res. 948 exige CUCON al prestador piloto y en qué grupo del cronograma SIIFA cae.
- [ ] Monitorear mensualmente los Anexos Técnicos en el micrositio SISPRO (ya no vienen en la resolución).

### 4.8 Métricas del negocio

| Métrica | Meta |
|---|---|
| **ARPA uplift** con Identidad Conforme | **+25%** |
| **Margen bruto blended** | **+5 pts, y que deje de caer con el tamaño del cliente** |
| **% de cuentas con Identidad Conforme** | **>70% a 6 meses** |
---

## 5. Arquitectura de conexión: cómo se integra Upway con el ecosistema de salud

### 5.1 Los únicos dos puntos de conexión

Upway tiene exactamente **dos interfaces**, y ninguna más. Eso es lo que mantiene el modelo sin habilitación REPS ni obligación de RDA.

| Actor | ¿Upway se conecta? | Cómo | Obligación que asume |
|---|---|---|---|
| **Paciente** | ✅ Sí | Voz (número fijo) + WhatsApp | Consentimiento y tratamiento de datos |
| **HIS/HCE del cliente** | ✅ Sí | API saliente (M2M) | Entrega conforme y trazable |
| **Profesional de salud** | ❌ Indirecto | Recibe el dato ya en su HCE | Ninguna |
| **EPS / ADRES** | ❌ No | — | Ninguna (no somos prestador, no hay CUCON) |
| **MinSalud — Gestor RDA / IHCE** | ❌ No | Transmite el prestador | Ninguna |
| **Supersalud** | ❌ No | — | Ninguna |
| **DIAN / MUV** | ❌ No | — | Ninguna |

**Regla:** si una integración exige que Upway sea prestador, se rechaza. No hay excepciones.

### 5.2 Qué existe hoy en el repo (verificado)

| Capacidad | Estado real | Evidencia |
|---|---|---|
| Entrada voz/WhatsApp | ✅ Parcial | `lib/whatsapp.ts`, `app/api/voice/webhooks/route.ts`, `app/api/simulador/route.ts` |
| Validador determinista | ✅ Construido | `lib/health/identity/conformingRecord.ts` (36 tests) |
| **Entidad de paciente durable** | ❌ **NO EXISTE** | No hay `model Patient` en `prisma/schema.prisma`. La identidad son strings denormalizados en `AgendaAppointment` (`patientName`, `patientPhone`, `patientEmail`, `patientDocument`) y `WaitlistEntry` |
| **Auth máquina-a-máquina** | ❌ **NO EXISTE** | No hay modelo de API key / OAuth client. Solo `Account` (tokens OAuth de usuario) y `VerificationToken` (verificación de email) |
| **Webhook saliente** | ❌ **NO EXISTE** | `WebhookEventLog` es **solo entrante**: registra eventos recibidos, sin modelo de endpoint, sin reintentos, sin firma de salida |
| Superficie de agenda | ✅ Construida | `ScheduleResource`, `ServiceOffering`, `AvailabilityRule`, `AgendaAppointment`, `WaitlistEntry` |
| Panel/consola | ✅ Existe | `app/dashboard/*`, `app/health/*` |

**Conclusión dura:** la mitad de entrada del producto tiene base. **La mitad de salida —el "centro de datos"— tiene CERO base hoy.** Ni paciente durable, ni autenticación M2M, ni entrega saliente.

### 5.3 Los tres patrones de conexión con el HCE (en orden de realidad)

#### Patrón 1 — Pull por el HIS · recomendado como primario

El HIS del cliente consulta a Upway cuando el paciente llega.

```
GET /api/v1/identity/{documentType}/{documentNumber}
Authorization: Bearer upw_live_<key>
→ { conforming, identity, report, evidenceRef }
```

- **Ventajas:** Upway no empuja, no gestiona reintentos, no necesita idempotencia compleja. El HIS decide cuándo y cómo.
- **Requisito:** el HIS debe tener capacidad de integración. Saludtools expone API en sus planes Plus/Premium.
- **Clave de match:** `documentType + documentNumber` (es la clave que usa el MPI nacional).

#### Patrón 2 — Push por webhook al HIS

Upway hace POST del registro conforme al endpoint configurado por el cliente.

- **Requiere obligatoriamente:** firma HMAC, `Idempotency-Key`, reintentos con backoff exponencial, dead-letter, y log de entrega consultable.
- **Hoy no existe nada de esto.** Es construcción nueva completa.
- **Realidad de mercado:** pocos HIS pequeños aceptan webhooks entrantes. Viable con HIS con API y con integradores.

#### Patrón 3 — Puente (fallback explícito, solo en piloto)

Si el HIS no tiene API: entrega asistida o RPA sobre la UI del HIS.

- **Aceptable:** como puente temporal en un piloto, con fecha de retiro.
- **Inaceptable:** como canal operativo permanente. La Res. 1888 descarta archivos planos para la IHCE; aunque esto no es el RDA, un puente manual **no escala y crea una trampa de mantenimiento**.

### 5.4 El requisito no obvio: match-or-create sin duplicar al paciente

Entregar el dato no basta. Si el HIS **crea un paciente nuevo** en vez de actualizar el existente, se rompe el match del MPI y **Upway habría causado el daño que promete evitar**.

Por eso el contrato de entrega debe ser:

1. Upway entrega `documentType` + `documentNumber` como **clave de match**, y `givenNames`/`familyNames` **separados** como corroboración.
2. El HIS busca por clave de match → **si existe actualiza, si no crea**.
3. Upway entrega un `identityRecordId` propio (ULID) para correlación y trazabilidad de la entrega.
4. Upway **no crea pacientes** en el HIS por su cuenta sin confirmación.

Esto obliga a un `HealthRecordAdapter` con un contrato explícito, y es la razón por la que el modelo de paciente durable **es prerequisito, no nice-to-have**.
### 5.5 Minimización: el activo de privacidad que también vende

Decisión de diseño recomendada: **Upway es transitorio por defecto.**

| Modo | Qué retiene Upway | Uso |
|---|---|---|
| **Transitorio (default)** | `ConformanceReport` + evidencia de confirmación + hash/token del documento | Reduce exposición Ley 1581 |
| **Custodia (opcional, contratada)** | Identidad completa, con retención declarada y DPA | Clínicas sin HIS propio |

Beneficio comercial directo: **"no retenemos la historia clínica del paciente; retenemos la attestación de que el dato entró conforme."** Eso responde la primera pregunta de cualquier oficial de cumplimiento.

### 5.6 Cómo se vende por segmento (la respuesta a "¿panel o centro de datos?")

**No son alternativas. La mezcla cambia según el segmento:**

| Segmento | ¿Tiene HIS con API? | Mecanismo de entrega | Peso del panel |
|---|---|---|---|
| Consultorio 1–3 médicos | ❌ No | **El panel ES la entrega.** La recepcionista copia el registro conforme | 🔴 Alto |
| Clínica mediana con HIS | ⚠️ A veces | **API (pull) o webhook** | 🟡 Medio |
| IPS / red con HCE | ✅ Sí | **API M2M** | 🟢 Bajo (consola de certificación) |
| Fabricante de HCE (Ruta C) | ✅ Sí | **SDK / licencia** | 🟢 Bajo |

**El panel no se elimina: cambia de propósito.**

- **Hoy:** consola de operación (agenda, llamadas, leads).
- **Debe ser además:** **consola de certificación** — % conformes, issues por campo, confirmaciones pendientes, entregas al HIS (entregado/fallido/reintento), y **evidencia descargable para auditoría**.

Sin esa consola, **el SLA es inverificable**, y un SLA inverificable no se puede contractualizar. El panel es la superficie de prueba del producto, no un adorno.

### 5.7 Qué construir, en orden

**Paso 1 — Identidad durable (prerequisito de todo lo demás)**

```
model PatientIdentity {
  id, clinicId, organizationId
  documentType, documentNumber, documentNumberHash
  givenNames[], familyNames[], birthDate, sexCode
  municipalityCode, departmentCode
  phoneE164, email
  conformanceJson, conforming, completenessPct
  confirmedAt, confirmedBy (evidencia de confirmación)
  identityRecordId (ULID, correlación con el HIS)
  @@unique([clinicId, documentType, documentNumber])
}
```

Más `IdentityConfirmation` (evidencia: canal, timestamp, guion leído, correcciones) e `IdentityHandoff` (entrega: destino, estado, intentos, respuesta).

**Paso 2 — Auth M2M**

```
model ApiClient {
  id, clinicId, name, keyHash, prefix, scopes[], lastUsedAt, revokedAt
  @@index([keyHash])
}
```

API key por clínica, **hasheada**, con scopes (`identity:read`, `appointments:read`, `handoff:write`) y rotación. Nunca una key global.

**Paso 3 — API de lectura (Patrón 1)**
`GET /api/v1/identity/{documentType}/{documentNumber}` + `GET /api/v1/identity-records?since=` (incremental). Versionada, con rate limit por cliente.

**Paso 4 — Entrega saliente (Patrón 2)**
`WebhookEndpoint` (destino, secreto HMAC, eventos suscritos) + `WebhookDelivery` (estado, intentos, próximo reintento, respuesta) + firma HMAC + `Idempotency-Key`.

**Paso 5 — Consola de certificación**
Tablero de conformidad + log de entregas + exportación de evidencia.

**Paso 6 — Adapter de handoff**
`HealthRecordAdapter` con **un solo adapter real** contra un HIS piloto (contrato de match-or-create, §5.4).

### 5.8 Advertencias

- **No construir un "centro de datos" completo antes de la identidad durable.** Sin `PatientIdentity` no hay nada que servir: el "centro de datos" queda vacío.
- **No exponer API sin auth M2M.** Una API de identidad sin autenticación de cliente es un IDOR de datos de salud — el mismo error de C1, con mayor severidad.
- **No vender la consola de certificación como "tablero de cumplimiento IHCE".** Upway no certifica cumplimiento ante el ecosistema; certifica que el dato de entrada es conforme.
- **Los precios del módulo siguen siendo estimación** (ver §4.5). El costo por consulta de aseguramiento, el costo de infraestructura de entrega y el costo de soporte deben medirse antes de contratar.

### 5.9 Pendientes de verificación (§5)

- [ ] Definir si el modo por defecto es **transitorio o custodia** con el abogado, antes de escribir el modelo.
- [ ] Confirmar con 2–3 HIS objetivo (Saludtools incluido) si tienen **API entrante** documentada y con qué contrato de partner.
- [ ] Confirmar la política de health-check y allowlist de IP que exigirá cada cliente.
- [ ] Validar la clave de match `documentType + documentNumber` contra el comportamiento real del MPI/VIDA en un piloto.