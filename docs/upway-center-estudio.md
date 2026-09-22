# Upway Center v2 — Ser el contact center (no venderle a los call centers)

**Estado:** estudio de mercado y viabilidad con tarifa final (sep-2026). TRM del motor: 3.090 COP/USD (TRM de mercado vigente: ~3.204).
**Decisión de lineamiento:** ✅ aprobado con condiciones (ver §0 y §9).
**Código:** `lib/center/plans.ts` (dos líneas de servicio + escalera + economía del humano), `lib/pricing/rules.ts` (reglas R0–R7).
**Verificación:** `npm test` (`lib/center/plans.test.ts`) y `npm run precios` (reporte sobre el código real, ya incluye Center).
**Relacionado:** `docs/upway-politica-precios.md` (acta D1–D5), `docs/upway-health-estudio.md`, `REPORTES/NOTA-INTEGRACION-SALUD-2026-09.md`.

---

## 0. Veredicto y lineamiento (por qué sí)

**Sí: ser el contact center es la jugada correcta; venderle software a los call centers es la jugada que deja el margen en manos de otro.** Cuatro razones verificables:

1. **El margen se queda donde está el resultado, no donde está la herramienta.** Un BPO factura $14–18 USD/hora por un asesor sentado; un proveedor de voz IA factura $0,07–0,30 USD/min por infraestructura. Al operar nosotros capturamos la diferencia completa (headcount reemplazado), no una licencia.
2. **La infraestructura ya está construida y pagada**: Telnyx, agente de voz, agenda, CRM/tickets, grabación, evidencia auditable, cobro con Bold y un motor de precios probado. Ser contact center solo la explota.
3. **CAC ≈ 0 por cross-sell**: los clientes de Health e Inmobiliarias ya tienen línea de voz Upway. Convertirlos en clientes de Center es agregar un plan, no vender de cero.
4. **El mercado está en el momento exacto**: más del 76% del sector BPO colombiano ya usa IA y la presión de costos (salario mínimo 2026 +23%) empuja a los clientes a buscar cobertura 24/7 sin duplicar nómina. Nosotros somos esa oferta sin heredar el costo laboral.

**Las condiciones (lo que evita que esto se convierta en un BPO caro):**

| Condición | Por qué |
|---|---|
| **Solo dos líneas: atención al cliente y soporte técnico N1** | Comparten el mismo esqueleto (identificar, consultar, registrar, agendar, escalar con contexto). Cada línea nueva es KB + integraciones: no multiplicamos operación antes de tiempo. |
| **Solo inbound, cero outbound comercial** | El contacto comercial o publicitario en Colombia obliga a consultar el RNE (Ley 2300 de 2023 "Dejen de Fregar"). Cobranza y venta agresiva quedan fuera por regulación y por marca. |
| **Tier-1 y nada más** | No prometemos tier-2/tier-3, ni decisiones médicas, legales o financieras. El escalamiento humano es del cliente (Fase 1) o un gestor Upway con cupo limitado (Fase 2). |
| **El humano no es el motor de margen** | Nuestro costo de un gestor humano es $26.688 COP/h → 33–38% de margen facturando, contra 55–64% de la IA. Se vende como conformidad de CX, no como negocio. |
| **Nada de "resolvemos el 85%"** | Se promete disponibilidad, captura del dato y evidencia auditable. La tasa de resolución se mide y se reporta; no se garantiza antes de tener 3 meses de datos propios. |

---

## 1. Las dos líneas de servicio (esto es lo que se vende)

Definidas en código (`CENTER_SERVICE_LINES`), con lo que hace **y lo que no hace** cada una:

### 1.1 Atención al cliente (inbound)

| | |
|---|---|
| **Hace** | Identifica al cliente y valida el dato mínimo acordado · responde estado de pedido/servicio/garantía desde el sistema del cliente · registra el caso con catálogo de motivos propio · agenda devolución, recogida o llamada de seguimiento · escala con contexto. |
| **No hace** | No promete resultados ni compensaciones · no autoriza descuentos · no decide garantías (aplica el criterio definido por el cliente) · no atiende cobranza ni contacto comercial. |
| **Necesita para arrancar** | Catálogo cerrado de motivos y de datos a capturar · acceso de solo lectura al estado (API, webhook o CSV) · a quién escalar y con qué prioridad. |
| **AHT de referencia** | 5 min |

### 1.2 Soporte técnico N1

| | |
|---|---|
| **Hace** | Recibe la falla y aplica el **árbol de diagnóstico definido por el cliente** · valida datos del equipo/servicio (serie, modelo, contrato, dirección) · **agenda la visita técnica** sobre la agenda real y confirma por WhatsApp · entrega link de seguimiento con contexto al técnico · escala fallas críticas de inmediato. |
| **No hace** | No diagnostica fuera del árbol definido · no cotiza reparaciones ni decide si aplica garantía técnica · no reemplaza al tier-2/tier-3 humano. |
| **Necesita para arrancar** | Árbol de diagnóstico cerrado (decisión del cliente) · agenda de técnicos y cobertura por zona · umbral de criticidad para escalar. |
| **AHT de referencia** | 7 min |

**Por qué estas dos y no otras:** son las únicas donde (a) el dato se captura y se confirma, (b) el resultado es verificable (caso registrado, visita agendada), y (c) no asumimos responsabilidad profesional ajena (médica, legal, financiera). Es el mismo criterio con el que Health se limitó a identidad y admisión.

**Fuera de alcance explícito:** outbound comercial/publicitario (RNE), cobranza, ventas con cierre, tier-2/tier-3, decisiones profesionales, y cualquier flujo que exija prometer un resultado que no controlamos.

---

## 2. Estudio de mercado (Colombia, sep-2026)

### 2.1 El sector que vamos a servir

| Dato | Valor | Fuente |
|---|---|---|
| Aporte del BPO al PIB | **3,3%** | Revista Clevel, 14-ene-2026 |
| Empleos formales | **~790.000** | Revista Clevel |
| Exportaciones de servicios | **> USD 1.300 millones** | Revista Clevel |
| Posición global de confianza | **4º (84,2%)** en Offshore CX Confidence Index 2025 | Revista Clevel |
| Empresas del sector que ya usan IA | **> 76%** | Revista Clevel |
| Concentración | Bogotá ~50% del empleo; Medellín y Barranquilla ganando peso | Revista Clevel |
| Presión 2026 | salario mínimo **+23%** y comparación permanente entre países | Revista Clevel / BPrO |

Lectura: el sector es grande, formal y exportador, y **está bajo presión de costos**. Un operador AI-first no compite por hora-hombre: compite por **costo por contacto resuelto**. Ahí es donde entramos.

La asequibilidad del talento queda además demostrada por el propio gremio: el BPO es hoy uno de los sectores más inclusivos del mercado laboral (más del 60% jóvenes, 56% mujeres), lo que significa que **el costo humano no va a bajar más**; la palanca de productividad solo puede venir de tecnología.

### 2.2 Qué paga hoy el cliente por un humano (tarifas facturables)

Fuente: **rethinkCX BPO Cost Index v2026.2 (may-2026)**. Son tarifas *facturables* (lo que cobra el proveedor), no salario.

| Concepto | Valor |
|---|---|
| Voz, tarifa mid-market Colombia | **$14 USD/hora** (rango proveedor $11–18) |
| Por complejidad | Back office $14,00 · **Tier-1 $17,50** · Tier-2 $23,80 · Tier-3 $35,00 |
| Por canal | Voz $14,00 · Chat $11,90 · Email $11,20 · Back office $10,50 |
| Recargo cobertura 24/7 | hasta **+25%** |
| Ejemplo publicado | 20 asesores voz Tier-1 jornada hábil ≈ **$672.000 USD/año** (~$56.000 USD/mes) |
| Comparación regional | Filipinas $12 · India $13 · **Colombia $14** · México $15 · Costa Rica $17 · EE.UU. $35 |

Traducido a pesos (TRM 3.090): **una posición de 8 h/día cuesta $7.613.760/mes**; cobertura 24/7 real (720 h/mes + 25% de recargos) ≈ **$38,9M/mes**. El **minuto humano facturado es $721 COP**; con la ocupación típica de un asesor (40%), cada minuto realmente hablado le cuesta al cliente **$1.803 COP**.

### 2.3 Qué cobra la voz IA (nuestra competencia real)

| Referencia | Precio | Fuente |
|---|---|---|
| Costo real del stack de voz IA (todo incluido) | **$0,07–0,30 USD/min** (bundled $0,10–0,18; BYOK $0,13–0,31) | Techsy, may-2026 |
| Vapi / Bland / OpenAI Realtime directo | $0,05 plataforma + capas / $0,09 fijo / ~$0,30 sin caching | Techsy |
| Agente de voz IA LATAM | implementación **15.000–20.000 USD**; operación 300–1.500 USD/mes pass-through | Catalizadora, may-2026 |
| Voz IA + CRM (global, EE.UU.) | **$0,15–0,50 USD/llamada** vs $4–8 humano | CallSphere, sep-2026 |
| Voicebot y call center en Colombia | implementación **desde $5.900.000**, mensualidad **desde $890.000**, minuto **$300–700 COP** | Mentora Colombia, 2026 |

**Tres conclusiones incómodas pero necesarias:**

1. **El "12x más barato" es un dato estadounidense, no colombiano.** Con el humano local a $14 USD/h, el ahorro real se calcula con AHT y ocupación: **61–67% por contacto** (§4), no 12x. Ese es el número que aguanta una auditoría del cliente.
2. **Hay oferta local cotizando $300–700 COP/min y $890.000/mes.** Nuestro costo all-in es **$379 COP/min**: el extremo bajo de esa banda **está por debajo de nuestro costo**. No se compite ahí. Se compite por cobertura 24/7, integración real (agenda, tickets, CRM) y evidencia auditable, que es justo lo que un revendedor de minutos no puede dar.
3. **La mayoría de los proyectos mueren en la integración, no en la tecnología**: solo el 22% de las empresas pasa la prueba de concepto y un 4% extrae valor sustancial (BCG 2025, citado por CallSphere). Nuestra ventaja no es el modelo de lenguaje: es que la agenda, el ticket y la evidencia ya existen.

### 2.4 Costos laborales locales (base del modelo humano)

| Concepto | Valor 2026 | Fuente |
|---|---|---|
| Salario mínimo legal mensual | **$1.750.905** | Decreto, vigente 2ª mitad 2026 (El Cronista) |
| Auxilio de transporte | **$249.095** | Ídem |
| Total de referencia mínimo | **$2.000.000** | Ídem |
| Incremento frente a 2025 | **~23%** | Ídem |
| TRM de mercado vigente (22-sep-2026) | **~$3.204,58** | El Cronista |

> **Alerta de TRM (importante):** nuestro motor de precios está calibrado con TRM 3.090. Con la TRM vigente (~3.204) el costo all-in sube de $379 a **~$392 COP/min** y el margen del overage baja de 45,1% a **~43,2%** (sigue sobre el piso de 40%). Está cubierto por test de estrés (`estres por TRM` en `lib/center/plans.test.ts`): la escalera de Center sigue cumpliendo R0–R7 incluso con TRM 3.300, donde el plan más grande queda en 30,2% a uso completo. Por eso 3.300 es el disparador de revisión de la política.

---

## 3. Nuestra economía real (y la corrección del estudio v1)

### 3.1 Costo de la IA (verificado en `lib/telnyx/costs.ts`)

| Rubro | Valor |
|---|---|
| Voz inbound CO (Telnyx) | $0,065 USD/min |
| AI Assistant (LLM + STT + TTS) | $0,0575 USD/min |
| **Costo all-in del minuto** | **$0,1225 USD/min = $379 COP** |
| Número dedicado CO | $13,50 USD/mes = **$41.715 COP** |
| **Minuto adicional (overage)** | **$690 COP (45,1% de margen)** |

### 3.2 Costo del humano (esto estaba mal en el estudio v1)

El documento anterior afirmaba que un agente cargado costaba entre **$690.000 y $1.390.000 COP/mes**: era un error de unidades mezclado con el total por posición. El cálculo correcto, con datos oficiales y en código (`humanAgentEconomics`):

| Paso | Valor |
|---|---|
| Salario del perfil (1,3 × SMMLV 2026) | $2.276.177 |
| + auxilio de transporte | $249.095 |
| **Base mensual** | **$2.525.272** |
| + prestaciones, seguridad social y parafiscales (55%) | $3.914.172 |
| + supervisión, QA, WFM y tecnología (20%) | **$4.697.006/mes** |
| **Costo por hora** (176 h) | **$26.688 COP = $8,64 USD** |
| Facturando a tarifa de mercado BPO ($14 USD/h) | **margen 38%** |
| Facturando al piso Upway del gestor ($12,9 USD/h) | **margen 33%** |
| Costo por **minuto realmente hablado** (ocupación 40%) | **$1.112 COP** |
| Lo que paga el cliente por ese minuto hablado (tarifa $14/h) | **$1.803 COP** |

**Conclusión que cambia la estrategia:** el humano deja 33–38%; la IA deja 55–64%. Entonces el humano no se vende como negocio, se vende como **conformidad de experiencia**. Fase 1: el escalamiento va al equipo del cliente (costo marginal cero para Upway, y el cliente ya tiene a quién escalar). Fase 2: "gestor humano Upway" por hora, con cupo limitado y precio publicado.

### 3.3 Los tres arbitrajes que sí existen (y por qué el pitch no es "minuto barato")

| Arbitraje | Humano | Upway |
|---|---|---|
| **Concurrencia** | 1 llamada por asesor | todas las que entren en paralelo, al mismo costo marginal |
| **24/7** | recargos nocturnos y dominicales hasta +25%, tres turnos | sin recargo (el mismo plan cubre madrugada y festivos) |
| **Ociosidad** | se paga el 100% del turno aunque hable el 40% | solo se paga por minuto hablado |

Por eso el pitch correcto es: *"esto sustituye N posiciones y cubre 24/7, con el dato confirmado y todo auditable"*, y no *"te vendo minutos a $0,22"*. Si el cliente pide minutos baratos, un BPO con ocupación alta le gana en ese terreno — y no hay que jugar ahí.

---

## 4. Tarifa final de Upway Center (sin IVA)

Misma tarifa de minuto adicional ($690) y mismas reglas R0–R7 que Health e Inmobiliarias. La escalera la verifica `auditTariff` en `lib/center/plans.test.ts`.

| Plan | Línea | Min. incl. | Núm. | Simultáneas | **Precio/mes** | Implementación | $/min | Margen 100% | Margen 55% | Escalón |
|---|---|---|---|---|---|---|---|---|---|---|
| **Línea** | Atención | 1.000 | 1 | 2 | **$699.000** | $490.000 | 699 | 39,8% | 64,2% | — |
| **Atención** | Atención | 3.000 | 2 | 6 | **$1.949.000** | $990.000 | 650 | 37,4% | 63,6% | 625/min |
| **Soporte** | Soporte N1 | 8.000 | 4 | 16 | **$4.990.000** | $1.890.000 | 624 | 35,9% | 63,2% | 608/min |
| **Operación 24/7** | Soporte N1 | 25.000 | 8 | 40 | **$14.990.000** | $3.400.000 | 600 | 34,6% | 63,0% | 588/min |
| **Minuto adicional** | — | — | — | — | **$690/min** | — | — | 45,1% | — | — |
| **Empresa (Custom)** | Soporte N1 | 60k–200k | 10+ | 100 | A cotizar (piso **$550/min**) | a cotizar | — | ≥30% | — | — |

**Tabla comparativa de las tres verticales** (mismo motor, misma tarifa de minuto, distinto alcance):

| Minutos | Health | Inmobiliarias | Center |
|---|---|---|---|
| 600 | $429.000 | $399.000 | — |
| 1.000 | — | — | $699.000 |
| 1.800 | $1.199.000 | — | — |
| 3.000 | — | — | $1.949.000 |
| 8.000 | $4.890.000 | — | $4.990.000 |
| 10.000 | — | $5.890.000 | — |
| 25.000 | $14.490.000 | — | $14.990.000 |

Center paga un $/min ligeramente mayor que Health en volúmenes altos (624 vs 611; 600 vs 580) porque incluye árbol de diagnóstico, tickets, agenda de visitas y escalamiento gestionado. Eso es lo único que justifica un precio distinto: **más integración, mismo costo de minuto.**

### 4.1 La cuenta por contacto (el número que se le dice al cliente)

| Línea | AHT | Contacto con Upway | Contacto humano facturable (ocupación 40%) | Ahorro |
|---|---|---|---|---|
| Atención al cliente (plan Atención) | 5 min | **$3.248** | $9.015 | **−64%** |
| Soporte técnico N1 (plan Soporte) | 7 min | **$4.366** | $12.621 | **−65%** |
| Atención al cliente (plan Línea) | 5 min | $3.495 | $9.015 | −61% |
| Soporte N1 (plan Operación) | 7 min | $4.197 | $12.621 | −67% |

**Honestidad obligatoria:** ese ahorro es contra un humano con **ocupación real (40%)**. Si el asesor estuviera ocupado el 100% del tiempo, su costo por contacto sería 5 × $721 = $3.605 y el ahorro bajaría a ~10%. Por eso el argumento nunca puede ser solo precio: es precio **+ concurrencia + 24/7 + evidencia auditable**, y en picos (donde el humano necesita contratar y nosotros no) la diferencia se dispara.

---

## 5. Viabilidad

### 5.1 El costo que hay que cubrir antes de festejar

Ser contact center no solo suma ingresos: suma **operación**. Antes del primer cliente hay que poder configurar KB, conectar sistemas, probar y hacer QA. Eso es **1 FTE de operaciones** (perfil técnico, ~2× SMMLV + cargas ≈ **$5,8M/mes**).

| Plan | Margen por cliente (uso completo) | Margen por cliente (55% de uso) | Clientes para pagar el 1er FTE (uso completo / 55%) |
|---|---|---|---|
| Línea | $278.285 | $448.835 | 21 / 13 |
| Atención | $728.570 | $1.240.220 | **8 / 5** |
| Soporte | $1.791.140 | $3.155.540 | **3,2 / 1,8** |
| Operación 24/7 | $5.181.280 | $9.445.030 | 1,1 / 0,6 |

**Tres conclusiones de viabilidad:**

1. **El plan de entrada no sostiene la operación.** Vender 20 planes Línea no paga un FTE; vender 3 planes Soporte sí. Por eso el cliente objetivo es una operación con volumen real (atención con 3-8 personas o servicio técnico de campo), no el micro-negocio.
2. **La unidad de negocio es la línea activa, no el cliente.** Lo que hay que vigilar es minutos consumidos, líneas activas y horas de operación por cliente.
3. **Con prepago, el riesgo de caja es bajo**: el cliente paga antes de consumir (modelo de recarga ya existente) y nosotros no financiamos el consumo ni la ociosidad.

### 5.2 Escenarios a 12 meses (mezcla realista)

| Escenario | Clientes | MRR | Margen a 55% de uso | Costo de operación | Contribución/mes |
|---|---|---|---|---|---|
| Conservador | 3 Atención + 3 Soporte | **$20.817.000** | 63,3% ($13.187.280) | 1 FTE ($5,8M) | **~$7,4M** |
| Base | 8 Atención + 6 Soporte + 1 Operación | **$60.522.000** | 63,3% ($38.300.030) | 2 FTE ($11,6M) | **~$26,7M** |
| Optimista | 20 Atención + 12 Soporte + 3 Operación | **$143.830.000** | ~63% ($91M) | 4 FTE ($23,2M) | **~$68M** |

Además, el escenario Base genera **~$22,7M de ingresos únicos por implementación** (8×$990.000 + 6×$1.890.000 + $3.400.000), que es lo que financia la operación mientras se estabiliza el recurrente.

### 5.3 Capacidad técnica (requisito, no supuesto)

| Tema | Estado | Acción antes de firmar |
|---|---|---|
| Simultaneidad | default del proveedor de voz: 2; se amplía con approval | tramitar approval para 16/40 simultáneas **antes** de vender Soporte/Operación |
| Números | 1–8 por cliente, alta con la portabilidad del número actual | proceso ya existente (Health) |
| Grabación y almacenamiento | retención definida por plan (90 días / 1 año) | costo de almacenamiento a validar con consumo real |
| IA y KB | protocolo cerrado + guardarraíl "si no está en la KB, no inventa" | catálogo cerrado obligatorio en el onboarding |
| Escalamiento humano | Fase 1 al equipo del cliente; Fase 2 gestor Upway | definir a quién escala y con qué prioridad en el onboarding |

---

## 6. Go-to-market

### 6.1 Cliente ideal (ICP)

1. **Servicio técnico de campo**: electrodomésticos, climatización/HVAC, ascensores, maquinaria, equipos médicos, telecomunicaciones/ISP, energía solar. El flujo de oro es *"recibe la falla → agenda la visita"*, que es exactamente donde la IA no se equivoca si el protocolo está definido.
2. **Atención al cliente con alto WISMO** (¿dónde está mi pedido?): e-commerce, retail, logística, servicios públicos, educación, bancos digitales.
3. **Cross-sell inmediato**: Health (clínicas ya con línea de voz → "añade línea de atención") e Inmobiliarias (posventa, arriendo, mantenimiento). **CAC ≈ 0**.

### 6.2 Cómo se vende

| Elemento | Cómo |
|---|---|
| Entrada | prueba de 30 días con métricas reales (casos registrados, visitas agendadas, ahorro por contacto) |
| Argumento central | costo por contacto resuelto (**−61% a −67%** vs humano con ocupación real) + 24/7 + concurrencia + evidencia auditable |
| Objeción "¿y si la IA no resuelve?" | tier-1 con escalamiento a humano en caliente, protocolo cerrado (no improvisa), grabación y log por llamada |
| Objeción "¿y si me quedo sin minutos?" | minuto adicional $690, sin cortes (la llamada nunca se cae por saldo) |
| Lo que NO se dice | "resolvemos el 85% de todo", "reemplazamos todo tu call center", "te vendo minutos baratos" |
| Canal | inbound + referidos + ecosistema Upway. **Sin outbound comercial** (RNE) |

---

## 7. Riesgos y mitigación

| Riesgo | Por qué importa | Mitigación (ya definida) |
|---|---|---|
| **Calidad y marca** | la IA atiende con la marca del cliente: una mala llamada es nuestra culpa | protocolo cerrado + guardarraíl "si no está en la KB, no inventa", grabación, muestreo de QA y reporte mensual |
| **Regulatorio de contacto** | el outbound comercial/publicitario obliga a consultar el RNE (Ley 2300 de 2023) | no se hace outbound comercial. El seguimiento va por el canal que el cliente autorizó |
| **Datos personales** | somos encargados del tratamiento, no responsables | DPA firmado por cliente, finalidad declarada, retención por plan y trazabilidad por llamada (mismo estándar de Health) |
| **Transparencia de IA** | el usuario debe saber que habla con un asistente y que se graba | aviso al inicio de la llamada ("soy un asistente virtual, esta llamada se graba") |
| **Dependencia del proveedor** | Telnyx/LLM pueden subir precios | capa de abstracción ya existente + tarifa revisable por TRM (disparador 3.300) |
| **Sobrevender resolución** | prometer "85% resuelto" sin datos propios es publicidad engañosa | se promete disponibilidad, captura y evidencia; la resolución se mide y se reporta a los 3 meses |
| **KB mala = IA mala** | si el cliente no define protocolos, la IA improvisa | el onboarding no cierra sin catálogo cerrado y umbrales de escalamiento (gate ya usado en Health) |
| **Convertirnos en BPO** | contratar nómina para picos mata el margen | el humano es Fase 2 con cupo limitado y precio publicado, nunca la base del servicio |
| **TRM** | el costo está en dólares y el precio en pesos | test de estrés en código (a 3.300 la escalera todavía cumple R0–R7) + revisión de política |

---

## 8. Qué construir (concreto, sobre lo que ya existe)

| # | Pieza | Reutiliza |
|---|---|---|
| 1 | Vertical `center` en `lib/verticals.ts` (label "Upway Center", ruta de onboarding) | patrón Health/Inmobiliarias |
| 2 | Onboarding `/center/onboarding` con **selector de línea de servicio** y catálogos cerrados | `app/health/onboarding` + `components/health/plan-picker` |
| 3 | Landing `/center` (hero → problema → dos líneas → precios → CTA) | arquitectura de `/inmobiliarias` y `/precios` |
| 4 | **Toggle de cross-sell** en el panel Health/Inmobiliarias: "Añadir línea de atención" | planes y cobro ya existentes |
| 5 | Tablero de operación: casos registrados, visitas agendadas, escalamientos, AHT, consumo vs plan | `LlamadaLog` + panel `/health` |
| 6 | Aviso de IA y grabación en el saludo + DPA en el flujo de activación | plantillas de activación ya existentes |
| 7 | Reporte mensual por cliente (evidencia para su gerencia) | `npm run precios` como plantilla de reporte auditable |

Los precios **ya están** en `lib/center/plans.ts` con tests. Lo que falta es producto y operación, no tarifa.

---

## 9. Decisión: GO con cinco condiciones medibles

**GO** para Upway Center como contact center AI-first, limitado a **atención al cliente** y **soporte técnico N1** (inbound, tier-1).

Condiciones para abrir la primera línea:

1. **1 FTE de operaciones asignado antes del primer cliente** (configuración, QA y soporte a la operación). Sin ese rol, cada cliente nuevo es riesgo de calidad.
2. **Approval de simultaneidad tramitado** con el proveedor de voz antes de vender Soporte (16) u Operación (40).
3. **DPA + aviso de IA y grabación** implementados en el flujo de llamada (no prometidos en el contrato y olvidados en el producto).
4. **3 pilotos con catálogo cerrado** antes de publicar el producto: la KB y los protocolos son el trabajo real.
5. **Un tablero mínimo** (casos, visitas agendadas, escalamientos, consumo) antes del cliente #5.

**NO-GO** si aparece cualquiera de estos: outbound comercial masivo, cobranza, prometer tasa de resolución antes de medirla, o vender simultaneidad que el proveedor no aprobó.

---

## 10. Fuentes y verificación

### Fuentes (consultadas 22-sep-2026)

| Tema | Fuente |
|---|---|
| Tarifas billables de contact center en Colombia (v2026.2, may-2026) | rethinkCX BPO Cost Index — `rethinkcx.com/resources/bpo-cost-index/colombia` |
| Sector BPO Colombia 2026: PIB, empleo, exportaciones, adopción de IA | Revista Clevel — "BPO colombiano llega a 2026 con empleo récord, pero bajo presión" (14-ene-2026) |
| SMMLV y auxilio de transporte 2026 · TRM vigente | El Cronista Colombia (abr-2026 / 22-sep-2026) |
| Precios y capas de costo de voz IA (may-2026) | Techsy — "Precios de agentes de voz IA en 2026" |
| Precios de voz IA en español LATAM (may-2026) | Catalizadora — "¿Cuánto cuesta un agente de voz IA en español LATAM?" |
| Benchmarks por resolución IA vs humano (sep-2026) | CallSphere — "Cost-Per-Resolution: AI vs Human Benchmarks for 2026" |
| Unit economics de voz IA (ago-2026) | Dilr — "The unit economics of an enterprise voice AI programme" |
| Precios de voicebots en Colombia 2026 | Mentora Colombia — "Voicebots en Colombia: agentes de IA telefónicos y precios 2026" |
| Registro de Números Excluidos (Ley 2300 de 2023) | CRC — micrositio RNE (`crcom.gov.co`) |

### Verificación (reproducible)

```bash
npm test          # lib/center/plans.test.ts: escalera R0-R7, estrés TRM, economia humana, cuenta por contacto
npx tsc --noEmit  # 0 errores
npm run precios   # reporte de las 3 verticales + politica vigente, calculado sobre el codigo real
```

### Pendientes antes de publicar la tarifa de Center

- [ ] Validar el costo de almacenamiento de grabaciones (1 año) con volumen real.
- [ ] Confirmar con un piloto el **AHT real** por línea (hoy son supuestos: 5 y 7 min).
- [ ] Definir la tasa de escalamiento objetivo y medirla antes de escribir cualquier SLA de resolución.
- [ ] Actualizar el motor a la TRM vigente (~3.204) y re-ejecutar la auditoría (los márgenes siguen cumpliendo R0–R7).

---

*Estudio v2 (reemplaza al v1). Precios en COP sin IVA. TRM del motor 3.090; TRM de mercado ~3.204. Todo número de margen, ahorro o costo humano de este documento se calcula en `lib/center/plans.ts` y se verifica con `npm test` y `npm run precios`.*




