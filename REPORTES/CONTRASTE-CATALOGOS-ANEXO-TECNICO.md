# CONTRASTE DE CATALOGOS — Anexo Tecnico IHCE vs `lib/health/identity/catalogs.ts`

**Fecha:** 20-sep-2026
**Fuente autoritativa:** Guia de Implementacion FHIR RDA Colombia — `vulcano.ihcecol.gov.co` (IG minsalud.fhir.co.rda)
**ValueSet contrastada:** `ValueSet-ColombianPersonIdentifierCodes` — "Colombian Person Identifier Codes" (sistemas de codigo: `https://www.regsitraladuanero.gov.co` / `urn:oid:2.16.840.1.113883.2.14.2.5`)
**Resultado:** ALINEADO con 15 codigos. Se retiraron `NU` y `DE` (no existen en la ValueSet), entraron `CN`, `PPT`, `RUT`, `SI`.

## Tabla de contraste — tipos de documento

| # | Codigo (ValueSet IHCE) | Estado en Upway | Accion |
|---|---|---|---|
| 1 | `CC` Cedula de ciudadania | Ya existia | — |
| 2 | `CE` Cedula de extranjeria | Ya existia | — |
| 3 | `TI` Tarjeta de identidad | Ya existia | — |
| 4 | `RC` Registro civil | Ya existia | — |
| 5 | `CN` Certificado de nacido vivo | **Faltaba** | Agregado |
| 6 | `PA` Pasaporte | Ya existia | — |
| 7 | `CD` Carnet diplomatico | Ya existia | — |
| 8 | `SC` Salvoconducto | Ya existia | — |
| 9 | `PE` Permiso especial de permanencia | Ya existia | — |
| 10 | `PT` Permiso por proteccion temporal | Ya existia | — |
| 11 | `PPT` Permiso proteccion temporal (nominal) | **Faltaba** | Agregado |
| 12 | `RUT` Registro unico tributario | **Faltaba** | Agregado |
| 13 | `SI` Codigo SI | **Faltaba** | Agregado — *etiqueta provisional; verificar denominacion exacta contra el Anexo Tecnico PDF vigente en SISPRO antes de exponer al agente* |
| 14 | `MS` Menor sin identificacion | Ya existia | — |
| 15 | `AS` Adulto sin identificacion | Ya existia | — |
| — | `NU` NUIP | Existia por error | **Retirado** — no esta en la ValueSet (el RC ya lo cubre) |
| — | `DE` Documento extranjero | Existia por error | **Retirado** — codigo no oficial |

## Otros catalogos

| Catalogo | Estado | Fuente |
|---|---|---|
| Sexo (M/F/I) | Alineado (3 codigos, `I` = indeterminado/intersexual) | IG FHIR RDA — CodeSystem administrativo de genero; confirmar representacion exacta en el Anexo Tecnico |
| Municipio (DIVIPOLA) | Estructura 2+3 digitos correcta; validar contra DANE vigente | DANE DIVIPOLA |
| Fecha de nacimiento | ISO 8601, rango plausible validado | ISO 8601 |

## PENDIENTES (bloquean el SLA contractual, no el piloto)

- [ ] Descargar el **Anexo Tecnico vigente en PDF desde el micrositio IHCE de SISPRO** (los anexos ya no vienen dentro de la Res. 1888; se publican aparte y se actualizan) y contrastar: etiqueta exacta del codigo `SI`, cardinalidades de `Patient.identifier`, y code system de sexo.
- [ ] Confirmar si el anexo usa `M/F/I` o la extension administrativa-gender de la IG (si difiere, ajustar `SEX_OPTIONS` y tests).
- [ ] Repetir este contraste **trimestralmente** (checklist) cada vez que MinSalud/MinTIC publiquen version nueva del anexo.

## Verificacion tecnica

- 85 tests de `lib/health/identity` en verde tras el cambio.
- `tsc --noEmit`: 0 errores en todo el proyecto.
