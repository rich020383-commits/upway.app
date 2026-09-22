# Upway — Política de precios (acta de decisión)

**Fecha del acta:** 22-sep-2026 · **Vigencia de la tarifa final:** **1-oct-2026**
**Alcance:** Upway Health e Inmobiliarias (voz IA 24/7). Upway Center queda fuera hasta recalcular su escalera con esta política.
**Código que la ejecuta:** `lib/pricing/rules.ts`, `lib/activation.ts`, `lib/health/plans.ts`, `lib/health/plans-enterprise.ts`, `lib/inmobiliaria/plans.ts`, `lib/telnyx/costs.ts`.
**Pruebas:** `lib/pricing/rules.test.ts`, `lib/activation.test.ts`, `lib/health/plans.test.ts` · **Reporte:** `npm run precios`.

---

## 1. Decisiones ratificadas

| # | Decisión | Efecto | Dónde vive |
|---|---|---|---|
| **D1** | **Bajar Health 26–44%** (Consultorio $769.000 → **$429.000**, Pro → $1.199.000, Plus → $4.890.000, Enterprise → $14.490.000) | El precio deja de financiar el desarrollo clínico que no se entrega: hoy se cobra por atender, confirmar el dato conforme y auditar | `lib/health/plans.ts`, `plans-enterprise.ts` |
| **D2** | **Overage único de $690 COP/min** (Health $750/$700 → $690; Inmobiliarias $547 → $690) | 45,1% de margen (piso 40%) y por debajo del minuto humano facturado ($721). Misma tarifa en todos los planes | `lib/telnyx/costs.ts` + `rules.ts` |
| **D3** | **Red de Inmobiliarias +17,8%** ($4.999.000 → **$5.890.000**) | Estaba a 20,1% de margen a uso completo, bajo el piso del 30%. Se corrige el precio, no el producto | `lib/inmobiliaria/plans.ts` |
| **D4** | **Módulo Identidad Conforme = $290.000/sede/mes, precio final** | Deja de anunciarse como "precio de adopción". Es la palanca de ARPA (+67,6% en Consultorio) y de margen (~100%) | `lib/health/plans.ts` |
| **D5** | **Los clientes actuales conservan su tarifa hasta la renovación** | Nadie sufre la subida del overage ni la renegociación a la baja en medio de un contrato | `rules.ts` (`LEGACY_TARIFFS`, `resolveContractTariff`) + `lib/activation.ts` |

**Nuevos precios (resumen):**

| Health | Antes | Final | | Inmobiliarias | Antes | Final |
|---|---|---|---|---|---|---|
| Consultorio 600 | $769.000 | **$429.000** | | Starter 600 | $399.000 | $399.000 |
| Clínica Pro 1.800 | $1.914.000 | **$1.199.000** | | Profesional 1.500 | $999.000 | **$959.000** |
| IPS Plus 8.000 | $7.109.000 | **$4.890.000** | | Sucursal 4.000 | $2.499.000 | **$2.459.000** |
| IPS Enterprise 25.000 | $19.617.000 | **$14.490.000** | | Red 10.000 | $4.999.000 | **$5.890.000** |
| Minuto adicional | 750 / 700 | **$690** | | Minuto adicional | 547 | **$690** |

---

## 2. Transición y fechas

| Fecha | Qué pasa |
|---|---|
| 22-sep-2026 | Acta firmada. Precios cargados en el catálogo; los contratos previos siguen con su tarifa. |
| **1-oct-2026** | **Vigencia de la tarifa final** para activaciones nuevas y para pagos posteriores al corte. |
| Renovación de cada cliente anterior | Pasa a la tarifa final en el momento de renovar (mismo plan, mismo producto). |
| Revisión trimestral | `npm run precios` + márgenes reales contra consumo observado. |

---

## 3. Cómo se aplica el grandfathering (mecánica, no promesa)

1. **Fuente de verdad:** el primer pago con estado `PAID` del cliente (por `organizationId` o `clinicId`) en `ActivationPayment`. Ese es el inicio del contrato vigente.
2. **Corte:** `FINAL_TARIFF_EFFECTIVE_FROM = '2026-10-01'`.
3. **Firmó antes y no ha renovado** → se cobra su tarifa histórica, tomada de `LEGACY_TARIFFS` (incluye su overage original: $547 en inmobiliarias, $750/$700 en Health).
4. **Renovó después del corte** → tarifa final.
5. **El monto se calcula en el servidor** con la tarifa aplicada (nunca con el precio que envíe el cliente) y queda trazado en el intento de pago: `statusMessage` dice "tarifa vigente del cliente" o "tarifa final".
6. **Si no se puede probar el contrato previo** (consulta fallida o dato faltante) → tarifa final, con advertencia en el log. Es la única vía por la que un cliente antiguo podría pagar de más, y está instrumentada.

Cubierto por tests: `lib/activation.test.ts` (cliente viejo paga $769.000 + setup $590.000 con IVA; cliente nuevo paga $429.000 + $390.000) y `lib/pricing/rules.test.ts` (corte de fecha, renovación, overage histórico de inmobiliarias).

Para verlo sin abrir el código: **`npm run precios`** imprime la tabla "antes / ahora / delta" por plan leyendo `LEGACY_TARIFFS` del propio código, con la fecha de vigencia y el estado de las reglas R0–R7.

---

## 4. Reglas que no se negocian sin cambiar el motor (R0–R7)

| Regla | Enunciado | Test que la defiende |
|---|---|---|
| **R0** | Ningún $/min de Upway supera el minuto humano facturado ($721). | `valor: ningun $/min ... supera el minuto humano` |
| **R1** | Overage con margen ≥ 40%. | `overage final $690/min con 45,1% de margen` |
| **R2** | Overage único por vertical. | `overage unico de $690 en los 4 planes` |
| **R3** | El escalón incremental cuesta ≥ 5% menos que el overage. | `cada escalon cuesta <= 95% del overage` |
| **R4** | Margen ≥ 30% a uso completo. | `margenes: 30%+ a uso completo...` |
| **R5** | Margen ≥ 55% a utilización de planeación (55%), sin caer con el tamaño. | `auditTariff` → `MARGEN_CAE_CON_TAMANO` |
| **R6** | $/min decreciente con el volumen. | `NO_DECRECE_POR_MINUTO` |
| **R7** | Precios cerrados (múltiplos de $1.000). | `REDONDEO` |

Si alguien propone un precio que rompe R3, el plan de arriba queda dominado y la escalera muere: **el test falla antes de que llegue al cliente.**

---

## 5. Excepciones y deal desk

| Caso | Regla | Autorización |
|---|---|---|
| > 60.000 min/mes, multi-sede o EPS/Red | Cotización. **Piso $550 COP/min all-in (31,1% de margen)** | Deal desk |
| Cliente pide bajar el overage | No. Es la tarifa que sostiene R1 y evita el arbitraje | No aplica |
| Cliente pide descuento en el módulo de identidad | No. Es software con ~100% de margen y el argumento de ARPA | No aplica |
| Piloto con descuento | Se admite **un mes** de piloto gratis o a mitad de precio de la mensualidad, nunca tocando el overage ni el módulo | Dirección |
| Concurso público / licitación | Se cotiza con el motor (`planEconomics`) y se adjunta la tabla de márgenes | Dirección |

Regla de caja: **nunca cotizar por debajo del costo all-in del minuto ($379) más el costo de números**, y nunca firmar un volumen que exija ampliar simultaneidad sin approval del proveedor de voz.

---

## 6. Cuándo se revisa esta política

1. **TRM sostenido > 3.300** (30 días): recalcular `lib/telnyx/costs.ts` y revisar el overage antes de perder el piso del 40%.
2. **Cambio de precio del proveedor de voz o del modelo de lenguaje:** recalcular costo all-in. Si **baja**, no se baja el precio al cliente: sube el margen hasta la revisión trimestral (el cliente ya tiene un precio acordado).
3. **Anexo técnico / catálogo oficial de MinSalud cambia:** revisar el módulo Identidad Conforme (posible re-certificación) y su precio por sede.
4. **Consumo observado:** si la utilización real del bundle baja de 40% o supera 70% de forma sostenida, la tarifa (margen de planeación) necesita ajuste.
5. **Trimestral:** `npm run precios` + comparación contra consumo real por cliente.

---

## 7. Resumen de una línea

Subimos margen en el plan que más lo destruía (Red), corregimos el minuto que se vendía por debajo del piso ($547 → $690), bajamos 26–44% los planes cuyo precio financiaba algo que ya no entregamos, dejamos el módulo de cumplimiento como precio final y protegemos a los clientes vigentes con grandfathering que **el código ejecuta**, no con una promesa comercial.

---

## 8. Pendientes (lo que aún NO está automatizado)

Ninguno bloquea vender; conviene tenerlos escritos para no descubrirlos en una factura:

1. **Conciliación de overage con tarifa contractual.** El costo facturado que se registra por llamada (`LlamadaLog`, vía `estimateCallCosts`) usa la **tarifa vigente** ($690). Para un cliente en grandfathering, el consumo del mes debe conciliarse contra su tarifa contractual ($547 en inmobiliarias, $750/$700 en Health). Hoy el grandfathering está aplicado en la generación del cobro del plan (link de pago), no en el registro analítico por llamada.
2. **Facturación recurrente.** El link de pago de Bold nace en la activación y en cada aprobación; no hay cobro automático mensual por suscripción. La renovación se gestiona con el mismo flujo (y es el momento en que el cliente pasa a la tarifa final).
3. **Extracción del consumo real por cliente** para la revisión trimestral de utilización (punto 4 de §6): hoy se calcula de `LlamadaLog`, sin tablero por cliente todavía.