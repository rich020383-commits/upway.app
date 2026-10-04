#!/usr/bin/env node
/**
 * Diagnostico de DATABASE_URL — SOLO LECTURA, no toca la base de datos.
 *
 * POR QUE EXISTE
 * --------------
 * `npx prisma migrate status` valida el datasource del schema y falla con
 * P1013 ("The provided database string is invalid ... characters must be
 * escaped"), que no dice CUEIN es lo malo. El guardia de produccion
 * (`assertDatabaseUrlWellFormed` en lib/database-url.ts) SI diagnostica el
 * problema, pero solo corre en runtime de la app (`next start`), nunca en el
 * CLI de Prisma. Este script lleva esa validacion al shell, donde se ejecuta
 * `migrate status`.
 *
 * No reemplaza al guardia de produccion: lo complementa. El guardia decide si
 * la app arranca; este script explica QUE hay que arreglar en el dashboard.
 *
 * USO: node scripts/check-database-url.mjs [--selftest]
 * SALIDA: 0 = URL aparentemente valida; 1 = hay problema (lista accionable).
 * NUNCA imprime la contrasena: solo mascara (primeros 2 y ultimos 2 chars).
 * Toma el valor del entorno del proceso si ya existe; solo si no existe lee
 * .env/.env.local. Imprime el ORIGEN para no diagnosticar la variable
 * equivocada. Con --selftest corre 13 casos sinteticos y no lee ningun .env.
 */

import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** Mismo orden de precedencia que lib/database-url.ts. */
const CLAVES = ['DATABASE_URL', 'AIVEN_DATABASE_URL', 'POSTGRES_URL', 'DIRECT_URL'];

/**
 * De donde salio cada variable. Importa: si DATABASE_URL ya estaba en el
 * entorno del proceso (p.ej. exportada a mano en la misma terminal), el
 * archivo .env NO se usa y se diagnostica una URL distinta a la esperada.
 */
const ORIGEN = new Map();

/**
 * Variables definidas A LA VEZ en el entorno del proceso y en el archivo, con
 * valores DISTINTOS. Es el fallo mas caro de diagnosticar: dotenv nunca
 * sobreescribe una variable ya presente, asi que Prisma usa la del entorno y el
 * .env que acabas de editar se ignora en silencio (sintoma tipico: P1000 con una
 * contrasena que "sabes" que es correcta).
 */
export const CONFLICTOS = [];

/** Carga .env/.env.local a process.env sin dependencias (solo si existe). */
export function cargarEnvLocal() {
  for (const archivo of ['.env', '.env.local']) {
    if (!existsSync(archivo)) continue;
    for (const linea of readFileSync(archivo, 'utf8').split(/\r?\n/)) {
      const m = linea.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      const [, k, v] = m;
      if (process.env[k] !== undefined) {
        const enArchivo = v.replace(/^["']|["']$/g, '').trim();
        if (enArchivo && enArchivo !== process.env[k]) {
          CONFLICTOS.push({ clave: k, archivo, enProceso: process.env[k], enArchivo });
        }
        if (!ORIGEN.has(k)) ORIGEN.set(k, 'entorno del proceso (el .env no se usa para esta)');
        continue; // el entorno real manda
      }
      process.env[k] = v.replace(/^["']|["']$/g, '').trim();
      ORIGEN.set(k, archivo);
    }
  }
}

/**
 * Primera variable definida segun el orden de precedencia de lib/database-url.ts.
 * @param {Record<string, string | undefined>} [env]
 * @returns {{ clave: string, valor: string } | null}
 */
export function resolverUrl(env = process.env) {
  for (const clave of CLAVES) {
    const valor = env[clave]?.trim();
    if (valor) return { clave, valor };
  }
  return null;
}

/**
 * Avisos de CONFLICTO relevantes para la conexion (solo las variables de CLAVES).
 * Los usan `diag-db-connectivity.mjs` y `verify-db-schema.mjs` para no arrancar
 * diagnosticando una URL que el usuario no esta editando.
 * @returns {string[]}
 */
export function avisosDeConflicto() {
  return CONFLICTOS.filter((c) => CLAVES.includes(c.clave)).map(
    (c) =>
      `CONFLICTO en ${c.clave}: el entorno del proceso (${mascara(contrasenaDe(c.enProceso))}) y ` +
      `${c.archivo} (${mascara(contrasenaDe(c.enArchivo))}) tienen valores DISTINTOS. ` +
      `Gana el entorno: mientras esa variable exista, editar ${c.archivo} no cambia nada.`
  );
}

/** `abcd1234` -> `ab****34`. Nunca se imprime la contrasena completa. */
function mascara(pass) {
  if (!pass) return '(sin contrasena)';
  if (pass.length <= 4) return '*'.repeat(pass.length);
  return `${pass.slice(0, 2)}${'*'.repeat(Math.max(4, pass.length - 4))}${pass.slice(-2)}`;
}

/** Contrasena de una URL, solo para enmascararla en los mensajes. */
function contrasenaDe(url) {
  const m = /:\/\/[^:/?#@]*:([^@?#]*)@/.exec(url ?? '');
  return m ? m[1] : '';
}

/**
 * Vista de la URL con la contrasena oculta: sirve para ubicar el caracter que
 * rompe el parseo cuando los pasos 1-4 no lo encontraron (espacio o backslash
 * internos, por ejemplo). Nunca expone la contrasena completa.
 * @param {string} url
 * @param {string} password
 * @returns {string}
 */
function vistaSegura(url, password) {
  const oculta = password ? url.split(password).join(mascara(password)) : url;
  if (oculta.length <= 160) return oculta;
  return `${oculta.slice(0, 110)}...(${oculta.length} chars)...${oculta.slice(-40)}`;
}

/**
 * Revisa una DATABASE_URL y devuelve los problemas accionables encontrados.
 * @param {string} raw valor tal cual esta en el entorno (puede traer comillas)
 * @returns {{ ok: boolean, problemas: string[], avisos: string[], resumen: Record<string, string> | null }}
 */
export function diagnosticarDatabaseUrl(raw) {
  const problemas = [];
  const avisos = [];

  // 1. Comillas, backslashes o espacios como parte del valor: tipico al pegar
  //    DATABASE_URL="postgresql://..." en el formulario de Render. Ojo: cada
  //    caso se compara POR SEPARADO; si se compara el valor ya recortado
  //    contra un trim(), los espacios sobrantes quedan invisibles en ambos
  //    lados y nunca se reportan.
  const original = raw;
  const sinEspaciosExtremos = original.trim();
  let url = sinEspaciosExtremos.replace(/^["'\\]+|["'\\]+$/g, '').trim();
  if (url !== sinEspaciosExtremos) {
    problemas.push(
      'La URL tenia comillas o backslashes al inicio/final (incluidos como parte del valor). Debe empezar por postgresql:// y terminar en la ultima letra, sin " alrededor.'
    );
  }
  if (original !== sinEspaciosExtremos) {
    problemas.push(
      'La URL tenia espacios o saltos de linea al inicio/final. En Render eso se guarda como parte del valor y rompe la conexion: pega una sola linea, sin espacios.'
    );
  }
  if (/[\r\n]/.test(url)) {
    problemas.push('La URL contiene saltos de linea intermedios: pega una sola linea.');
    url = url.replace(/[\r\n]/g, '');
  }

  // 2. Protocolo
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    problemas.push(`Protocolo invalido: "${url.slice(0, 14)}...". Esperado postgresql://USER:PASS@HOST:PORT/DBNAME?params`);
    return { ok: false, problemas, avisos, resumen: null };
  }

  // 3. Patron de corrupcion documentado: parametros de query dentro del host
  //    (...user@host-&connection_limit=5&pool_timeout=208480.h.aivencloud.com:12132).
  const m = url.match(/^([a-z]+:\/\/)([^@/\s]+@)?([^/?\s]+)/i);
  if (!m) {
    problemas.push('No se pudo separar el hostname de la URL.');
    return { ok: false, problemas, avisos, resumen: null };
  }
  const host = m[3];
  if (host.includes('&') || host.includes('=')) {
    problemas.push(
      `Los parametros de query (&param=value) se filtraron dentro del host: "${host}". Los "&" van DESPUES del nombre de la base, no dentro del host.`
    );
  }

  // 4. Credenciales ANTES de new URL(): un "@", "#", "/", "%" roto o un
  //    espacio en el usuario/contrasena hacen que new URL() falle con un
  //    "Invalid URL" generico y el motivo real se pierde. Ese es el P1013
  //    "characters must be escaped". Se escanea el texto CRUDO (sin
  //    decodificar): un "%40" ya escapado se veria como "@" y daria falso
  //    positivo. El ultimo "@" es el que separa las credenciales del host.
  const sinEsquema = url.replace(/^[a-z]+:\/\//i, '');
  const corteCredenciales = sinEsquema.lastIndexOf('@');
  const userinfo = corteCredenciales >= 0 ? sinEsquema.slice(0, corteCredenciales) : '';
  const dosPuntos = userinfo.indexOf(':');
  const usuario = dosPuntos >= 0 ? userinfo.slice(0, dosPuntos) : userinfo;
  const password = dosPuntos >= 0 ? userinfo.slice(dosPuntos + 1) : '';
  const credencialesCrudas = usuario + password;
  if (credencialesCrudas) {
    const ilegales = [...new Set([...credencialesCrudas].filter((c) => /[@#/?{}\s\\^|"<>`]/.test(c)))];
    if (ilegales.length > 0) {
      problemas.push(
        `El usuario o la contrasena contienen caracteres que deben escaparse: ${ilegales
          .map((c) => (c === ' ' ? '<espacio>' : c))
          .join(' ')}. Escapelos con percent-encoding (%40 para @, %23 para #, %2F para /, %25 para %) o regenera la contrasena en Aiven.`
      );
    }
    if (/%(?![0-9A-Fa-f]{2})/.test(credencialesCrudas)) {
      problemas.push(
        'El usuario o la contrasena tienen un "%" que no es percent-encoding valido (% debe ir seguido de dos digitos hex, ej. %25). Ese es el P1013 "must be escaped".'
      );
    }
  }

  // 5. Parseo estricto con la API URL (igual que el guardia de produccion).
  let parsed;
  try {
    parsed = new URL(url.replace(/^postgres:\/\//i, 'https://'));
  } catch (e) {
    problemas.push(
      `new URL() rechaza la cadena: ${e instanceof Error ? e.message : String(e)}. Revisa los pasos 1-4 y la vista enmascarada de abajo.`
    );
    avisos.push(`Vista (contrasena oculta): ${vistaSegura(url, password)}`);
    return { ok: false, problemas, avisos, resumen: null };
  }
  if (!parsed.hostname) problemas.push('Hostname vacio.');
  if (parsed.port && !/^\d+$/.test(parsed.port)) problemas.push(`Puerto no numerico: "${parsed.port}".`);

  // 7. pool_timeout absurdo (mismo umbral del guardia: 1h).
  const pool = url.match(/[?&]pool_timeout=(\d+)/i);
  if (pool && Number.parseInt(pool[1], 10) > 3600) {
    problemas.push(`pool_timeout=${pool[1]} segundos es absurdo (mas de 1 hora). Debe ser &pool_timeout=20.`);
  }

  const params = [...parsed.searchParams.keys()];
  if (params.length === 0) avisos.push('Sin parametros de query: revisa que necesites sslmode=require (Aiven lo exige).');
  const dbname = (parsed.pathname || '').replace(/^\//, '');
  if (!dbname) avisos.push('Falta el nombre de la base (la parte despues del ultimo "/").');

  return {
    ok: problemas.length === 0,
    problemas,
    avisos,
    resumen: {
      protocolo: (url.match(/^([a-z]+):\/\//i)?.[1] ?? 'postgresql').toLowerCase(),
      usuario: parsed.username || '(sin usuario)',
      password: mascara(password),
      host: parsed.hostname,
      puerto: parsed.port || '(por defecto)',
      base: dbname || '(sin nombre)',
      parametros: params.length ? params.join(', ') : '(ninguno)',
    },
  };
}

/**
 * Autocomprobacion de la deteccion. NO lee `.env` ni toca la base de datos:
 * son cadenas sinteticas. Verifica que cada patron de corrupcion se sigue
 * detectando y que una URL buena NO se marca como mala.
 *   node scripts/check-database-url.mjs --selftest
 */
/**
 * @returns {{ nombre: string, valor: string, esperadoOk: boolean, obtenidoOk: boolean, ok: boolean, problemas: string[] }[]}
 */
export function selftest() {
  const H = 'upway-db-rich020383-8480.h.aivencloud.com';
  const casos = [
    [
      'Aiven correcta (sslmode + pool)',
      `postgresql://avnadmin:pass@${H}:12132/defaultdb?sslmode=require&connection_limit=5&pool_timeout=20`,
      true,
    ],
    ['Sin parametros de query: solo aviso', `postgresql://avnadmin:pass@${H}:12132/defaultdb`, true],
    ['Password con %40 escapado', `postgresql://avnadmin:p%40ss@${H}:12132/defaultdb?sslmode=require`, true],
    ['Comillas pegadas en Render', `"postgresql://avnadmin:pass@${H}:12132/defaultdb?sslmode=require"`, false],
    ['Espacios alrededor', `  postgresql://avnadmin:pass@${H}:12132/defaultdb?sslmode=require  `, false],
    ['Password con # sin escapar', `postgresql://avnadmin:p#ss@${H}:12132/defaultdb?sslmode=require`, false],
    ['Password con % roto', `postgresql://avnadmin:p%ss@${H}:12132/defaultdb?sslmode=require`, false],
    ['Password con @ sin escapar', `postgresql://avnadmin:p@ss@${H}:12132/defaultdb?sslmode=require`, false],
    ['Password con / sin escapar', `postgresql://avnadmin:pa/ss@${H}:12132/defaultdb?sslmode=require`, false],
    ['Espacio interno en la URL', `postgresql://avnadmin:pa ss@${H}:12132/defaultdb?sslmode=require`, false],
    [
      'Query filtrada dentro del host (P1013)',
      `postgresql://avnadmin:pass@${H}-&connection_limit=5&pool_timeout=208480.com:12132/defaultdb`,
      false,
    ],
    [
      'pool_timeout absurdo',
      `postgresql://avnadmin:pass@${H}:12132/defaultdb?sslmode=require&pool_timeout=208480`,
      false,
    ],
    ['Falta el protocolo postgresql://', `${H}:12132/defaultdb`, false],
  ];
  return casos.map(([nombre, valor, esperadoOk]) => {
    const r = diagnosticarDatabaseUrl(valor);
    return { nombre, valor, esperadoOk, obtenidoOk: r.ok, ok: r.ok === esperadoOk, problemas: r.problemas };
  });
}

/** Salida legible de `--selftest`. Sale con 1 si algun caso no da lo esperado. */
function correrSelftest() {
  const resultados = selftest();
  const fallos = resultados.filter((r) => !r.ok);
  for (const r of resultados) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.nombre}`);
    if (!r.ok) {
      console.log(`      esperado ok=${r.esperadoOk} / obtenido ok=${r.obtenidoOk}`);
      console.log(`      ${JSON.stringify(r.problemas)}`);
    }
  }
  console.log(`\n[selftest] ${resultados.length - fallos.length}/${resultados.length} casos como se esperaba`);
  process.exit(fallos.length === 0 ? 0 : 1);
}


function main() {
  if (process.argv.includes('--selftest')) return correrSelftest();
  cargarEnvLocal();
  const hallado = resolverUrl();
  if (!hallado) {
    console.error(
      `[database-url] Ninguna variable definida. Esperadas (en este orden): ${CLAVES.join(', ')}.\n` +
        '  En Render: Environment > la app > DATABASE_URL.'
    );
    process.exit(1);
  }

  const r = diagnosticarDatabaseUrl(hallado.valor);
  const origen = ORIGEN.get(hallado.clave) ?? 'entorno del proceso';
  console.log(`[database-url] Variable usada: ${hallado.clave} (origen: ${origen})`);
  for (const aviso of avisosDeConflicto()) console.error(`[database-url] ${aviso}`);
  if (r.resumen) {
    console.log('[database-url] Analisis:');
    for (const [k, v] of Object.entries(r.resumen)) console.log(`  - ${k.padEnd(11)} ${v}`);
  }
  for (const a of r.avisos) console.log(`  [aviso] ${a}`);

  if (r.ok) {
    console.log('[database-url] OK: la URL aparenta estar bien formada.');
    console.log('  Si "prisma migrate status" aun falla, no es la forma: es alcanzabilidad (P1001) o credenciales (P1005/P1017).');
    process.exit(0);
  }

  console.error('[database-url] PROBLEMAS ENCONTRADOS:');
  r.problemas.forEach((p, i) => console.error(`  ${i + 1}. ${p}`));
  console.error(
    '\nFormato correcto:\n  postgresql://USER:PASS@upway-db-XXXX.h.aivencloud.com:12132/defaultdb?sslmode=require&connection_limit=5&pool_timeout=20'
  );
  process.exit(1);
}

// Solo como CLI: al importar la funcion para testearla no debe correr main()
// (hace process.exit).
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}