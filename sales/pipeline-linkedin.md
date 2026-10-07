# Pipeline de primeros contactos (LinkedIn)

Objetivo: llenar el CRM con **10 contactos calificados en 4 semanas** y al menos 2 demo citadas. Uso: semanal en el standup + check al final de cada día hábil.

## 1. Ventana de oportunidad (target)

| Segmento | Por qué | Ejemplo de lo que buscas |
|---|---|---|
| Clínicas y centros de salud privados (30-200 empleados) | Pagan el esfuerzo operativo de cobranza; ya prueban voz que atiende (demo). | Dirección, administradora de cuenta, director de operaciones. |
| Centros de salud / UPS / ESTAB (red privada del SUS) | Reglas de RNBD/SIC y cumplimiento documental: identidad es el complemento natural. | Responsable de calidad o cobranza. |
| Grupos de medicina interna / group practices | Múltiples consultas, agenda compartida, equipo de cobranza. | Gerente médico o financiero. |
| Inmobiliarias y centros de alquiler | Gestionan planteles, visitas y pagos (Upway Inmobiliarias es el caso). | Administradora de alquileres, comprador/a. |
| Socios de soluciones en salud (distribuidores, consultores, alianzas) | Abren canales sin costo de cobranza; refunden por cuota. | Gerente de canales. |
| Alianzas de pago (betters, EPS privadas, aseguradoras) | Se unen a canales de cliente; refuerzan el cumplimiento. | Responsable de comercios. |

## 2. Filtrado de lead (no todo call)

Un lead solo entra en el pipeline si cumple **al menos 2 de 3** filtros:

1. Tiene gasto en cobranza/operaciones ≥ 3 misiones mensuales o 200+ datos de pacientes al mes.  
2. Tiene decisiones duplas o acceso directo a la dirección/contabilidad.  
3. Ya está probando soluciones de telefonia/voz (no es leads brutos de papeleo).

## 3. Contenido propio (canal)

- Landing: `/` (hero + demo de voz en vivo) y secciones `#verticales` (Upway Health/Center/Inmobiliarias).  
- Guion/taller telefónico: `cobrix-outreach/guion-llamada-tecnica-cobrix.md` (caso de uso de voz IA).  
- Mini-whiteboard: 1 pág. por SKU: `sales/sku-identidad-conforme-clon-voz.md`.  
- One-pager para la habitación: `sales/one-pager-identidad-clon-voz.html`.  
- Demo grabada en vivo: sección `Voz IA 24/7` de la landing.

## 4. Ejecución diaria (cronograma)

| Día | Acción |
|---|---|
| L1 | Cargar 10 leads de LinkedIn Recomendados + buscadores de directivos. |
| L2-L3 | Mensajes de entrada (template A) a 15 cuentas. |
| L4-L5 | Responder comentarios/enganches; avanzar a la lista de 8-10 activos. |
| L6-L7 | **Re-engagement** a 8 leads "no respuesta" (template B). |
| Semana 2-4 | Repetir el ciclo; pegar el 20 % más quebrado; pedir demo al 50 %. |

## 5. Templates

### Template A — Entrada (LinkedIn, ≤ 3 líneas)

> Hola [nombre], soy [tu nombre] de Upway. Construimos [beneficio 1] + [beneficio 2] para [segmento]: [resultado medible, 15 segundos]. ¿Tienes 10 minutos en la semana que viene para ver cómo funciona con [referencia secreta, 1]:1?

Política de envío: **1 mensaje + 1 respuesta**, luego un re-engagement (template B) el 4to día. No spam: hijo de network-first, no de blast.

### Template B — Re-engagement (D4)

> [Nombre], no me hice caso la vez pasada. Te escribo porque [dato curioso específico de la empresa: publicación, certificación, anuncio] me llamó la atención y pienso que encontramos un shortcut para [problema]. ¿Hay 3 minutos con alguien que decida sobre cobranza/telefonia? De lo contrario, perdón y te guardo el enlace por si acaso.

### Template C — Después de demo

> Gracias por el tiempo. Resumen de lo que viste: [1 línea de evidencia]. El siguiente paso opcional: [demo en vivo con tu agenda + precios por sede] o responder [duda 1-2] en 24h. Te mando el enlace y dejo la nota aquí.

## 6. CMS de leads (tabla en Excel/google sheets)

Columnas obligatorias: `lead, email, tel, dueño, segmento, pain, presupuesto(ARPA), contacto, fuente, funnel, fecha_próximo_contacto, observación`. Fecha de próximo contacto siempre la siguiente jornada diaria. Nada de "contactado" sin follow-up.

## 7. Métricas a mostrar en standup

- Leads cargados / semana: meta **40**.  
- Mensajes enviados: meta **70**.  
- Respuestas o enganches: meta **8**.  
- Demo citadas: meta **2** (una por SKU, idealmente).  
- Prospectos listos para firma (identidad): meta **1**.

## 8. Entregables del día a día

- `leads.xlsx` actualizado al cierre de día.  
- 1 lead con demo citada (para la llamada de seguimiento).  
- 1 fallido para aprender (lo que salió mal, qué se cambia la próxima semana).
