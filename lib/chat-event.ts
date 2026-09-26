/**
 * Puente para abrir el chat de Sophie desde cualquier botón.
 *
 * `components/Chatbot.tsx` se monta una sola vez en el layout raíz y maneja su
 * propio estado `isOpen`, así que un botón en otra página no lo puede tocar
 * directamente. Antes de esto se resolvía con un `window.dispatchEvent` con el
 * nombre del evento escrito a mano en cada lado, que es la forma más fácil de
 * que se desincronicen en silencio: el botón deja de hacer algo y no hay ningún
 * error.
 *
 * El nombre vive acá una sola vez y ambos lados lo importan.
 */
export const ABRIR_CHAT_EVENT = 'abrir-chat';

/** Abre el chat de Sophie. Se puede llamar desde cualquier manejador de click. */
export function abrirChat(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(ABRIR_CHAT_EVENT));
}
