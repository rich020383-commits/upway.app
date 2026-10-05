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

**Tipo de documento:** `CC`, `CE`, `TI`, `RC`, `CN`, `PA`, `CD`, `DE`, `SC`, `PE`,
`PT`, `PPT`, `PC`, `RUT`, `SI`, `MS`, `AS`.

**Sexo:** `M`, `F`, `I` (indeterminado), `N` (no declarado).

**Municipio:** código DIVIPOLA de 5 dígitos (2 de departamento + 3 de municipio).

Estos catálogos están contrastados contra el **ValueSet oficial del RDA
(IHCE/SISPRO)**: `ColombianPersonIdentifierCodes` (17 tipos de documento) y
`ColombianGenderGroupCodes` (género biológico). El contraste vigente está en
`REPORTES/CONTRASTE-CATALOGOS-ANEXO-TECNICO.md`.

---

## 6. Formas de integración

| Modo | Cómo funciona | Cuándo usarlo |
|---|---|---|
| **API (pull)** | Su sistema consulta el endpoint cuando lo necesita | Es el modo recomendado |
| **Webhook (push)** | Upway envía el registro al endpoint HTTPS que usted registra con su llave | Si necesita tiempo real |
| **Export manual** | Archivo para cargue puntual | Solo migración o contingencia, nunca operación |

El modo contratado se registra en el onboarding (campo *"Cómo consumirá su sistema
el dato del paciente"*). Ese campo es comercial: la configuración técnica del push
se hace al crear la llave de API, registrando su **URL de webhook** (ver abajo).

### 6.1 Webhook (push): cómo se configura

- Al crear la llave en `/health/settings` registre también la URL HTTPS de su
  endpoint. Sin URL, la llave solo funciona para consulta pull.
- Upway entrega un `POST` con el registro conforme cuando el paciente queda
  certificado, y de nuevo cuando el paciente confirma sus datos (lectura
  dígito a dígito). Máximo dos eventos por versión del registro.
- Header `X-Upway-Idempotency-Key`: si su sistema ya procesó ese valor, responda
  `2xx` y descarte el cuerpo — es un reintento del mismo evento. Un dato
  actualizado genera una clave nueva.
- Su endpoint debe responder `2xx` en menos de 5 segundos. Los `4xx` (salvo
  `408`/`429`) son rechazos definitivos: no se reintentan y quedan visibles en
  el log de entregas de la llave (estado, intentos, último error). Los `5xx`,
  `429`, `408` y los timeouts se reintentan con espera creciente (hasta 3
  reintentos).

Cuerpo del evento:

```json
{
  "event": "identity.certified",
  "version": "2026-10-v1",
  "delivery": {
    "idempotencyKey": "push:llave:registro:hash:marca",
    "attempt": 1,
    "certifiedAt": "2026-10-01T12:00:00.000Z"
  },
  "patient": {
    "evidenceRef": "cm...",
    "documentType": "CC",
    "documentNumber": "15802345",
    "givenNames": ["Juan"],
    "familyNames": ["Perez"],
    "birthDate": "1971-08-08",
    "sexCode": "M",
    "municipalityCode": "11001",
    "departmentCode": "11",
    "phoneE164": "+573001112233",
    "email": "juan@example.com"
  },
  "certification": {
    "conforming": true,
    "completenessPct": 100,
    "confirmedAt": null,
    "recordHash": "sha256-hex",
    "payloadVersion": "v1"
  }
}
```

`confirmedAt` viaja `null` en el primer evento (certificación) y con la fecha de
confirmación del paciente en el segundo. `patient.evidenceRef` es el mismo valor
del pull: guárdelo junto al identificador de su paciente.

---

## 7. Responsabilidades sobre datos personales

El registro es **dato personal de salud**. En consecuencia:

- Su sistema debe tener finalidad declarada y autorización del titular (Ley 1581 de
  2012 y su reglamentación).
- Upway exige acuerdo de tratamiento de datos (DPA) entre las partes.
- Cada consulta queda registrada con fecha y llave usada: no consulte registros que
  su sistema no necesite.

### 7.1 Límites de garantía de Upway (léalo antes de ofrecer el servicio)

Upway certifica **el proceso de captura**, no **la existencia** del documento.

**Lo que Upway garantía (verificable en la respuesta):**

- El dato pasó por **catálogo cerrado** (Res. 866/2021): no hubo texto libre en tipo
  de documento, sexo ni municipio.
- El titular **lo confirmó dígito a dígito** durante la llamada (`confirmedAt`).
- El registro **no fue alterado** después de certificarse (`integrityVerified` =
  hash SHA-256).
- La evidencia es trazable (`evidenceRef`): fecha, llave usada y hash.

**Lo que Upway NO garantiza:**

- Que el documento exista en **Registraduría Nacional** ni que corresponda a la
  persona que lo dictó.
- Que la persona exista en **BDUA/ADRES** o que tenga aseguramiento vigente.
- Que nombre, fecha de nacimiento o municipio coincidan con registros oficiales
  externos.
- **Firma electrónica con valor legal** (Ley 527): el hash SHA-256 evidencia
  integridad del registro, no la identidad de quien lo creó. La no-repudación
  completa requiere un proveedor de firma certificado, que Upway no opera.
- Validación biométrica (rostro o huella).

**Por qué no lo garantiza:** la verificación contra Registraduría ni ADRES no está
disponible como API pública de esas entidades. Upway no simula una validación que
no realiza; cualquier tercero que la afirme estaría apoyándose en un intermediario
que no es el Gobierno.

**En qué se traduce esto para usted:** el registro aporta **evidencia auditable de
un proceso de captura conforme**. La validación cruzada contra fuentes oficiales
sigue siendo responsabilidad del prestador en su HIS (por eso se entrega la clave
`documentType + documentNumber`). Si necesita más, se acuerda por escrito en el
DPA como fase futura con convenio directo — no forma parte de este servicio.

---

## 8. Checklist de integración

1. Crear la llave en `/health/settings` y guardarla en su bóveda de secretos. Si
   contrató la entrega en tiempo real, registre ahí mismo la URL HTTPS de su webhook.
2. Consumir `GET /api/v1/identity/{documentType}/{documentNumber}` en un ambiente de
   pruebas con un paciente de prueba.
3. Verificar los tres casos: `200` con `conforming: true`, `404` sin registro y `401`
   con llave inválida.
4. (Push) Confirmar que su endpoint recibe el `POST` con el header
   `X-Upway-Idempotency-Key`, responde `2xx` y aparece como "entregada" en el log de
   la llave.
5. Guardar `evidenceRef` junto al identificador de su paciente.
6. Confirmar con Upway el modo de integración y firmar el DPA.
