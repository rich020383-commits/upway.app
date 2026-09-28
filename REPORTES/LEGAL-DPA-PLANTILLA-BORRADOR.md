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

El Responsable AUTORIZA los siguientes subencargados y su ubicacion. La lista
es **cerrada**: el destino de cada dato esta fijado en codigo, no se decide en
runtime.

| Subencargado | Servicio | Que dato toca | Pais/region |
|---|---|---|---|
| Telnyx | Telefonia + ASR + LLM + TTS del asistente de voz | Audio de la llamada y su transcripcion | Colocado junto a los PoP de Telefonia de Telnyx; confirmar por escrito el PoP exacto del trafico colombiano |
| [Proveedor del Autopiloto] | Planeacion de operaciones (acciones de CRM) | Instruccion del dueno y estado de la operacion | [___] |
| Render | Hosting de la aplicacion | Todo lo anterior en reposo | [___] |
| [Aiven / Neon] | PostgreSQL | Todo lo anterior en reposo | [___] |

**Por que la lista es cerrada y no una cascada.** El Autopiloto recorria antes
seis proveedores (Groq, SambaNova, Mistral, OpenRouter, Kimi, Cerebras) y se
quedaba con el primero que respondiera. Eso hacia el destino **indeterminado
en runtime**: la clinica autorizaba un proveedor y la instruccion terminaba en
otro, de modo que esta autorizacion previa no era exigible. Hoy el proveedor
esta fijado en codigo (`AUTOPILOT_PROVIDER`) y la cascada es opt-in de
desarrollo.

**Lo que NO resuelve.** Fijar un proveedor hace el tratamiento determinista y
declarable, pero **no** cambia la residencia: estos proveedores procesan fuera
de Colombia. Conservar el dato dentro del pais requiere autoalojamiento del
modelo, no configuracion.

**Aparte, y esto ya estaba construido:** la identidad conforme (tipo y numero de
documento, fecha de nacimiento, municipio) **no transita por ningun modelo**.
Se captura por catalogo cerrado o digito a digito, y la certificacion es
determinista sin llamar a ningun servicio externo
(`lib/health/identity/conformingRecord.ts`). El dato mas sensible del producto
no sale a un tercero porque no llega a existir una llamada a un tercero.

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
