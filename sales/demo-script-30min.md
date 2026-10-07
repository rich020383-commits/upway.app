# Presentación de demo — 30 minutos

Objetivo de la demo: **evidencia** (no vender. El cliente decide: "quiero probar en su sede"). Usa la demo **en vivo** de voz, no menos de 2 veces en la llamada.

## 1. Guion por bloques

### 0-3 min — Apertura (clara y sin mentira)
> "Gracias por el tiempo. No voy a hablar de Upway por 30 minutos: voy a dejar que usted entienda cómo resolvería su problema en **manos**. Lo que voy a mostrar es un prototipo y un test: la demo de voz en vivo (1 min) + cómo se integra con su agenda (1 min). Al final, usted decide; yo solo aguanto preguntas."

### 3-8 min — Demo de voz en vivo (donde pierdes el 0 si no sales)
1. Busca el número de teléfono de la clínica (o el de un cliente) — **nunca desde la memory del cliente**.  
2. Usa el tool `agenda_upway` (Telnyx, `x-upway-tool-secret` → `POST /api/tools/agenda`) para **agendar la llamada de prueba** con un usuario de tu cuenta de demo.  
3. Mientras se conecta, **no** hables del producto: deja que la voz responda al 0 (es la prueba).  
4. Cuando suene, pide al cliente que **hable una frase** y oiga cómo responde (voz colombiana, sin filtro de idioma).  
5. Cierra con: "Esto es lo mismo que va a responder en su línea, 24/7, con su nombre, su agenda y su guion".

### 8-12 min — Conexión con la agenda (lo que el cliente compra)
1. En el panel `/health/agenda` (demo health org: `cmu739rt9000512jskksmvtb8`), muestra: recurso, servicio, horario semanal (L-V 08-17), cupos, waitlist.  
2. Repite la llamada: la voz agendó una cita (suena como un humano, no un bot). Muestra el ticket en el panel.  
3. Pide al cliente: "¿Cuántas horas de llamada al mes cree que desperdicia si no tiene voz?" → Conecta el conteo de `concurrentCalls` (display solo; costo real $0,1225/min inbound).

### 12-17 min — SKU por SKU (ver `sales/sku-identidad-conforme-clon-voz.md`)
- **Identidad Conforme** ($290.000/sede/mes): muestra que el cliente no instala nada: API → consulta_tipo_documento + datos del usuario; solo lectura/escritura de identidad. ¿La zona de atención guarda nombre, documento, contacto? → Sí: la compra. ¿No? → Entendido, dejamos de hablar.  
- **Clon de Voz** (precio pendiente de fijación, sobre costo real $0,1225/min + overage único $690/min): ¿Cuántas llamadas al día recibe? ¿Cuántas se atienden en un día promedio? → Es la diferencia entre quedarse con el teléfono y dejar que hable por usted.

### 17-25 min — El ajuste al cliente (el bloque que gana el contrato)
1. Pide al cliente: "¿Cuántas sedes?" → Ahora sí puedes hablar de escalera: identidad por sede + voz por plan de la clínica.  
2. Pide presupuesto real: "¿Cuánto le cuesta obtener 100 datos correctos al mes?" (si es posible, cifra de caja).  
3. Si el precio le genera ruido: recorta. No negocias el modulo de identidad (punto 4, §5 de la política de precios); **solo** se puede reducir el overage a mitad de precio por un mes (piloto).  
4. Si el cliente no está listo para firmar: **no rompas**. Pega un re-engagement al siguiente día (template C de `sales/pipeline-linkedin.md`).

### 25-30 min — Próximo paso concreto
- Demanda: "¿A qué fecha podemos hacer la demo con tu número y tu agenda en vivo?"  
- Entrega: el link de la demo + el enlace de la landing + el PDF de Idoneidad + contacto@upway.business.  
- Cierra con: "Puedo venir el lunes a las 10. ¿Me confirmas o te llamo yo?"

## 2. Objetos comunes y respuestas

| Objeto | Respuesta |
|---|---|
| "Ya tenemos un sistema de telefonia" | "El cambio no es el teléfono: es que ese sistema no puede **entender** y **agendar** sin humana. El demo es prueba de eso." |
| "Queremos ver estadísticas antes de comprar" | "La demo ya es la estadística: tu propio número hablando, tu propio horario. Los costos reales ($0,1225/min inbound) solo son display." |
| "El módulo de identidad no es para mi" | "Entendido. El módulo es por cada sede: la clínica con más enfoque en datos de pacientes es la que más gana. ¿La hay?" |
| "El precios está muy arriba" | "El overage es único por vertical y no puedes comprar por debajo del costo all-in del minuto. Si el precio le duele, reducimos al piloto a mitad de precio." |
| "No tengo tiempo para demo" | "La demo dura 4 minutos y se agendar en 20 segundos con tu propio número. Te dejo el enlace." |

## 3. Te kantantes de la venta

- La venta no es "señor, este producto es genial". La venta es: "**muéstrame que funciona**".  
- No uses la carbón de la landing para el cliente: la evidencia son sus propias calles.  
- La demo es posible sin promesas: el agente de voz habla de su base de conocimientos; no está entrenado para el nombre de su clínica (eso le pides en el panel del demo, no en la demo).  
- En el cierre, el referendo es: "¿esta semana o no?; si no, me llamo".

## 4. Entregables al final de cada demo

- Link a la demo grabada (o la graba con `agenda_upway` + `voice-preview`).  
- 1 línea de evidencia: "El X% de las llamadas del equipo se atendió con voz".  
- Proxime contacto: "Un mensaje en 24h con tus datos".  
- Etiqueta en CRM: `demo={fecha}` y `SKU={identidad|clon}`.
