/**
 * Fuente ÚNICA de verdad para la identidad legal de la marca Upway.
 *
 * Situación actual: la sociedad que opera la marca es BARAKAH TECH HUB S.A.S.
 * Es la titular del RUT y de la cuenta de Bold que recibe los pagos, por eso los
 * Términos y la Política de Privacidad deben nombrarla mientras siga vigente esa
 * razón social (declarar una sociedad que aún no existe en Cámara de Comercio
 * genera un descuadre legal y con la facturación de Bold).
 *
 * Decisión 2026-10-10: se MANTIENE "BARAKAH TECH HUB S.A.S." — no existe
 * obligación legal de que la razón social coincida con la marca, y cambiarla
 * en pleno lanzamiento metía 2-4 semanas de fricción (DIAN presencial,
 * numeración de facturación, Bold, banco) con riesgo de retener pagos sin
 * beneficio operativo. Para la objeción de "marca vs sociedad" en clientes
 * grandes basta una carta de autorización de uso de marca + la marca UPWAY
 * registrada en la SIC a nombre de la sociedad vigente.
 *
 * Gatillo para retomar el cambio (ahí sí conviene): ronda de inversión,
 * adquisición, u otra circunstancia estratégica. Si llega, el trámite es:
 * reforma estatutaria en Cámara → certificado → DIAN (presencial) →
 * numeración → Bold → banco → actualizar LEGAL_ENTITY aquí. El sitio, los
 * correos, la privacidad y los términos toman esta constante, así que NO hay
 * que buscar y reemplazar en 6 archivos.
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

/** Razón social objetivo una vez registrado el cambio en Cámara de Comercio.
 *  Nombre decidido: "Upway Business S.A.S." (sin "Group"). */
export const LEGAL_ENTITY_FUTURE = 'Upway Business S.A.S.';

/** Pie de página legal estándar para correos y sitio. */
export const LEGAL_FOOTER = `${LEGAL_ENTITY} · Marca ${BRAND_NAME}`;