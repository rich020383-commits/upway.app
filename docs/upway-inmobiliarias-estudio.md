# Upway Inmobiliarias — Estudio de precios vs. minutos y tarifa final

**Estado:** tarifa final **ratificada el 22-sep-2026**, vigente desde **1-oct-2026**. TRM de referencia: **3.090 COP/USD**.
**Acta de decisión:** `docs/upway-politica-precios.md` (D2 subida del overage, D3 plan Red, D5 grandfathering).
**Código:** `lib/inmobiliaria/plans.ts` (usa el mismo motor de precios que Health: `lib/pricing/rules.ts`).
**Verificación:** `npm test` (`lib/pricing/rules.test.ts`) y `npm run precios`.
**Relacionado:** `docs/upway-health-estudio.md` (reglas y costos compartidos).

---

## 1. El problema: los precios no seguían una lógica de minutos

Tarifa anterior tal como estaba en el código:

| Plan | Min. incl. | Precio/mes | $/min implícito | Margen a uso completo | Overage |
|---|---|---|---|---|---|
| Starter | 600 | $399.000 | 665 | 32,6% | $547 |
| Profesional | 1.500 | $999.000 | 666 | 34,8% | $547 |
| Sucursal | 4.000 | $2.499.000 | 625 | 34,4% | $547 |
| Red | 10.000 | $4.999.000 | **500** | **20,1%** | $547 |

Hallazgos, con la cuenta hecha:

1. **Cero descuento por volumen entre Starter y Profesional:** 665 $/min vs 666 $/min. El cliente pagaba 2,5× más al mes por prácticamente el mismo precio por minuto.
2. **Sucursal nacía dominado:** su $/min (625) era **más caro** que el overage (547). Comprar "Profesional + 2.500 min de overage" costaba **$2.366.500**, es decir **$132.500 menos** que el plan Sucursal ($2.499.000). Un cliente racional nunca compraba Sucursal.
3. **Margen bajo y sin premio por volumen:** 32,6% / 34,8% / 34,4% / 20,1%. El plan más grande era el menos rentable: crecer con el cliente destruía margen.
4. **El overage estaba por debajo del piso:** $547/min deja 31% de margen sobre un costo de $379 (el piso definido es 40%). Es decir, el minuto que más debería proteger el margen era el más barato de todos.
5. **La misma voz tenía dos precios:** Health de entrada cobraba $1.282/min e inmobiliarias $665/min por infraestructura idéntica. Parte del diferencial se justifica (Health incluye captura de datos conformes Res. 866/2021 y tratamiento de dato de salud bajo Ley 1581)… pero no el doble. Tras esta tarifa, la diferencia por minuto es 715 (Health) vs 665 (Inmobiliaria): **7,5%**, explicado por el módulo de cumplimiento, no por "la voz".

---

## 2. Reglas aplicadas (las mismas que Health)

| Regla | Enunciado |
|---|---|
| **R0** | Ningún $/min supera el minuto humano facturado ($14/h ÷ 60 = **$721**). |
| **R1** | Overage con margen ≥ 40% (queda en **45,1%** con $690/min). |
| **R2** | Un único overage para los cuatro planes. |
| **R3** | El escalón de cada plan cuesta ≥ 5% menos por minuto que el overage. |
| **R4** | Margen ≥ 30% a uso completo. |
| **R5** | Margen ≥ 55% a utilización de planeación (55%), sin caer con el tamaño. |
| **R6** | $/min decreciente (más volumen, menos $/min). |
| **R7** | Precios cerrados (múltiplos de $1.000). |

Costo all-in: **$379 COP/min** + **$41.715 COP/número/mes**.

---

## 3. Tarifa final (sin IVA)

| Plan | Min. incl. | Núm. | Simultáneas | **Precio/mes** | Implementación | $/min | Margen 100% | Margen 55% | Escalón |
|---|---|---|---|---|---|---|---|---|---|
| **Starter** | 600 | 1 | 2 | **$399.000** | $0 | 665 | 32,6% | 58,2% | — |
| **Profesional** | 1.500 | 2 | 4 | **$959.000** | $190.000 | 639 | 32,0% | 58,7% | 622/min |
| **Sucursal** | 4.000 | 3 | 8 | **$2.459.000** | $390.000 | 615 | 33,3% | 61,0% | 600/min |
| **Red** | 10.000 | 5 | 16 | **$5.890.000** | $690.000 | 589 | 32,1% | 61,1% | 572/min |
| **Minuto adicional** | — | — | — | **$690/min** | — | — | 45,1% | 45,1% | — |

Ya no hay plan dominado: en el volumen de cada plan, ese plan es la opción más barata (test `en el volumen de cada plan, ese plan es la opción mas barata`).

**Antes vs. después**

| Plan | Antes | Final | Δ |
|---|---|---|---|
| Starter 600 | $399.000 | $399.000 | 0% |
| Profesional 1.500 | $999.000 | $959.000 | −4,0% |
| Sucursal 4.000 | $2.499.000 | $2.459.000 | −1,6% |
| Red 10.000 | $4.999.000 | **$5.890.000** | **+17,8%** |
| Minuto adicional | $547 | **$690** | **+26,1%** |
| Implementación | $0 / $0 / $199k / $499k | $0 / $190k / $390k / $690k | alineada con la de Health |

Dos subidas deliberadas y explicables:
- **Red +17,8%:** estaba a 20,1% de margen, por debajo del piso del 30%. Se corrige el precio, no el producto (mismos 10.000 min y 5 números).
- **Minuto adicional 547 → 690 (+26,1%):** con $547 el margen era 31%, por debajo del piso del 40%. Aun así, **$690 sigue costando menos que el minuto humano facturado ($721)**.

---

## 4. Qué cuesta cada volumen (y contra qué se compara)

Puntos de cruce de la tarifa (donde el plan grande empieza a ganar a "plan menor + overage"): **1.411 min**, **3.674 min**, **8.972 min**.

| Volumen | Combinación más barata | Costo/mes | Si pagara overage en vez de subir | Ahorro |
|---|---|---|---|---|
| 600 min | Starter | $399.000 | — | — |
| 1.500 min | Profesional | $959.000 | Starter + 900 min = $1.020.000 | $61.000 |
| 4.000 min | Sucursal | $2.459.000 | Profesional + 2.500 min = $2.684.000 | $225.000 |
| 10.000 min | Red | $5.890.000 | Sucursal + 6.000 min = $6.599.000 | $709.000 |

**Contra el asesor humano** (tarifa billable Tier-1 Colombia: $14 USD/h = $43.260 COP/h = **$721/min** facturado; una posición de 8 h/día cuesta **$7.613.760/mes**):

| Escenario | Humano | Upway | Ahorro |
|---|---|---|---|
| 4.224 min/mes (una posición 8 h al 40% de ocupación) | $7.613.760 | $2.838.560 (Profesional + overage) | **−62,7%** |
| 17.280 min/mes (cobertura 24/7 real, 720 h al 40%) | $38.934.000 | $10.913.200 (Red + overage) | **−72,0%** |

Y la diferencia de fondo: el asesor humano se paga también cuando no hay llamadas (ocupación típica 40%). Por eso el costo humano **por minuto hablado** es $7.613.760 ÷ 4.224 = **$1.803**, contra $672 de Upway en el mismo escenario.

---

## 5. Por qué Inmobiliarias no paga lo mismo que Health (y está bien)

| Concepto | Health | Inmobiliarias |
|---|---|---|
| Costo del minuto | $379 | $379 (idéntico) |
| $/min de entrada | 715 | 665 |
| Módulo de cumplimiento | **Identidad Conforme $290.000/sede** (Res. 866/2021, dato de salud bajo Ley 1581) | No aplica |
| Por qué el premium | Captura y confirmación de dato regulado + evidencia de integridad | Dato comercial del interesado (operación, zona, presupuesto, urgencia) |
| Margen a 55% de uso | 61–63% | 58–61% |

El diferencial de 7,5% por minuto refleja el costo de cumplimiento del sector salud, no un precio "discriminatorio". Antes era del 93% (1.282 vs 665) y no tenía explicación.

---

## 6. Condiciones y riesgos (ratificado el 22-sep-2026)

1. **La subida del overage (547 → 690) se comunica con la tarifa en la mano.** La FAQ de `/inmobiliarias/precios` lee el valor del código (`DEFAULT_OVERAGE_COP`), así que el cambio es automático y verificable; y a los clientes con contrato anterior al 1-oct-2026 se les sigue cobrando $547 hasta que renueven, porque `resolveContractTariff` lo resuelve en el servidor.
2. **Sin módulo de cumplimiento, el margen depende de la utilización.** A uso completo el margen es ~32%; el modelo se sostiene con el supuesto de planeación (55%) y con el overage. Si un cliente consume sistemáticamente el 100% de su bolsa durante más de tres meses, se le propone el plan superior (que gana por escalón, no por presión comercial).
3. **Un solo overage.** Igual que en Health: `auditTariff` falla si algún plan se sale de la tarifa única o si un escalón se pone por encima del overage.
4. **No prometer lo que no hay.** Sophie atiende, confirma datos y agenda; el cierre comercial sigue en el equipo de la inmobiliaria. Eso es lo que el guion y la grabación respaldan.

---

## 7. Verificación

```bash
npm test          # reglas R0-R7 sobre las dos verticales
npm run precios   # reporte por plan: $/min, margen 100% y 55%, escalón y alertas
```

Salida vigente (inmobiliarias): `OK: la escalera cumple R0-R7.`
