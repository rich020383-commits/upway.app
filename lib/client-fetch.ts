/**
 * Errores de red leídos y traducidos para el cliente, sin filtrar el técnico.
 *
 * Antes, cada componente hacía `e instanceof Error ? e.message : '...'`. Con eso
 * un corte de conexión le llegaba al cliente como un `TypeError: Failed to
 * fetch` pelado: no dice si es que se cayó internet, si venció la sesión o si el
 * servicio está temporalmente caído. El cliente no puede hacer nada con eso.
 *
 * Este módulo mantiene el detalle en la consola —para poder diagnosticar— y
 * devuelve un mensaje que sí sirve para el usuario.
 */

export class FriendlyError extends Error {}

/** Texto por defecto según la operación que falló. */
const DEFAULTS = {
  voz: 'No pudimos cargar las voces de Upway.',
  caso: 'No pudimos consultar el estado de tu caso.',
  panel: 'No pudimos cargar tu panel.',
  revocar: 'No pudimos revocar la voz.',
};

export type FetchJsonOptions = RequestInit & { fallback?: string };

/**
 * `fetch` + parseo JSON, con los errores traducidos.
 *
 * Distingue cuatro fallos que el cliente sí puede diferenciar:
 *  · sin red / petición abortada  → problema de conexión
 *  · 401                          → sesión vencida, tiene que entrar otra vez
 *  · respuesta que no es JSON     → el servicio se cayó (no es culpa del cliente)
 *  · otro estado                  → se usa el mensaje del servidor, que ya es
 *                                   honesto, y solo si viene alguno
 */
export async function fetchJson<T>(url: string, opts: FetchJsonOptions = {}): Promise<T> {
  const { fallback, ...init } = opts;
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (cause) {
    // `Failed to fetch` no se muestra nunca: es el error crudo del navegador.
    console.error('[fetch] petición fallida', url, cause);
    throw new FriendlyError('No pudimos conectarnos con el servicio de Upway. Revisa tu conexión e inténtalo de nuevo.');
  }

  if (res.status === 401) {
    console.warn('[fetch] sesión no válida', url);
    throw new FriendlyError('Tu sesión venció. Vuelve a iniciar sesión para seguir.');
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch (cause) {
    // Una respuesta que no es JSON en una ruta de API significa normalmente
    // que el servidor devolvió una página de error: no es un problema del
    // cliente y no se le debe atribuir.
    console.error('[fetch] respuesta ilegible del servidor', url, res.status, cause);
    throw new FriendlyError('El servicio de Upway no respondió correctamente. Inténtalo en un momento.');
  }

  if (!res.ok) {
    const mensaje =
      data && typeof data === 'object' && 'error' in data && typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : (fallback ?? 'No pudimos completar la operación.');
    console.error('[fetch] error del servidor', url, res.status, data);
    throw new FriendlyError(mensaje);
  }

  return data as T;
}

export const FETCH_FALLBACKS = DEFAULTS;
