import { describe, it, expect, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * CONFINIDENCIALIDAD DEL PROVEEDOR DE VOZ
 * ========================================
 * Upway opera su voz con un socio contractual. Ese nombre no puede aparecer en
 * ninguna superficie que el cliente vea: ni textos, ni mensajes de error, ni
 * etiquetas del checklist, ni correos. Solo se declara donde la ley lo exige:
 * privacy y terminos (subencargados).
 *
 * Este test es la red que hace cumplir esa politica. Sin el, la proxima
 * funcionalidad de voz vuelve a escribir el nombre en un mensaje y nadie lo
 * nota hasta que un cliente lo lee.
 *
 * Lo que SÍ queda permitido, a proposito:
 *  - `app/privacy/**` y `app/terminos/**`: por ley.
 *  - Comentarios y documentación interna (no llegan al navegador).
 *  - Identificadores de código (`telnyxPhoneNumber`, `TELNYX_TOOL_SECRET`,
 *    `@/lib/telnyx/*`): son claves internas de Prisma, env e imports. Renombrar
 *    las columnas de BD exigiría una migración y no aporta nada al cliente.
 */

const ROOT = process.cwd();
const EXCLUDED_PREFIXES = ['app/privacy/', 'app/terminos/', 'upway-health/', 'node_modules/'];
// Estado de los stubs del diagnóstico público (debe existir antes de los mocks).
const voiceMissingStub = vi.hoisted(() => ({ value: ['TELNYX_DEFAULT_PHONE_NUMBER'] as string[] }));
const callMissingStub = vi.hoisted(() => ({ value: ['TELNYX_DEFAULT_PHONE_NUMBER'] as string[] }));

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.includes('.test.')) {
      yield full;
    }
  }
}

function isExcluded(relPath: string): boolean {
  const posix = relPath.split('\\').join('/');
  return EXCLUDED_PREFIXES.some((prefix) => posix.includes(prefix));
}

/** Quita el comentario de la línea: lo que queda es código, que sí llega al cliente. */
function sinComentario(linea: string): string {
  const corte = linea.search(/\/\/|\/\*/);
  return corte === -1 ? linea : linea.slice(0, corte);
}

/**
 * Divide un archivo en "código" (lo que puede llegar al cliente) descartando
 * comentarios de bloque y de línea. Un JSDoc `/** ... *\/` ocupa varias líneas,
 * así que hay que llevar el estado entre líneas: si no, la continuación
 * ` * la activación real de Telnyx...` se cuela como si fuera código.
 */
function lineasDeCodigo(contenido: string): string[] {
  const salida: string[] = [];
  let enBloque = false;
  for (const cruda of contenido.split(/\r?\n/)) {
    let linea = cruda;
    if (enBloque) {
      const fin = linea.indexOf('*/');
      if (fin === -1) continue;
      linea = linea.slice(fin + 2);
      enBloque = false;
    }
    const abre = linea.indexOf('/*');
    if (abre !== -1 && linea.indexOf('*/', abre) === -1) {
      linea = linea.slice(0, abre);
      enBloque = true;
    }
    // Marca de continuación de bloque ya cerrada arriba: `* texto`
    linea = linea.replace(/^\s*\*\s?/, '');
    salida.push(sinComentario(linea));
  }
  return salida;
}

/**
 * Valores técnicos del proveedor que NO son texto para el cliente: son el
 * formato que exige la API para identificar una voz. Viajan como dato, nunca
 * se muestran, y el panel siempre manda una etiqueta legible.
 */
const VALOR_TECNICO = /'Telnyx\.[A-Za-z0-9_.-]+'/g;

/** Logs de servidor: nunca se renderizan, así que no cuentan como fuga. */
function esLog(linea: string): boolean {
  return /^\s*console\.\w+\(/.test(linea);
}

/**
 * ¿Una aparición del nombre es un IDENTIFICADOR (interno, no lo ve el cliente)
 * o TEXTO (sí lo ve)?
 *
 * Identificador: `verifyTelnyx(`, `TelnyxEvent`, `appliedToTelnyx` — el nombre
 * va pegado a otras letras, o es parte de un valor técnico permitido.
 * Texto: `'Firma de voz inválida'` con el nombre, `label="Catálogo Telnyx"` — el
 * nombre está rodeado de espacios o comillas: alguien lo escribió para leerlo.
 */
function esTexto(indice: number, linea: string): boolean {
  const antes = linea[indice - 1] ?? ' ';
  const despues = linea[indice + 6] ?? ' ';
  const pegadoAntes = /[a-z]/.test(antes);
  const pegadoDespues = /[A-Za-z]/.test(despues);
  if (pegadoAntes || pegadoDespues) return false;
  // ¿Está dentro de un valor técnico permitido? ('Telnyx.female.sofia')
  for (const tecnico of linea.matchAll(VALOR_TECNICO)) {
    if (indice >= tecnico.index && indice < (tecnico.index ?? 0) + tecnico[0].length) return false;
  }
  return true;
}

function ofensoresDe(linea: string): boolean {
  if (esLog(linea)) return false;
  const regex = /Telnyx/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(linea)) !== null) {
    if (esTexto(m.index, linea)) return true;
  }
  return false;
}

function archivosDeCliente(): string[] {
  const salida: string[] = [];
  for (const base of ['app', 'components']) {
    for (const file of walk(join(ROOT, base))) {
      if (!isExcluded(file)) salida.push(file);
    }
  }
  return salida;
}

describe('confidencialidad del proveedor de voz en la superficie de cliente', () => {
  it('existe superficie de cliente que escanear (el test no está vacío)', () => {
    expect(archivosDeCliente().length).toBeGreaterThan(30);
  });

  it('ningún archivo de app/ ni components/ lo nombra en texto legible', () => {
    const ofensores: string[] = [];
    for (const file of archivosDeCliente()) {
      lineasDeCodigo(readFileSync(file, 'utf8')).forEach((linea, i) => {
        if (ofensoresDe(linea)) {
          ofensores.push(`${file.slice(ROOT.length + 1)}:${i + 1}  ${linea.trim()}`);
        }
      });
    }
    expect(ofensores).toEqual([]);
  });

  it('el diagnóstico público no devuelve el proveedor ni variables de entorno', async () => {
    // El GET de /api/voice/webhooks es público (es el destino del webhook
    // entrante). Antes devolvía `provider` y `missing: [TELNYX_*]`: eso se
    // leía sin autenticación. Ahora solo dice si cada capacidad está lista.
    vi.doMock('@/lib/telnyx/client', () => ({
      missingTelnyxVoiceEnv: () => voiceMissingStub.value,
      missingTelnyxCallEnv: () => callMissingStub.value,
    }));
    vi.doMock('@/lib/prisma', () => ({ prisma: { llamadaLog: { upsert: vi.fn() }, tienda: { update: vi.fn() } } }));

    const { GET } = await import('../app/api/voice/webhooks/route');
    const res = await GET();
    const cuerpo = JSON.stringify(await res.json());

    expect(cuerpo).not.toMatch(/telnyx/i);
    expect(cuerpo).not.toMatch(/TELNYX_/);
    expect(cuerpo).toContain('"voice"');
    expect(cuerpo).toContain('"calling"');
  });
});
