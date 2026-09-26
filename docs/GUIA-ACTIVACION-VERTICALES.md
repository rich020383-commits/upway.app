# Guía de activación — Center e Inmobiliaria

Paso a paso para prender el servicio de un cliente que ya pagó. **No improvisar este
momento**: es la primera vez que el cliente escucha su agente.

---

## 0. Antes de empezar

| Requisito | Cómo se verifica |
|---|---|
| `UPWAY_INTERNAL_TOKEN` en Render | `POST /api/vertical/activate` sin token → debe dar **401** (si da 503, no está puesta y la activación está deshabilitada) |
| DID comprado y con línea asignada | Panel de Telnyx → Numbers. Anotar el número en formato **E.164**: `+573001112233` |
| Caso enviado por el cliente | El cliente ve su referencia `UPW-ONB-XXXX` en `/inmobiliarias/caso` o `/center/caso` |

> **El `caseRef` no se inventa.** Es el número que el cliente tiene en pantalla. Es el
> identificador del expediente, no del usuario: sirve para cualquier reintento.

---

## 1. Aprobar el caso

Aprobar y encender la voz son **dos actos separados**: aprobar es comercial (el
cliente pagó), prender la voz es técnico (el número tiene que existir).

Si el DID todavía no está listo, hacé solo esto y seguí después:

```bash
curl -X POST https://upway.business/api/vertical/activate \
  -H "x-upway-internal-token: $UPWAY_INTERNAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"segment":"inmobiliaria","caseRef":"UPW-ONB-XXXX","telefono":"+573001112233","soloAprobar":true}'
```

El cliente ya ve su panel y puede escribir sus instrucciones. **Se puede hacer el
lunes o el martes; no lo bloquees por el número.**

---

## 2. Encender la voz (con el DID listo)

```bash
curl -X POST https://upway.business/api/vertical/activate \
  -H "x-upway-internal-token: $UPWAY_INTERNAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"segment":"inmobiliaria","caseRef":"UPW-ONB-XXXX","telefono":"+573001112233"}'
```

Qué hace, en orden:

1. Aprueba el caso.
2. Asigna el número a la sede y fija su segmento.
3. Crea el asistente de voz con el guion y la voz indicados.
4. Deja el caso `ACTIVO`.

**Es idempotente**: si algo falla, se reintenta la misma llamada. El caso ya quedó
aprobado, así que el reintento no vuelve a pasar por aprobación comercial y **no se
duplica el asistente**.

### Respuestas posibles

| Código | Significado | Qué hacer |
|---|---|---|
| `200` | Listo | Seguir al paso 3 |
| `207` | Aprobado, falta config de voz | Revisar `TELNYX_API_KEY`. Reintentar. |
| `502` | Aprobado, falló Telnyx | **Reintentar la misma llamada.** No hay que reprobar nada. |
| `404` | No existe ese `caseRef` | Confirmar el segmento y el ref con el cliente |
| `400` | Datos inválidos | El teléfono debe ser E.164: `+57...`, sin espacios |

---

## 3. Probar antes de decirle que ya está

**No le digas al cliente que funciona hasta que lo hayas escuchado.** Marcá un
número tuyo y dejá que el agente se atienda solo:

```bash
curl -X POST https://upway.business/api/voice/calls \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=TU_COOKIE_DE_SESION" \
  -d '{"tiendaId":"ID_DE_LA_SEDE","to":"+57TU_NUMERO","consent":true}'
```

- `tiendaId`: sale de la respuesta de la activación.
- **La llamada se graba y es real**: el destino tiene que ser un número tuyo.
- Sin `consent: true` el endpoint rechaza: es un requisito legal, no un detalle.

Si no marca, revisá que el número esté en E.164 y que la línea esté activa en Telnyx.

---

## 4. Qué decirle al cliente

> "Listo, tu número ya está sonando. Te llamo yo mismo ahora para que lo escuches y
> me digas cómo suena: el nombre, lo que contesta y cómo agenda. Lo que quieras
> cambiar del guion, lo cambiás en tu panel cuando quieras."

Y después, en la llamada, cuatro preguntas concretas:

1. **¿Se entiende?** (si no, es el acento o la velocidad — se ajusta en el panel)
2. **¿El nombre está bien?** (se cambia en el panel)
3. **¿Agenda con los datos correctos?** (esto es lo importante de verdad)
4. **¿Qué nunca debe prometer?** (se lo pedís y lo metés a las instrucciones)

> **No le vendas más de lo que ya está.** La puesta en marcha termina cuando él
> escucha su agente. Cualquier cosa adicional (CRM, WhatsApp, reportes) es otro
> paso y otro acuerdo.

---

## 5. Después

El cliente, desde su panel, puede:

- Ver interesados/solicitudes, visitas y minutos consumidos
- Editar las instrucciones del agente
- Elegir o clonar la voz
- Revocar una voz clonada

Si algo sale mal, el checklist de **"Mi caso"** del cliente muestra en qué paso se
quedó: sede → agente → voz → número → recibiendo llamadas.

---

## Advertencias

- **Nunca imprimas `UPWAY_INTERNAL_TOKEN`** en un ticket, una captura o un mensaje.
- **Nunca reutilices `NEXTAUTH_SECRET` como token interno.** Firman cosas distintas y
  una filtración se lleva las dos.
- **Guarda el `caseRef` de cada activación** en tu bitácora. Es lo único que
  identifica el expediente.
