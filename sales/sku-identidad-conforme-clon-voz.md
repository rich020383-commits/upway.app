# Upway — Venta de SKU individuales

Doble producto modular que se vende **por separado** del plan de la clínica, y además como complemento de éste:

| SKU | Producto | Precio final | Margen |
|---|---|---|---|
| **IDENTIDAD** | Identidad Conforme | $290.000 COP / sede / mes | ~100 % (ARPA +67,6 % en Consultorio) |
| **CLONVOZ** | Voz IA 24/7 (clon de voz) | Pendiente de fijación en acta · sobre costo real $0,1225/min inbound | — |

Vigencia: acta 22-sep-2026 · tarifa final 01-oct-2026 (solo para nuevas activaciones y pagos posteriores al corte; los clientes vigentes conservan su tarifa hasta renovación — `docs/upway-politica-precios.md`).

---

## 1. SKU Identidad Conforme — $290.000 COP/sede/mes

**Qué es.** Validación de identidad de la persona que entra a la clínica/centro, conforme a la regulación vigente (documento + datos del usuario, catalogo cerrado de tipos de documento). Es software **SaaS multi-tenant**: el cliente no instala nada, solo consume la API.

**Requisitos para vender.** Que la zona de atención pueda registrar nombre, documento y datos de contacto de la persona; sin necesidad de cambiarse de sistema.

**Beneficios que venden.**  
- Acredita identidad conforme (cumpre requisitos de soporte/datos de pacientes: `docs/INTEGRACION-API-IDENTIDAD.md`).  
- **ARPA +67,6 % en Consultorio** y margen ~100 %: es la palanca de expansión más barata del negocio.  
- Se factura independientemente del plan de voz: el kilo de datos se cobra adicional, nunca se mezcla con la recuperación del desarrollo clínico (D1).  
- Negocia sin tocar la telefonia ni los números de la clínica: solo lectura/escritura de identidad del usuario.

**Reglas comerciales.**  
- Precio fijo por **sede** (un cliente puede tener varias sedes, cada una cobra su masa).  
- Pivot: si el cliente pide bajar el precio del módulo — **no se aplica** (punto 4, §5). Solo un mes de piloto a mitad de precio concedible por Dirección.  
- Solo se puede cotizar por debajo del costo all-in del minuto ($379) más el costo de números.

**Para cerrar.** Contacto: **contacto@upway.business**. Facturación: RFC/SIC/RNBD + firma digital Ley 527 (tarea administrativa pendiente del equipo de ventas, no del código — el código ya soporta RPM 1047/1015 visuales). El NIT sobrevive a la reforma estatutaria; si se cambia razón social de Upway, el documento fiscal se actualiza aparte.

---

## 2. SKU Clon de Voz — Voz IA 24/7

**Qué es.** Agente de voz con clon de offlining (o modelo de voz personalizada) que atiende la línea 24/7: entiende lo que le piden, agenda citas sobre tu calendario, sostiene varias llamadas a la vez y retoma el hilo de cada conversación. Incluye demo en vivo con voces colombianas (no se filtra idioma) y caché con reset para pruebas.

**Cómo se vende.**  
- **Versión demo:** llamada de prueba agendada con el tool `agenda_upway` (Telnyx) y preview de voz por API.  
- **Precio:** por la medición del proveedor de voz de producción (en `lib/autopilot.ts` / `lib/sophie` — ver `docs/INTEGRACION-API-IDENTIDAD.md`? no; ver `lib/autopilot.ts`). Fórmula: sobre costo real inbound $0,1225/min + overage único $690/min/mes (D2, mismo en los 4 planes). Valor final: **pendiente de fijación en el acta de precios**.

**Reglas comerciales.**  
- El overage es **único por vertical** (D2) — ningún otro plan lo puede comprar por separado.  
- El costo real $0,1225/min inbound es solo display: nunca se impone al cliente.  
- El proveedor de IA para producción no está definido todavía: se fija antes de sellar un contrato; el código apunta a `lib/autopilot.ts` / `lib/sophie`.  
- La sección de la landing (`Voz IA 24/7`) ya está lista como ventana de prueba; el `live dot` y el `demo frame` son estilos estáticos, no repinta en scroll.

**Para cerrar.** Agendar demo mediante el tool `agenda_upway` (Telnyx), canal `x-upway-tool-secret`; ver `api/tools/agenda`. Pide: número de teléfono + disponibilidad estimada de horas.

---

## 3. Roadmap de venta por SKU

- **Identidad:** más fácil de cerrar: precio fijo, margen ~100 %, no toca teléfono. Se sitúa antes que voz.
- **Clon de Voz:** necesario definir proveedor de IA produk, luego fijar precio en el acta y luego abrir ventas.
- **Ambos:** el primer cliente (o la primera renovación de cliente) define la escalera; el cobro se genera desde el mismo enlace de pago que el plan de la clínica.

## 4. Contacto y documentación de apoyo

- **Ventas:** contacto@upway.business  
- **Política de precios:** `docs/upway-politica-precios.md`  
- **Integración API Identidad:** `docs/INTEGRACION-API-IDENTIDAD.md`  
- **Jerarquía de red / DNS / Render:** `prisma/schema.prisma`, `render.yaml`, `.env.example`  
- **Tool de demo telefónica:** Telnyx → AI Assistant → `#agenda_upway` → `https://upway.business/api/tools/agenda`
