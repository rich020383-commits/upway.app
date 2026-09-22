# Upway Health — Estudio de servicios y tarifa final

**Estado:** tarifa final **ratificada el 22-sep-2026**, vigente desde **1-oct-2026**. TRM de referencia: **3.090 COP/USD**.
**Acta de decisión:** `docs/upway-politica-precios.md` (decisiones D1–D5, grandfathering y deal desk).
**Código:** `lib/pricing/rules.ts` (reglas), `lib/health/plans.ts`, `lib/health/plans-enterprise.ts`.
**Verificación:** `npm test` (reglas R0–R7 en `lib/pricing/rules.test.ts`) y `npm run precios` (reporte calculado sobre el código real).
**Relacionado:** `REPORTES/NOTA-INTEGRACION-SALUD-2026-09.md` (dónde puede jugar Upway), `docs/upway-center-estudio.md`.

---

## 1. Qué vendemos hoy (alcance real, sin promesas clínicas)

La tarifa anterior estaba anclada a una promesa de **inserción en el desarrollo clínico** (triaje, integración profunda de HIS, white-glove de 4 h) que Upway **no** entrega. Hoy se venden tres cosas concretas:

| # | Servicio | Qué hace | Qué NO hace |
|---|---|---|---|
| 1 | **Atiende** | Contesta 24/7, sigue el guion que la sede define, traslada a la sede y agenda. | No diagnostica, no prioriza por criterio médico, no interpreta síntomas. |
| 2 | **Confirma el dato conforme** | Toma el dato con catálogo cerrado (tipo de documento Res. 866/2021), lo repite dígito a dígito con el paciente y entrega el registro con evidencia de integridad (hash). | No es HCE, no escribe historia clínica, no reemplaza el RIPS ni el RDA del prestador. |
| 3 | **Audita** | Grabación, log de eventos y registro verificable por llamada; export a su sistema por API, webhook o CSV. | No promete cartera, glosa ni radicabilidad (eso es Fase 2: aseguramiento, con fuente BDUA y contrato). |

**Consecuencia de precio:** si solo atendemos, confirmamos y auditamos, el costo de implementación y el riesgo son menores que los de una integración clínica. El precio debe bajar y ser explicable minuto a minuto, no "por el valor del desarrollo clínico".

---

## 2. Costo real verificado (fuente: `lib/telnyx/costs.ts`)

| Rubro | Valor |
|---|---|
| Voz inbound CO (Telnyx) | $0,065 USD/min |
| AI Assistant (LLM + STT + TTS) | $0,0575 USD/min |
| **Costo all-in del minuto** | **$0,1225 USD/min = $379 COP** |
| Número dedicado CO | $13,50 USD/mes = **$41.715 COP** |
| **Minuto adicional (overage) final** | **$0,2233 USD/min = $690 COP (45,1% de margen)** |
| Piso de cotización (volumen custom, deal desk) | **$550 COP/min all-in (31,1%)** |

El minuto adicional es **una sola tarifa** para todos los planes: nadie tiene un minuto "de primera" y otro "de segunda".

---

## 3. Diagnóstico: por qué los precios anteriores estaban mal

### 3.1 Los planes grandes estaban dominados por el plan pequeño + overage

Con la tarifa anterior (Consultorio $769.000 y overage $750), esto era siempre más barato que subir de plan:

```
1.800 min → Consultorio + 1.200 min de overage = 769.000 + 900.000 = $1.669.000  (< $1.914.000 de Clínica Pro)
8.000 min → Consultorio + 7.400 min de overage = 769.000 + 5.550.000 = $6.319.000 (< $7.109.000 de IPS Plus)
25.000 min → Consultorio + 24.400 de overage = 769.000 + 18.300.000 = $19.069.000 (< $19.617.000 de Enterprise)
```

Es decir: **el cliente racional nunca compraba Clínica Pro, IPS Plus ni Enterprise**. Los planes existían en la web y no en la mesa de negociación. Además el $/min del bundle nunca bajaba: 1.282 → 1.063 → 889 → 785, siempre por encima del overage de 750. No había descuento por volumen, solo una escalera invertida.

### 3.2 Estaban anclados a un alcance que ya no se entrega

El precio financiaba el desarrollo clínico (triaje, HIS, white-glove). Al reducirse el alcance a **atender + confirmar + auditar**, el precio debe reflejarlo. Eso explica el ajuste de §6.

### 3.3 La referencia de valor no es el salario, es el minuto humano facturado

Corrección de unidades sobre el estudio de Center (que mezclaba tarifas/hora con totales/mes):

| Referencia | Cálculo | Valor |
|---|---|---|
| Tarifa billable Tier-1 Colombia (rethinkCX) | $14 USD/h × 3.090 | **$43.260 COP/hora** |
| Posición 8h/día (176 h/mes) | 176 × 43.260 | **$7.613.760 COP/mes** |
| Cobertura real 24/7 (720 h/mes) + 25% de recargos | 720 × 43.260 × 1,25 | **$38.934.000 COP/mes** |
| **Minuto humano facturado** | 43.260 ÷ 60 | **$721 COP/min** |

- La tarifa Upway más alta por minuto (plan de entrada, 715) y el overage (690) quedan **por debajo del minuto humano facturado (721)**.
- Una posición humana al 40% de ocupación absorbe ~4.224 min hablados/mes y cuesta $7.613.760. Esos 4.224 min con Upway cuestan **$2.871.560** (Clínica Pro + overage): **−62%** y con cobertura 24/7.
- Para cubrir 24/7 (17.280 min hablados a la misma ocupación) el humano cuesta $38.934.000; con Upway son **$11.293.200** (IPS Plus + overage): **−71%**.

### 3.4 El módulo de identidad era "opcional", siendo el núcleo

La confirmación del dato conforme es exactamente lo que el cliente necesita para cumplir, y es software puro (margen ~100%). Queda como línea por sede, **$290.000/sede/mes**, y es la palanca que sostiene el margen cuando el cliente crece.

---

## 4. Reglas de precio vigentes (R0–R7)

Están escritas y **verificadas en código** (`lib/pricing/rules.ts` + `auditTariff`):

| Regla | Enunciado |
|---|---|
| **R0** | Ningún $/min de Upway (planes ni overage) supera el minuto humano facturado ($721). |
| **R1** | Overage con margen ≥ 40% sobre el costo all-in. |
| **R2** | Overage único por vertical (misma tarifa en todos los planes). |
| **R3** | El **escalón incremental** de cada plan cuesta ≥ 5% menos por minuto que el overage: subir de plan siempre gana contra "plan menor + overage". |
| **R4** | Margen ≥ 30% si el cliente consume el 100% de los minutos incluidos. |
| **R5** | Margen ≥ 55% a utilización de planeación (55%) y **sin caer con el tamaño del cliente** (deriva máxima 3 puntos). |
| **R6** | $/min implícito decreciente: más volumen, menos $/min. |
| **R7** | Precios cerrados (múltiplos de $1.000) para poder decirlos en voz alta. |

---

## 5. Tarifa final (sin IVA; el IVA del 19% se suma aparte)

| Plan | Min. incl. | Núm. | Simultáneas | **Precio/mes** | Implementación única | $/min implícito | Margen 100% | Margen 55% | Escalón |
|---|---|---|---|---|---|---|---|---|---|
| **Consultorio** | 600 | 1 | 2 | **$429.000** | $390.000 | 715 | 37,3% | 61,1% | — |
| **Clínica Pro** | 1.800 | 2 | 5 | **$1.199.000** | $690.000 | 666 | 36,1% | 61,7% | 642/min |
| **IPS Plus** | 8.000 | 4 | 20 | **$4.890.000** | $1.290.000 | 611 | 34,6% | 62,5% | 595/min |
| **IPS Enterprise** | 25.000 | 8 | 60 | **$14.490.000** | $2.400.000 | 580 | 32,3% | 61,7% | 565/min |
| **Módulo Identidad Conforme** | — | — | por sede | **$290.000/sede** | — | — | ~100% | ~100% | — |
| **Minuto adicional** | — | — | — | **$690/min** | — | — | 45,1% | 45,1% | — |
| **EPS / Red (custom)** | 60k–200k | 10+ | 100 | **A cotizar** (piso $550/min) | a cotizar | — | ≥ 30% | — | — |

**Reparto del costo por plan (uso completo):**

| Plan | Voz (min × $379) | Números | Costo total | Utilidad |
|---|---|---|---|---|
| Consultorio | $227.400 | $41.715 | $269.115 | $159.885 |
| Clínica Pro | $682.200 | $83.430 | $765.630 | $433.370 |
| IPS Plus | $3.032.000 | $166.860 | $3.198.860 | $1.691.140 |
| IPS Enterprise | $9.475.000 | $333.720 | $9.808.720 | $4.681.280 |

El margen a 100% de uso es el **peor caso** (el cliente consume todo lo que compró). A la utilización de planeación (55%, el supuesto con el que se cubre costo fijo y que ya usaba el modelo de recarga) los cuatro planes quedan en **61–63%, plano**: el margen **ya no se cae con el tamaño del cliente** (antes iba de 78% a 47%).

---

## 6. Antes vs. después

| Plan | Precio antes | Precio final | Δ |
|---|---|---|---|
| Consultorio 600 | $769.000 | **$429.000** | **−44,2%** |
| Clínica Pro 1.800 | $1.914.000 | **$1.199.000** | **−37,4%** |
| IPS Plus 8.000 | $7.109.000 | **$4.890.000** | **−31,2%** |
| IPS Enterprise 25.000 | $19.617.000 | **$14.490.000** | **−26,1%** |
| Minuto adicional | $750 / $700 según plan | **$690 único** | −8,0% |
| Implementación (Consultorio → Enterprise) | $590k / $1,2M / $1,9M / $3,5M | **$390k / $690k / $1,29M / $2,4M** | −34% a −43% |
| Módulo Identidad Conforme | $290.000 ("precio de adopción") | **$290.000 (precio final)** | 0% — deja de ser temporal |

Se mantienen intactos los minutos incluidos, los números, las simultáneas y las retenciones de grabación: el cambio es de **tarifa y de lógica**, no de producto.

---

## 7. Recomendación honesta (sin sobrevender)

`recommendPlan` ya no usa cuotas comerciales: recomienda **el plan que menos le cuesta al cliente** para su volumen, calculado desde los datos de la tarifa (`cheapestTariffForMinutes`).

| Volumen estimado | Recomendación honesta | Desde |
|---|---|---|
| < 1.716 min | Consultorio 600 + overage | $429.000 |
| 1.716 – 7.149 min | Clínica Pro (+ overage si pasa) | $1.199.000 |
| 7.149 – 21.913 min | IPS Plus (+ overage) | $4.890.000 |
| > 21.913 min | IPS Enterprise | $14.490.000 |
| > 60.000 min o EPS | Cotización (deal desk, piso $550/min) | — |

Antes, con umbrales fijos (IPS ≥ 20.000 min → Enterprise), a las 20.000 min se recomendaba un plan de $14.490.000 cuando "IPS Plus + 12.000 min de overage" costaba $8.880.000: **63% más caro que la alternativa**. Hoy hay un test que recorre 0–30.000 min y falla si eso vuelve a pasar.

---

## 8. ARPA y margen con el módulo de identidad

| Plan | Sin módulo | Con módulo | Δ ARPA | Margen blended (55%) |
|---|---|---|---|---|
| Consultorio | $429.000 | $719.000 | **+67,6%** | 76,8% |
| Clínica Pro | $1.199.000 | $1.489.000 | **+24,2%** | 69,2% |
| IPS Plus | $4.890.000 | $5.180.000 | +5,9% | 64,6% |
| IPS Enterprise | $14.490.000 | $14.780.000 | +2,0% | 62,5% |

---

## 9. Condiciones y riesgos (decisión ratificada el 22-sep-2026)

1. **Un solo precio de minuto.** Si alguien ofrece un overage distinto por plan, vuelve el arbitraje y la escalera se cae. R2 y R3 son tests, no acuerdos verbales.
2. **TRM.** Toda la tarifa está a 3.090. Regla de revisión: si el TRM supera 3.300 de forma sostenida (más de 30 días), se recalcula `lib/telnyx/costs.ts` y se revisa el overage antes de perder el piso del 40%.
3. **Uso al 100%.** Contra el piso del 30% el margen es delgado. La palanca no es subir el precio del minuto, es **vender el módulo de identidad** (margen ~100%) y respetar el overage.
4. **Clientes actuales (ratificado).** La tarifa final aplica a activaciones nuevas y renovaciones; los contratos anteriores al **1-oct-2026** conservan su tarifa hasta renovar. No es una promesa comercial: `resolveContractTariff` + `LEGACY_TARIFFS` en `lib/pricing/rules.ts` resuelven el monto del link de pago en el servidor y lo dejan trazado en el intento de pago.
5. **Lo que no se promete.** Triaje clínico, criterio médico, historial clínico, radicabilidad ni tasa de glosa. La respuesta está en `REPORTES/NOTA-INTEGRACION-SALUD-2026-09.md` (Fase 2, con fuente BDUA y contrato).

---

## 10. Cómo se verifica (reproducible)

```bash
npm test          # reglas R0-R7, tarifas cerradas y recomendación honesta (lib/pricing/rules.test.ts)
npx tsc --noEmit  # 0 errores
npm run precios   # reporte calculado sobre el código real; falla si la escalera se rompe
```

Estado al cerrar esta tarifa: **303 tests en 19 archivos en verde** (incluye grandfathering), `tsc --noEmit` sin errores y `npm run precios` con `OK: la escalera cumple R0-R7` en Health e Inmobiliarias.
