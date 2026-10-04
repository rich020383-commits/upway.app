# CONTRASTE DE CATALOGOS — Anexo Tecnico IHCE / SISPRO vs `lib/health/identity/catalogs.ts`

**Fecha:** 10-ene-2026 (2a pasada; reemplaza la del 20-sep-2026)
**Fuente autoritativa:** Guia de Implementacion FHIR RDA Colombia — `vulcano.ihcecol.gov.co` (IG `minsalud.fhir.co.rda`, v1.0.0, activa 2025-12-29)
**ValueSet contrastada:** `ColombianPersonIdentifierCodes` — `https://fhir.minsalud.gov.co/rda/ValueSet/ColombianPersonIdentifierCodes`
(CodeSystem `https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianPersonIdentifier`)
**Resultado:** ALINEADO con **17 codigos**. Se corrigieron etiquetas y se reincorporo `DE`; se agrego `PC`. `NU` permanece fuera.

## Correcciones sobre la pasada anterior (20-sep-2026)

La pasada anterior quedaba incompleta y contradecia la propia ValueSet que citaba:

1. **`SI`** figuraba como "Codigo SI". La denominacion oficial es **"Sin identificacion"**.
2. **`DE`** se retiro como "codigo no oficial": es un error. La ValueSet SI incluye **`DE` = "Documento Extranjero"**. Reincorporado.
3. **`PC` = "PEP-TUTOR"** estaba ausente. Agregado.
4. La ValueSet tiene **17** codigos, no 15. El mensaje de rechazo de `catalogs.ts` y la seccion 5 de `docs/INTEGRACION-API-IDENTIDAD.md` listaban la lista vieja (`NU`, sin `CN`, `PPT`, `PC`, `RUT`, `SI`, `DE`). Corregidos.
5. Etiquetas cruzadas `PT`/`PPT` y `SC` corregidas a la denominacion oficial.

## Tabla de contraste — tipos de documento (17 codigos oficiales)

| # | Codigo | Display oficial | Estado en Upway |
|---|---|---|---|
| 1 | `CN` | Certificado de nacido vivo | Ok |
| 2 | `RC` | Registro civil | Ok |
| 3 | `TI` | Tarjeta de Identidad | Ok |
| 4 | `CC` | Cedula ciudadania | Ok |
| 5 | `PA` | Pasaporte | Ok |
| 6 | `CD` | Carne diplomatico | Ok |
| 7 | `CE` | Cedula de extranjeria | Ok |
| 8 | `DE` | Documento Extranjero | **Reincorporado** (se habia retirado por error) |
| 9 | `SC` | Salvoconducto de permanencia | Ok (etiqueta corregida) |
| 10 | `PE` | Permiso Especial de Permanencia | Ok |
| 11 | `PT` | Permiso Temporal de Permanencia | Ok (etiqueta corregida) |
| 12 | `PPT` | Permiso por proteccion temporal | Ok (etiqueta corregida) |
| 13 | `PC` | PEP-TUTOR | **Agregado** |
| 14 | `RUT` | Registro Unico Tributario | Ok |
| 15 | `AS` | Adulto sin identificar | Ok |
| 16 | `MS` | Menor sin identificar | Ok |
| 17 | `SI` | Sin identificacion | Ok (etiqueta corregida) |
| — | `NU` | (no existe en la ValueSet) | Fuera del catalogo (correcto) |

## Otros catalogos

### Sexo

El RDA **NO usa literalmente `M/F/I`**. Usa dos code systems (ambos con binding `required`):

- **`Patient.gender`** → `AdministrativeGender` (FHIR): `male | female | other | unknown`. Cardinalidad 0..1.
- **`Patient.extension:ExtensionBiologicalGender`** → `ColombianGenderGroup`:
  `01` Hombre, `02` Mujer, `03` Indeterminado o Intersexual. Cardinalidad 1..1.

`sexCode` de Upway (`M/F/I/N`) es la representacion interna de transporte y almacenamiento; **no es un codigo del RDA**. Se agrego el mapeo explicito en `catalogs.ts` (`SEX_TO_ADMINISTRATIVE_GENDER`, `SEX_TO_BIOLOGICAL_GENDER_GROUP`) para que el prestador construya el `Patient` conforme. Nota: `N` (no informa) no existe en `ColombianGenderGroup`; el prestador lo resuelve con `AdministrativeGender=unknown`.

> Decision pendiente de producto: si se quiere que el valor de transporte sea directamente el codigo RDA, hay que migrar `sexCode` (BD + contrato + docs).

### Patient.identifier (cardinalidades)

Perfil `PatientRDA` (`StructureDefinition-PatientRDA`, v1.0.0):

- `Patient.identifier` esta **rebanado (sliced)**; la rebanada `NationalPersonIdentifier` es el identificador nacional (llave de match del MPI).
- `Patient.identifier:NationalPersonIdentifier.use` → Fixed Value `official`.
- `Patient.identifier:NationalPersonIdentifier.type.coding:ColombianCode` → cardinalidad **1..1**, binding **required** a `ColombianPersonIdentifierCodes`.
- Existe ademas una rebanada `InternationalCode` (`coding.display` con Fixed Value `Person number`).
- `Patient.gender` → **0..1** (binding required, `AdministrativeGender`).

Confirmar el min..max exacto del elemento base `Patient.identifier` contra el **Anexo Tecnico PDF vigente** antes de produccion.

### Otros

| Catalogo | Estado | Fuente |
|---|---|---|
| Municipio (DIVIPOLA) | Estructura 2+3 digitos correcta; validar contra DANE vigente | DANE DIVIPOLA |
| Fecha de nacimiento | ISO 8601, rango plausible validado | ISO 8601 |

## PENDIENTES

- [x] Contrastar la ValueSet oficial: `SI` = "Sin identificacion"; `DE` y `PC` incluidos; sexo y `Patient.identifier` verificados.
- [ ] Confirmar el min..max exacto de `Patient.identifier` en el **Anexo Tecnico PDF** del micrositio SISPRO.
- [ ] Decidir si `sexCode` pasa a emitir el codigo RDA directo (hoy se emite y documenta el mapeo).
- [ ] Repetir este contraste **trimestralmente** cada vez que MinSalud/MinTIC publiquen version nueva del anexo.

## Verificacion tecnica

- `lib/health/identity`: **93 tests** en verde (incluye la ValueSet de 17 codigos y el mapeo de sexo a RDA).
- `tsc --noEmit`: 0 errores en todo el proyecto.
