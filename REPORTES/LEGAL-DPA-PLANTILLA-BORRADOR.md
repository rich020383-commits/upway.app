# CONTRATO DE ENCARDO (DPA) — PLANTILLA UPWAY (BORRADOR)

> **Estado:** BORRADOR PARA REVISION JURIDICA. Ningun piloto activa Identidad Conforme sin este contrato firmado.
> **Marco:** art. 18 Ley 1581/2012 (obligacion de contrato de encargo), arts. 19 y 27 Decreto 1074/2015.

**RESPONSABLE:** [Clinica] · NIT [___]
**ENCARGADO:** Upway [Razon Social] S.A.S. · NIT [___]
**Fecha:** [___]

## 1. Objeto
El Responsable encarga al Encargado el tratamiento de datos personales de pacientes para: (a) captura de datos de identidad conforme para la IHCE (Res. 1888/2025); (b) programacion y confirmacion de citas por voz sobre linea telefonica; (c) [verificacion de aseguramiento, si se habilita]. El Encargado SOLO trata datos bajo instruccion documentada del Responsable.

## 2. Datos y titulares
Pacientes del Responsable: tipo y numero de documento, nombres y apellidos, fecha de nacimiento, sexo, municipio (DIVIPOLA), telefono, y datos de salud derivados de la programacion. [Habilitar opcional: estado de afiliacion en regimen.]

## 3. Obligaciones del Encargado
1. Tratar con fines exclusivos del encargo (art. 19 Ley 1581). Prohibido usar datos para otras finalidades.
2. Garantizar seguridad y confidencialidad; reportar al Responsable cualquier contacto no autorizado o uso indebido.
3. Archivos y reportes de seguridad; auditoria del tratamiento (a costos del Responsable, [frecuencia anual]).
4. Registrar incidentes y notificar al Responsable en [48] horas con alcance y medidas. **El plazo corre desde que el Encargado confirma el incidente, no desde que se produce:** el DPA de su proveedor de telefonia solo promete notificar *without undue delay* y *to the extent permitted by applicable law* (Telnyx DPA 7.1.1), sin plazo en horas.
5. Auditoria de accesos a datos clinicos (usuario, rol, fecha, hora).
6. Garantizar derechos del titular y canal PQR, derivando al Responsable cuando sea Responsable quien debe responder.
7. Cumplir politicas del Responsable en tiempo y alcance del encargo.

## 4. Subencargados (consentimiento general con derecho de objecion)

El Responsable otorga **consentimiento general** para los subencargados
declarados abajo. No hay aprobacion previa especifica por cada alta: el regimen
es el de las secciones 4.1 y 4.4 del DPA de la telefonia, es decir **derecho de
objecion por escrito dentro de 10 dias** desde el aviso. Como el Encargado solo
dispone de esos 10 dias, **el plazo que se acepte aqui no puede superar los
7 dias** (ver el ultimo parrafo de esta seccion).

| Subencargado | Servicio | Que dato toca | Pais/region |
|---|---|---|---|
| Telnyx | Telefonia + ASR + LLM + TTS del asistente de voz | Audio de la llamada y su transcripcion | Instalaciones primarias en **Estados Unidos** (DPA Telnyx 5.5). La region elegida solo es un *esfuerzo comercial razonable*, **no una garantia** (5.5), y el PoP exacto del trafico colombiano **no esta garantizado**: Telnyx lo confirma por escrito como dependiente del ruteo |
| Subencargados declarados de Telnyx (lista en `telnyx.com/legal/subprocessors`) | LLM, transcripcion (ASR) y sintesis de voz (TTS) que Telnyx contrata para sus AI Services | Mismo audio y su transcripcion | Pueden procesar **fuera de Estados Unidos**: p. ej. MiniMax/Nanonoble (Singapur), ResetData (Australia), VSHosting (Republica Checa). El ruteo lo decide Telnyx, no el Encargado |
| [Proveedor del Autopiloto] | Planeacion de operaciones (acciones de CRM) | Instruccion del dueno y estado de la operacion | [___] |
| Render | Hosting de la aplicacion | Todo lo anterior en reposo | [___] |
| [Aiven / Neon] | PostgreSQL | Todo lo anterior en reposo | [___] |

**Lo que si controlamos: nuestro lado de la cadena.** El Autopiloto recorria
antes seis proveedores (Groq, SambaNova, Mistral, OpenRouter, Kimi, Cerebras) y
se quedaba con el primero que respondiera. Eso hacia el destino **indeterminado
en runtime**: la clinica autorizaba un proveedor y la instruccion terminaba en
otro. Hoy el proveedor esta fijado en codigo (`AUTOPILOT_PROVIDER`) y la cascada
es opt-in de desarrollo.

**Lo que no controlamos: el lado de la telefonia.** Ahi la lista no es cerrada.
El proveedor la publica, la actualiza y solo permite objetar dentro de 10 dias.
Ademas declara que las redes de telecomunicaciones por las que circula la llamada
**"no se consideran Sub-processors"** (DPA Telnyx 4.6), de modo que existe un
tramo del recorrido del audio cuyo destinatario no aparece en ninguna lista.
Por eso el Encargado debe mantenerse suscrito al mecanismo de aviso (4.3), y por
eso **la unica via para acotar a un proveedor de IA concreto es usar credenciales
propias**: cuando el cliente configura su propia cuenta con un tercero, ese
tercero procesa bajo el contrato del cliente y deja de ser subencargado de la
telefonia (DPA Telnyx 4.8).

**Lo que NO resuelve.** Fijar un proveedor hace el tratamiento determinista y
declarable, pero **no** cambia la residencia: estos proveedores procesan fuera
de Colombia. Conservar el dato dentro del pais requiere autoalojamiento del
modelo, no configuracion.

**Lo que tampoco resuelve el DPA de la telefonia: el mecanismo de transferencia.**
Sus clausulas contractuales tipo (5.1) y su certificacion de marco de privacidad
(5.6) cubren **exclusivamente** transferencias desde el Espacio Economico Europeo,
Reino Unido y Suiza, y su anexo jurisdiccional (Schedule 4) nombra Australia,
Brasil, California, Canada, UE, Alemania, Israel, Japon, Singapur, Reino Unido,
Virginia y otras leyes estadounidenses: **Colombia no figura**. El mecanismo de
art. 26 Ley 1581 lo construye exclusivamente el Encargado.

**Aparte, y esto ya estaba construido:** la identidad conforme (tipo y numero de
documento, fecha de nacimiento, municipio) **no transita por ningun modelo**.
Se captura por catalogo cerrado o digito a digito, y la certificacion es
determinista sin llamar a ningun servicio externo
(`lib/health/identity/conformingRecord.ts`). El dato mas sensible del producto
no sale a un tercero porque no llega a existir una llamada a un tercero.

Cualquier nuevo subencargado requiere aviso previo al Responsable, y este puede
objeter por escrito **dentro de 7 dias** (el Encargado solo recibe 10 de su
proveedor). Los subencargados quedan sujetos a obligaciones equivalentes.
Transferencias internacionales solo conforme art. 26 Ley 1581 y con medidas
equivalentes.

## 5. Seguridad
TLS 1.2+ en transito; cifrado en reposo; control de acceso por roles; aislamiento por tenant (el Encargado no permite consultas cruzadas entre Responsables). Anexo tecnico de seguridad: [documentar medidas en anexo separado].

**Salvaguarda previa exigible: no es buena practica, es obligacion contractual.**
El DPA de la telefonia declara en su anexo de transferencias que *no procesa
intencionadamente datos sensibles* y traslada al cliente la responsabilidad de
las salvaguardas; su clausula 3.3 exige que las medidas tecnicas y organizativas
esten **antes de transmitir** datos sensibles (3.3(d)) y que se hayan obtenido
los consentimientos exigidos por la ley aplicable, incluidos los de grabacion de
lamadas (3.3(e)). En consecuencia **el aviso del Anexo 1 de este contrato no
puede omitirse ni acortarse**: sin el aviso al inicio de la llamada y su
evidencia, el Encargado incumple su propio contrato con la telefonia desde la
primera llamada.

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

**Llamada entrante (el canal oficial):**
> "Le atiende el asistente virtual de [Clinica]. Esta llamada es grabada. Sus datos son tratados por Upway como encargado de [Clinica], con fines de programacion de citas y atencion en salud. Puede ejercer sus derechos escribiendo a [correo PQR de la Clinica]. ¿Continuamos?"

> **Nota (sep-2026):** se retiro de este anexo el guion de primer contacto por WhatsApp. El canal oficial de Upway es la voz con IA sobre linea telefonica y la politica publica ya declara que no se ofrece mensajeria de terceros como canal de salud. Dejar aqui un guion de WhatsApp contradiria esa declaracion en el mismo paquete que firma el cliente.

**Reglas duras:**
1. Nunca pedir un dato de identidad ANTES del aviso.
2. Si el titular niega la autorizacion: no capturar; ofrecer gestion presencial.
3. Guardar marca de tiempo + transcript del aviso como evidencia de autorizacion.
4. El link de la politica apunta al sitio del RESPONSABLE (no de Upway).
