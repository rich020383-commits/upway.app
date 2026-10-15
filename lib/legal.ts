/**
 * Fuente ÚNICA de verdad para la identidad legal de la marca Upway.
 *
 * Situación actual: la sociedad que opera la marca es BARAKAH TECH HUB S.A.S.
 * Es la titular del RUT y de la cuenta de Bold que recibe los pagos, por eso los
 * Términos y la Política de Privacidad deben nombrarla mientras siga vigente esa
 * razón social (declarar una sociedad que aún no existe en Cámara de Comercio
 * genera un descuadre legal y con la facturación de Bold).
 *
 * Decisión 2026-10-14: el cambio de razón social a "Upway Business S.A.S."
 * quedó POSTERGADO por decisión del socio (costo/tiempo conocidos para el día
 * que se active: cita virtual CCB, $300.000, 5 días hábiles; disparador: un
 * cliente realmente grande que lo exija). Mientras no exista el certificado de
 * existencia con el nombre nuevo, esta constante NO se toca — declarar el
 * nombre antes del certificado descuadra términos, privacidad y facturación
 * de Bold.
 *
 * Secuencia: acta socio única → inscripción Cámara → certificado → DIAN →
 * numeración → Bold → banco → SIC (marca UPWAY a nombre del nombre final) →
 * actualizar LEGAL_ENTITY aquí. El sitio, los correos, la privacidad y los
 * términos toman esta constante, así que NO hay que buscar y reemplazar en
 * 6 archivos. NIT sin cambios: va atado a la sociedad.
 *
 * Regla de estilo: la MARCA visible para el cliente siempre es "Upway";
 * la razón social aparece solo donde se requiere identificación legal
 * (pie de página, correos, documentos legales).
 */

/** Marca comercial visible al cliente. */
export const BRAND_NAME = 'Upway';

/** Razón social vigente (titular del RUT y de la cuenta de Bold). */
export const LEGAL_ENTITY = 'BARAKAH TECH HUB S.A.S.';

/**
 * NIT de la sociedad (certificado de existencia y representación legal de la
 * Cámara de Comercio de Bogotá).
 *
 * Va en privacidad y términos porque la política debe identificar al
 * responsable del tratamiento: razón social sola no basta en una due diligence
 * de salud. El NIT NO cambia con una reforma estatutaria — va atado a la
 * sociedad, no al nombre—, así que esta constante sobrevive a un futuro
 * cambio de razón social.
 */
export const LEGAL_NIT = '902080128-8';

/** Razón social objetivo del cambio postergado (decisión 2026-10-14).
 *  Una vez inscrito y con certificado, copiar este valor a LEGAL_ENTITY. */
export const LEGAL_ENTITY_FUTURE = 'Upway Business S.A.S.';

/** Pie de página legal estándar para correos y sitio. */
export const LEGAL_FOOTER = `${LEGAL_ENTITY} · Marca ${BRAND_NAME}`;

/* ==========================================================================
 * CANALES DE CORREO CORPORATIVO (dominio upway.business, 2026-10-14)
 * --------------------------------------------------------------------------
 * Fuente única para lo que se muestra públicamente. Regla de discreción:
 * al exterior solo correos de rol (ventas/soporte/legal/privacidad); los
 * buzones personales (richard@, miadebelfort@) son internos y NO van al
 * sitio ni a contratos. Ventas y soporte son buzones propios; legal y
 * privacidad son alias de admin@upway.business.
 * ========================================================================== */

/** Comercial: prospección, cotizaciones y propuestas. Buzón propio. */
export const CONTACT_EMAIL_SALES = 'ventas@upway.business';

/** Soporte técnico a clientes activos (SLA). Buzón propio. */
export const CONTACT_EMAIL_SUPPORT = 'soporte@upway.business';

/** Comunicaciones legales: DPA, contratos, notificaciones a subencargados. */
export const CONTACT_EMAIL_LEGAL = 'legal@upway.business';

/** Canal de privacidad: derechos ARCO y PQR de datos de la plataforma. */
export const CONTACT_EMAIL_PRIVACY = 'privacidad@upway.business';