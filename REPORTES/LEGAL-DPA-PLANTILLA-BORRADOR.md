# CONTRATO DE ENCARDO (DPA) — PLANTILLA UPWAY (BORRADOR)

> **Estado:** BORRADOR PARA REVISION JURIDICA. Ningun piloto activa Identidad Conforme sin este contrato firmado.
> **Marco:** art. 18 Ley 1581/2012 (obligacion de contrato de encargo), arts. 19 y 27 Decreto 1074/2015.

**RESPONSABLE:** [Clinica] · NIT [___]
**ENCARGADO:** Upway [Razon Social] S.A.S. · NIT [___]
**Fecha:** [___]

## 1. Objeto
El Responsable encarga al Encargado el tratamiento de datos personales de pacientes para: (a) captura de datos de identidad conforme para la IHCE (Res. 1888/2025); (b) programacion y confirmacion de citas por voz y WhatsApp; (c) [verificacion de aseguramiento, si se habilita]. El Encargado SOLO trata datos bajo instruccion documentada del Responsable.

## 2. Datos y titulares
Pacientes del Responsable: tipo y numero de documento, nombres y apellidos, fecha de nacimiento, sexo, municipio (DIVIPOLA), telefono/WhatsApp, y datos de salud derivados de la programacion. [Habilitar opcional: estado de afiliacion en regimen.]

## 3. Obligaciones del Encargado
1. Tratar con fines exclusivos del encargo (art. 19 Ley 1581). Prohibido usar datos para otras finalidades.
2. Garantizar seguridad y confidencialidad; reportar al Responsable cualquier contacto no autorizado o uso indebido.
3. Archivos y reportes de seguridad; auditoria del tratamiento (a costos del Responsable, [frecuencia anual]).
4. Registrar incidentes: notificar al Responsable en [48] horas con alcance y medidas.
5. Auditoria de accesos a datos clinicos (usuario, rol, fecha, hora).
6. Garantizar derechos del titular y canal PQR, derivando al Responsable cuando sea Responsable quien debe responder.
7. Cumplir politicas del Responsable en tiempo y alcance del encargo.

## 4. Subencargados (autorizacion previa)
El Responsable AUTORIZA los siguientes subencargados y su ubicacion:

| Subencargado | Servicio | Pais/region |
|---|---|---|
| Telnyx | Telefonía/WhatsApp | [___] |
| [Proveedor LLM/Whisper] | Transcripcion e interpretacion | [___] |
| Aiven | PostgreSQL | [___] |
| [Render/Vercel] | Hosting | [___] |

Cualquier nuevo subencargado requiere aprobacion previa y escrita del Responsable (max. [15] dias para responder). Los subencargados quedan sujetos a obligaciones equivalentes. Transferencias internacionales solo conforme art. 26 Ley 1581 y con medidas equivalentes.

## 5. Seguridad
TLS 1.2+ en transito; cifrado en reposo; control de acceso por roles; aislamiento por tenant (el Encargado no permite consultas cruzadas entre Responsables). Anexo tecnico de seguridad: [documentar medidas en anexo separado].

## 6. Proteccion de datos sensibles
Datos de salud son sensibles: el Encargado los trata solo con la autorizacion capturada en canal y evidencia conservada; prohibida la decision clinica automatizada.

## 7. Terminacion y devolucion
Al terminar el contrato, el Encargado devuelve o elimina (a eleccion del Responsable) todos los datos, con certificacion escrita, en max. [30] dias. Solo retiene lo exigido por ley, bajo el mismo regimen de confidencialidad.

## 8. Responsabilidad
El Encargado responde ante el Responsable por incumplimiento de este encargo; las obligaciones frente a la Superintendencia Nacional de Salud y ante los titulares corresponde asumirlas segun rol de cada parte. Ley aplicable: colombiana; solucion de controversias: [ciudad/sede arbitral].

## 9. Firmas
RESPONSABLE: [___] — ENCARGADO: [___]

---
# ANEXO 1 — AVISO DE PRIVACIDAD EN CANAL (codigo, no papel)

> Pegar al inicio del prompt del agente (Telnyx). El aviso va ANTES de pedir cualquier dato de identidad.

**Llamada saliente:**
> "Hola, llamo de parte de [Clinica]. Esta llamada es grabada. Sus datos son tratados por Upway como encargado de [Clinica], con fines de programacion de citas y atencion en salud. Puede ejercer sus derechos escribiendo a [correo PQR de la Clinica]. ¿Continuamos?"

**WhatsApp (primer contacto):**
> "Para ayudarte con tu cita, [Clinica] usa Upway para tomar tus datos y agendar. Tus datos se tratan segun la politica de [Clinica] ([link]) y puedes solicitar su actualizacion o eliminacion respondiendo este mensaje. ¿Nos confirmas tus datos?"

**Reglas duras:**
1. Nunca pedir un dato de identidad ANTES del aviso.
2. Si el titular niega la autorizacion: no capturar; ofrecer gestion presencial.
3. Guardar marca de tiempo + transcript del aviso como evidencia de autorizacion.
4. El link de la politica apunta al sitio del RESPONSABLE (no de Upway).
