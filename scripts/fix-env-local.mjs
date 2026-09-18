/**
 * Ajusta el .env local sin imprimir valores sensibles.
 *
 *  1. Comenta la DATABASE_URL duplicada que apuntaba al endpoint directo.
 *     Tenía dos entradas y ganaba la última (el pooler), que es lo correcto,
 *     pero la primera era una trampa para quien leyera el archivo.
 *  2. Añade connection_limit=1 y pgbouncer=true a la DATABASE_URL del pooler.
 *  3. Comenta la NEXT_PUBLIC_APP_URL duplicada.
 *
 * Uso: node scripts/fix-env-local.mjs [--apply]
 */
import fs from 'node:fs';

const apply = process.argv.includes('--apply');
const path = '.env';

const ACCIONES = [];

const original = fs.readFileSync(path, 'utf8');
const eol = original.includes('\r\n') ? '\r\n' : '\n';
const lines = original.split(/\r?\n/);

// 1 y 3: comentar entradas duplicadas conservando la última aparición.
const porClave = new Map();
lines.forEach((line, i) => {
  const m = line.match(/^([A-Z0-9_]+)\s*=/);
  if (m) {
    const lista = porClave.get(m[1]) ?? [];
    lista.push(i);
    porClave.set(m[1], lista);
  }
});

const aComentar = new Set();
for (const clave of ['DATABASE_URL', 'NEXT_PUBLIC_APP_URL']) {
  const indices = porClave.get(clave) ?? [];
  if (indices.length > 1) {
    // Conservamos la última (la que realmente aplicaba) y comentamos el resto.
    indices.slice(0, -1).forEach((i) => aComentar.add(i));
  }
}

const resultado = lines.map((line, i) => {
  if (aComentar.has(i)) {
    const clave = line.match(/^([A-Z0-9_]+)/)?.[1] ?? 'VAR';
    ACCIONES.push(`L${i + 1}: comentada ${clave} duplicada`);
    return '# [duplicada, se conserva la ultima] ' + line;
  }
  return line;
});

// 2: añadir parámetros de conexión a la DATABASE_URL del pooler en uso.
for (let i = resultado.length - 1; i >= 0; i -= 1) {
  const line = resultado[i];
  if (!/^\s*DATABASE_URL\s*=/.test(line)) continue;

  const valor = line.slice(line.indexOf('=') + 1).trim().replace(/^"|"$/g, '');
  if (!valor.startsWith('postgres')) {
    ACCIONES.push('DATABASE_URL del pooler no es una URL de postgres: sin cambios');
    break;
  }
  if (!valor.includes('-pooler')) {
    ACCIONES.push('AVISO: la DATABASE_URL activa NO es el endpoint pooler');
  }

  const cambios = [];
  if (!/pgbouncer=/.test(valor)) cambios.push('pgbouncer=true');
  if (!/connection_limit=/.test(valor)) cambios.push('connection_limit=1');

  if (cambios.length === 0) {
    ACCIONES.push('DATABASE_URL ya tiene pgbouncer y connection_limit');
    break;
  }

  const separador = valor.includes('?') ? '&' : '?';
  const nuevoValor = valor + separador + cambios.join('&');
  resultado[i] = line.slice(0, line.indexOf('=') + 1) + '"' + nuevoValor + '"';
  ACCIONES.push('DATABASE_URL: anadido ' + cambios.join(' + '));
  break;
}

console.log('Acciones:');
ACCIONES.forEach((a) => console.log('  - ' + a));

if (!apply) {
  console.log('');
  console.log('DRY-RUN: no se escribio nada. Para aplicar: --apply');
  process.exit(0);
}

fs.writeFileSync(path, resultado.join(eol), 'utf8');
console.log('');
console.log('Aplicado. Copia este mismo ajuste a la variable DATABASE_URL de Render.');