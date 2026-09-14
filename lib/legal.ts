/**
 * Fuente ÚNICA de verdad para la identidad legal de la marca Upway.
 *
 * Situación actual: la sociedad que opera la marca es BARAKAH TECH HUB S.A.S.
 * Es la titular del RUT y de la cuenta de Bold que recibe los pagos, por eso los
 * Términos y la Política de Privacidad deben nombrarla mientras siga vigente esa
 * razón social (declarar una sociedad que aún no existe en Cámara de Comercio
 * genera un descuadre legal y con la facturación de Bold).
 *
 * Cambio pendiente: cuando se registre el cambio de razón social a
 * "Upway Business Group S.A.S." en Cámara de Comercio, basta actualizar
 * LEGAL_ENTITY aquí: el sitio, los correos, la privacidad y los términos lo toman
 * de esta constante, así que NO hay que buscar y reemplazar en 6 archivos.
 *
 * Regla de estilo: la MARCA visible para el cliente siempre es "Upway";
 * la razón social aparece solo donde se requiere identificación legal
 * (pie de página, correos, documentos legales).
 */

/** Marca comercial visible al cliente. */
export const BRAND_NAME = 'Upway';

/** Razón social vigente (titular del RUT y de la cuenta de Bold). */
export const LEGAL_ENTITY = 'BARAKAH TECH HUB S.A.S.';

/** Razón social objetivo una vez registrado el cambio en Cámara de Comercio. */
export const LEGAL_ENTITY_FUTURE = 'Upway Business Group S.A.S.';

/** Pie de página legal estándar para correos y sitio. */
export const LEGAL_FOOTER = `${LEGAL_ENTITY} · Marca ${BRAND_NAME}`;