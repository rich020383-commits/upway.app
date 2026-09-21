# Upway Center — Estudio, caso de uso y viabilidad

**Estado:** Análisis interno (propuesta). TRM referencia: **3.090 COP/USD** (2026).
**Hook:** Upway deja de venderle a los call centers y **se convierte en el contact center**. `Sophie v2` (IA de voz) es nuestro agente; la agenda Upway, el CRM/ERP y la verificación empresarial (NIT/cámara/RUT) son nuestra infraestructura. El negocio es **AI-first contact center**: la IA atiende el 70-80% del volumen de tiera-1 de forma autónoma, y escala a humanos (clientes o los nuestros) solo cuando la negociación lo exige.

---

## 1. Estudio de mercado (Colombia 2026)

### 1.1 Costo del agente humano (lo que paga el cliente hoy)

Fuente: **rethinkCX BPO Cost Index 2026** (`rethinkcx.com/resources/bpo-cost-index/colombia`) — tarifas *billables* (fully-loaded), no el salario líquido.

| Concepto | Valor |
|---|---|
| Tarifa voz Tier-1 (Bogotá/Medellín) | **$14 USD/hora** |
| Rango proveedor | **$11 – 18 USD/hora** |
| Desglose del $14 | 30% salario ($2.80–5.60/hr) + 40% beneficios/supervisión QA/tech/facilities + 30% tooling & margen |
| Premium cobertura 24/7 | **hasta +25%** (recargo nocturno + turnos) |
| Canal / complejidad | Voice $14 → Tier-2 $23.8 → Tier-3 $35/hr |
| **Colombia vs USA** | **$14 vs $35/hr** — ~60% de ahorra fuerte vs seat interno USA |

**Fuente oficial de salarios (MinTrabajo):** SMMLV 2026 = **$2.100.000 COP/mes** (según comunicado MinTrabajo: *"Salario vital: $2.000.000 a partir de enero de 2026"*). Un agente bilingüe real cobra entre **2.5× y 3.5× el SMMLV** (≈ $5.2M–$7.4M bruto mensual); la empresa le aplica **~130% de cargas sociales/prestaciones** → agente cargado entre **~$690.000 y ~$1.390.000 COP/mes por FTE** (monolingüe) y **~$1.250.000–2.700.000 COP/mes** (bilingüe 24/7).

> **Conclusión mercado:** un seat de voz Tier-1 cargado en Colombia cuesta **$14/hr ≈ $699.000 COP/mes por FTE (8h)**. Una cobertura 24/7 real (3 turnos + supervisión) ronda los **$2.4M–3.4M COP/mes equivalentes**, antes de QA, WFM, facilities y margen de BPO.

### 1.2 Qué cobran hoy los BPO (competencia)

| Player / modelo | Precio típico | Comentario |
|---|---|---|
| BPO tradicional Colombia | $14–18 USD/hr ≈ **$4.3M–5.6M COP/mes por FTE 24/7** | Precio *billable* fully-loaded incluido |
| Fusion CX / Teleperformance nearshore | **$0.80–1.50 USD por contacto resuelto** | Modelo por contacto; la AI reduce el costo efectivo |
| Voz IA genérica (Twilio, Vonage) | **$0.03–0.08 USD/min** consumido | Solo infraestructura; sin agente IA ni agenda ni CRM |

**Precio de voz IA con agente (comparables):** plataformas agenticas cobran **$0.15–0.30 USD/min** de voz con IA conversacional + integración CRM. Upway puede posicionarse en la parte alta con valor agregado (agenda real + datos conformes + escalamiento humano) y aun así quedar por debajo del seat humano cargado.

---

## 2. Costos reales de Upway (infraestructura existente)

Fuente: `lib/telnyx/costs.ts` (Telefonía + IA) + `lib/health/plans.ts`.

| Rubro | Costo real | Precio Upway | Margen |
|---|---|---|---|
| Voz inbound CO (Telnyx) | **$0.065 USD/min** | — | — |
| AI Assistant (LLM+STT+TTS) | **$0.0575 USD/min** | — | — |
| **Costo voz all-in** | **$0.1225 USD/min** ≈ **$379 COP/min** | — | base |
| Número dedicado CO/mes | **$13.50 USD** ≈ **$41.715 COP** | — | fijo/línea |
| **Overage cliente** | — | **$0.177 USD/min** ≈ **$547 COP/min** | +27% margen voz |

Estructura de planes validada en Health (`lib/health/plans.ts`):
- Consultorio → $769.000 COP / 600 min ≈ $1.282 COP/min incluido
- Clínica Pro → $1.914.000 COP / 1.800 min ≈ $1.063 COP/min incluido
- IPS Plus → $7.109.000 COP / 8.000 min ≈ $887 COP/min incluido

> Upway vende bundles a **≈ 2.6–2.9× el costo marginal**, con overage a 1.44× costo. Cube costos fijos asumiendo **50–60% de utilización del paquete** — el estándar voz-IA SaaS.

---

## 3. El arbitraje real (por qué Upway Center es viable y no es "voz más barata por minuto")

Comparar minuto-a-minuto (costo IA $0.1225 vs salario/hora humana) **no** es el juego. El arbitraje está en tres variables que la competencia humana paga caro:

1. **Concurrencia infinita.** Un agente humano atiende **1 llamada a la vez**; una IA atiende todas las que llegan en paralelo con el mismo costo marginal. En picos, Upway no paga agentes extra, BPO sí.
2. **24/7 sin premium.** Cobertura toda la noche, fin de semana y festivos. El humano paga recargo nocturno (35%), dominical (75–80%) y triple turno. **IA paga 0.**
3. **Cero costo fijo de ocupación.** Un agente se paga el salario aunque esté inocupado (60% occ. típico → 40% paga ocioso). La IA **solo paga por minuto hablado**.

### Ejemplo número-real (volumen medio, cobertura 24/7)

Operación: línea de atención al cliente que genera **6.000 minutos/mes** de voz entrante (≈ 3 FTE humanos 24/7 reales).

| Alternativa | Costo mensual (COP) |
|---|---|
| 3 agentes humanos 24/7 (rethinkCX $14hr × 1.25 premium × 3 × 160h) | **≈ $2.600.000 COP** |
| IA Upway: 6.000 × $379 + número $41.715 | **≈ $2.320.000** → plan Plus incluido **$1.999.000 COP** |
| **Ahorro cliente** | **≈ 23–24% vs seat 24/7** + concurrencia infinita (más en picos) |

Con el plan Plus a **$1.999.000 COP**, Upway cubre $1.999.000 de ingreso con costo ~$1.970.000 (a 55% util) y margen base + overage ($547/min) sobre volumen extra. En picos donde un BPO contrata agentes extra, Upway no contrata nada → **margen acelerado por arriba**.

---

## 4. Propuesta de empaquetado (3 servicios iniciales)

**Servicios iniciales (MVP Upway Center):**
1. **Recepción / Conmutador inteligente** — contesta, dirige, toma mensajes, agenda visitas/citas, WhatsApp básico. Tierra 1.
2. **Soporte técnico** — triage de fallas, programa visitas técnicas, consulta de órdenes/estado, base de conocimiento. Tier-1 con escalado a técnico humano.
3. **Atención al cliente** — consultas, estado de pedidos, reclamos, gestión de garantías/devoluciones, retención informativa, upsell ligero. Tier-1/2.

### Planes (Colombia — TRM 3.090)

| Plan | Cobertura | Mins incl. | Precio mensual | vs humano 24/7 | Overage |
|---|---|---|---|---|---|
| **Essential** | Recepción 8h (1 línea) | **1.200** | **$449.000 COP** | 37% ↓ vs FTE 8h $700k | $547/min |
| **Pro** | Soporte técnico + agenda visitas | **3.000** | **$999.000 COP** | 47% ↓ vs 24/7 parcial $1.9M | $547/min |
| **Plus** | Atención cliente 24/7 full | **8.000** | **$1.999.000 COP** | 55% ↓ vs 24/7 3 FTE $4.4M | $547/min |
| **Empresa** | Multi-línea, SLA, integración CRM/HIS | a medida | contacto | — | $547/min |

**Unit economics (asumiendo 55% utilización del bundle — estándar voz-IA):**
- Essential: 1.200×55%×$379 + $41.715 = **$293.000**; margen ≈ **$156.000** (35%).
- Pro: 3.000×55%×$379 + $41.715 = **$625.000**; margen ≈ **$374.000** (37%).
- Plus: 8.000×55%×$379 + $41.715 = **$1.708.000**; margen ≈ **$291.000** (15%).
- Overage $547 COP/min ≈ **30% margen voz** sobre volumen extra.

> **Nota de viabilidad:** a 100% de utilización el margen se aprieta (costo $379/min > precio bundle efectivo). El modelo funciona por **oversubscription** (bundle ~1.6–2× el uso real típico) + overage. Es la **misma estructura que ya usa Health** → riesgo operativo conocido y validado.

---

## 5. Casos de uso — Flujos típicos

**Servicio Técnico (Pro):**
```
Cliente llama → Sophie (voz humana) → valida NIT/RUT →
triage de falla (KB) → agenda visita técnica sobre agenda Upway →
confirma vía WhatsApp + link de seguimiento → si falla crítica, escala a técnico humano con contexto.
```
→ La visita técnica luego puede coordinarse con logística Upway (pickup/dropoff con transporte tercerizado) → cierre integrado.

**Atención al Cliente (Plus):**
```
Cliente llama → Sophie valida cliente (CRM) → consulta orden/estado/garantía →
resuelve (KB) → si requiere gestoría (reclamo/garantía), crea ticket en CRM y agenda callback humano →
seguimiento automático y recordatorios.
```

---

## 6. Go-to-market — quiénes compran

**Segmento inicial:** pymes con línea de atención/recepción hoy atendida 8h-18h por **1-5 agentes humanos** o por WhatsApp sin SLA. Típicos: clínicas (ya clientes Health → cross-sell inmediato), inmobiliarias (ya landings), e-comm, retailers, bancos digitales, utilities.

**Cross-sell inmediato:** clientes **Health** e **Inmobiliarias** pueden añadir Upway Center como “línea de atención al cliente” con un toggle → **CAC ≈ 0**.

**Requisitos para venderlo como operación propia (no como BPO):**
1. Cliente ya usa voz Upway → activar Center es un plan más.
2. Si no usa voz todavía → necesitamos número dedicado + integración CRM (API/webhook ya existen en `lib/health/plans.ts`: `api-pull`/`webhook-push`/`csv-manual`).
3. **Verificación empresarial** (NIT/cámara/RUT) — proceso ya en `lib/business-ops.ts`; reutilizable para registrar la empresa cliente del Center.

---

## 7. Mi opinión (honesto)

**Viabilidad: SÍ — con condiciones.**

✅ **Fuerte:** arbitraje real (concurrencia + 24/7 + zero idle cost); infraestructura 100% existente (Telnyx, agenda, Bold, auditoría, verticales en `lib/verticals.ts`); cross-sell CAC ≈ 0 con base Health; 60% de ahorra vs BPO en coberturas 24/7.

⚠️ **Condición 1:** No es un negocio de “minutos baratos”. Competimos en **headcount reemplazado + SLA 24/7**. Si un cliente pide “300 minutos/mes a $0.177”, un BPO humano le gana. El pitch debe ser: “esto sustituye N agentes + infra 24/7, por X%”.

⚠️ **Condición 2:** Margen apretado si consume todo el bundle. Hay que (a) asumir 50-60% util como Health, (b) vigilar overage, (c) fidelizar con integración CRM.

⚠️ **Condición 3:** No entrar con SLA tier-3 todavía (soporte profundo, reclamos complejos) hasta que KB + escalado estén maduros (regla de Health: no prometer lo que no se puede cumplir).

**Posicionamiento:** no decir “somos un call center más”. Decir: *“Upway Center: contact center AI-first. La IA responde, agenda y escala; vos decidís cuándo interviene un humano.”*

---

## 8. Próximos pasos (concretos, no especulativos)

1. Crear vertical `id: 'center'` en `lib/verticals.ts` → label `Upway Center`, onboarding `/center/onboarding`, mini-landing `/upway-center`.
2. Añadir planes en `lib/health/plans.ts` (o `lib/center/plans.ts`): Essential/Pro/Plus con minutos incluidos + overage ya modelados en `estimateCallCosts`.
3. Landing `/upway-center`: arquitectura idéntica a Health/Inmobiliarias (hero → problema → capacidad → datos conformes/auditables → CTA).
4. Reutilizar la verificación empresarial de `lib/business-ops.ts` para el onboarding de empresas cliente.
5. **Cross-sell toggle** en el dashboard de clientes Health/Inmobiliarias: “Añadir línea de atención → Upway Center”.

---

*Documento de análisis interno. Precios en COP — TRM 3.090 USD/COP. Fuente mercado: rethinkCX BPO Cost Index 2026 + MinTrabajo (SMMLV 2026). Internos Upway: `lib/telnyx/costs.ts`, `lib/health/plans.ts`.*
.
