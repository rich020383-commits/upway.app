# Integración con Upway Health — API de identidad conforme

Esta guía es para el equipo técnico del prestador (IPS, clínica o consultorio) que
quiere recibir en su sistema el registro de identidad que Upway captura por voz.

---

## 1. Qué entrega Upway y qué no

**Sí entrega:** el registro de identidad y demografía del paciente, capturado en la
llamada, **confirmado por el propio paciente** y validado contra catálogos cerrados,
con evidencia de integridad.

**No entrega ni hace Upway:**

- No transmite el **RDA** ni el **RIPS**: eso es del prestador.
- No crea ni modifica pacientes en su sistema: su HIS decide si crea o actualiza.
- No incluye diagnóstico, procedimiento ni prescripción.

La clave de match es `documentType + documentNumber` (la misma que usa el MPI
nacional). Upway entrega esa clave y el HIS decide.

---

## 2. Crear la llave

1. Entre al panel: **/health/settings → "Llaves de API para su sistema"**.
2. Póngale un nombre reconocible (ej. `HIS produccion`).
3. **Copie la llave en ese momento.** Se muestra una sola vez; Upway guarda solo su
   hash y no puede recuperarla.

Si la llave se filtra o se pierde: **revóquela desde el mismo panel** y emita otra.
La revocación es inmediata.

Formato de la llave: `upw_live_` + 48 caracteres hex.

---

## 3. Consultar un registro

```
GET /api/v1/identity/{documentType}/{documentNumber}
Authorization: Bearer upw_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Ejemplo:

```bash
curl -s \
  -H "Authorization: Bearer $UPWAY_API_KEY" \
  "https://su-dominio/api/v1/identity/CC/1020334567"
```

Reglas del contrato:

- `documentType` debe pertenecer al catálogo cerrado (ver §5). Si no, `400`.
- `documentNumber` se normaliza (se quitan espacios, puntos y guiones). Upway **no
  corrige ni adivina dígitos**.
- La llave pertenece a **una sola organización**: nunca puede ver datos de otra IPS.

### Respuesta 200

```json
{
  "conforming": true,
  "identity": {
    "documentType": "CC",
    "documentNumber": "1020334567",
    "givenNames": ["JUAN", "CARLOS"],
    "familyNames": ["PEREZ", "GOMEZ"],
    "birthDate": "1990-05-12",
    "sexCode": "M",
    "municipalityCode": "11001",
    "departmentCode": "11",
    "phoneE164": "+573001234567",
    "email": null
  },
  "report": {
    "completenessPct": 100,
    "issues": null,
    "integrityVerified": true,
    "confirmedAt": "2026-09-20T14:03:11.000Z",
    "certifiedAt": "2026-09-20T14:02:58.000Z",
    "retentionMode": "TRANSIENT"
  },
  "evidenceRef": "cmu739rt9000512jskksmvtb8"
}
```

Notas de campos:

- `givenNames` / `familyNames` vienen **separados** (corroboración del match, no
  para concatenar a ciegas).
- `birthDate` es fecha pura `YYYY-MM-DD` en UTC. No aplique zona horaria.
- `retentionMode`:
  - `TRANSIENT`: Upway no custodia el dato; se usa para la atención y la evidencia.
  - `CUSTODY`: el cliente pidió custodia (requiere acuerdo de tratamiento de datos).
- `evidenceRef` es el identificador de Upway para correlación y trazabilidad.
  Guárdelo: es lo que permite auditar después qué se entregó y cuándo.

### Señales de calidad (importante)

- **`integrityVerified: true`** significa que el hash del registro coincide con lo
  almacenado: el dato no fue alterado. Si viniera `false`, **no use el registro** y
  repórtelo a Upway.
- **`conforming: true`** significa que pasó la validación determinista. Si viniera
  `false`, hay campos faltantes: vea `report.issues`.
- `completenessPct` es el porcentaje de campos certificables completos.

---

## 4. Códigos de error

| Código | Significado | Qué hacer |
|---|---|---|
| `401` | Llave ausente, inválida o revocada | Revise el header `Authorization`; si la llave fue revocada, emita otra |
| `400` | Tipo de documento fuera de catálogo o número inválido | Corrija el valor; no intente adivinar |
| `404` | No hay registro certificado para esa clave de match | El paciente aún no pasó por el canal de Upway |
| `5xx` | Fallo temporal | Reintente con espera creciente |

`404` devuelve cuerpo vacío de identidad:

```json
{ "conforming": false, "identity": null, "report": null, "evidenceRef": null }
```

---

## 5. Catálogos (nunca texto libre)

**Tipo de documento:** `CC`, `CE`, `TI`, `RC`, `NU`, `PA`, `CD`, `SC`, `PE`, `PT`,
`DE`, `MS`, `AS`.

**Sexo:** `M`, `F`, `I` (indeterminado), `N` (no declarado).

**Municipio:** código DIVIPOLA de 5 dígitos (2 de departamento + 3 de municipio).

Los códigos de tipo de documento y sexo se contrastan contra el Anexo Técnico
vigente en el micrositio SISPRO antes de producción.

---

## 6. Formas de integración

| Modo | Cómo funciona | Cuándo usarlo |
|---|---|---|
| **API (pull)** | Su sistema consulta el endpoint cuando lo necesita | Es el modo recomendado |
| **Webhook (push)** | Upway envía el registro al endpoint que usted expone | Si necesita tiempo real |
| **Export manual** | Archivo para cargue puntual | Solo migración o contingencia, nunca operación |

El modo contratado se registra en el onboarding (campo *"Cómo consumirá su sistema
el dato del paciente"*).

---

## 7. Responsabilidades sobre datos personales

El registro es **dato personal de salud**. En consecuencia:

- Su sistema debe tener finalidad declarada y autorización del titular (Ley 1581 de
  2012 y su reglamentación).
- Upway exige acuerdo de tratamiento de datos (DPA) entre las partes.
- Cada consulta queda registrada con fecha y llave usada: no consulte registros que
  su sistema no necesite.

---

## 8. Checklist de integración

1. Crear la llave en `/health/settings` y guardarla en su bóveda de secretos.
2. Consumir `GET /api/v1/identity/{documentType}/{documentNumber}` en un ambiente de
   pruebas con un paciente de prueba.
3. Verificar los tres casos: `200` con `conforming: true`, `404` sin registro y `401`
   con llave inválida.
4. Guardar `evidenceRef` junto al identificador de su paciente.
5. Confirmar con Upway el modo de integración y firmar el DPA.
