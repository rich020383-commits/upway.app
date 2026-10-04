#!/usr/bin/env node
/**
 * Diagnostico de CONECTIVIDAD a la base de datos (Aiven) — SOLO LECTURA.
 *
 * POR QUE EXISTE
 * --------------
 * Cuando `check-database-url.mjs` dice "OK" pero `prisma migrate status` sigue
 * fallando con P1001 ("Can't reach database server"), el problema ya NO es la
 * forma de la URL: es la RED. Este script aisla la causa entre las cuatro
 * habituales, sin adivinar:
 *
 *   1. DNS        el host resuelve a IPv4, a IPv6 o a ambos (dual-stack).
 *   2. IPv6       Prisma en contenedores sin ruta IPv6 (Render usa rangos
 *                 salientes IPv4) elige el AAAA, falla con ENETUNREACH y NO
 *                 cae a IPv4 -> P1001 (prisma#18079 y railway#907).
 *   3. Servicio   el puerto responde (ECONNREFUSED = Aiven apagado/en rebuild).
 *   4. Firewall   timeout = la IP saliente de Render esta bloqueada por el
 *                 IP filter de Aiven (por defecto es 0.0.0.0/0, abierto).
 *
 * Ademas prueba el handshake TLS (Aiven exige SSL): distingue P1001 (red) de
 * P1017 (certificado/SSL) y ayuda a separarlo de credenciales (P1005/P1017).
 *
 *   5. Credenciales  si la red llega, hace un login REAL con `pg` (la misma
 *                 credencial que usa Prisma) y separa "la red llega" de "la
 *                 contrasena sirve" (P1000). Si el archivo trae escapes %XX,
 *                 prueba tambien la variante CRUDA para detectar encoding.
 *
 * USO:    node scripts/diag-db-connectivity.mjs [--json]
 * SALIDA: 0 = se alcanzo la base Y autentico; 1 = hay un bloqueo accionable.
 * NUNCA imprime la contrasena: solo la enmascara.
 */

import dns from 'node:dns/promises';
import net from 'node:net';
import tls from 'node:tls';
import { pathToFileURL } from 'node:url';
import { resolverUrl, cargarEnvLocal, avisosDeConflicto } from './check-database-url.mjs';

/** Igual que check-database-url.mjs: si el puerto no aparece, Postgres usa 5432. */
const PUERTO_POSTGRES_DEFECTO = 5432;
const TIMEOUT_MS = 8000;

const USAR_JSON = process.argv.includes('--json');

/** `abcd1234` -> `ab****34`. Nunca la contrasena completa. */
function mascara(pass) {
  if (!pass) return '(sin contrasena)';
  if (pass.length <= 4) return '*'.repeat(pass.length);
  return `${pass.slice(0, 2)}${'*'.repeat(Math.max(4, pass.length - 4))}${pass.slice(-2)}`;
}

/**
 * Separa la URL en host/puerto/credenciales sin exponer nada.
 * Normaliza el esquema postgres -> https para que la API URL de Node lo parsee.
 * @param {string} url
 */
function parsear(url) {
  const p = new URL(url.replace(/^postgres:\/\//i, 'https://'));
  let host = p.hostname;
  if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1); // IPv6 literal
  const params = [...p.searchParams.keys()];
  return {
    host,
    port: p.port ? Number.parseInt(p.port, 10) : PUERTO_POSTGRES_DEFECTO,
    usuario: p.username || '(sin usuario)',
    password: p.password || '',
    base: (p.pathname || '').replace(/^\//, '') || '(sin nombre)',
    params,
  };
}

/** Resuelve A (IPv4) y AAAA (IPv6) por separado. */
async function resolverDns(host) {
  const r = { ipv4: [], ipv6: [], error: null };
  try {
    for (const d of await dns.lookup(host, { all: true })) {
      if (d.family === 4) r.ipv4.push(d.address);
      else if (d.family === 6) r.ipv6.push(d.address);
    }
  } catch (e) {
    r.error = e.code || e.message;
  }
  return r;
}

/** Intento de conexion TCP a UNA direccion concreta (familia 4 o 6). */
function probarTcp(direccion, port, family) {
  return new Promise((resolve) => {
    const inicio = Date.now();
    const socket = net.connect({ host: direccion, port, family, timeout: TIMEOUT_MS });
    let listo = false;
    const fin = (res) => {
      if (listo) return;
      listo = true;
      socket.destroy();
      resolve({ ...res, ms: Date.now() - inicio });
    };
    socket.once('connect', () => fin({ ok: true, detalle: 'TCP OK' }));
    socket.once('timeout', () => fin({ ok: false, detalle: `timeout >${TIMEOUT_MS}ms` }));
    socket.once('error', (e) => fin({ ok: false, detalle: e.code || e.message }));
  });
}
/** Handshake TLS (SNI = hostname). rejectUnauthorized:false para LEER el cert
 *  aunque no valide; asi distinguimos "SSL ofrecido" de "SSL roto". */
function probarTls(host, direccion, port, family) {
  return new Promise((resolve) => {
    const socket = tls.connect({
      host: direccion,
      port,
      servername: host,
      family,
      timeout: TIMEOUT_MS,
      rejectUnauthorized: false,
    });
    let listo = false;
    const fin = (res) => {
      if (listo) return;
      listo = true;
      socket.destroy();
      resolve(res);
    };
    socket.once('secureConnect', () => {
      const cert = socket.getPeerCertificate();
      fin({
        ok: true,
        autorizado: socket.authorized,
        authError: socket.authorizationError || null,
        cn: cert?.subject?.CN ?? '(sin CN)',
      });
    });
    socket.once('timeout', () => fin({ ok: false, detalle: 'timeout' }));
    socket.once('error', (e) => fin({ ok: false, detalle: e.code || e.message }));
  });
}

/** true si TODAS las pruebas de una familia fallaron por un patron dado. */
function todasFallanCon(pruebas, regex) {
  return pruebas.length > 0 && pruebas.every((p) => !p.ok && regex.test(p.detalle));
}

/** Traduce las pruebas a un veredicto accionable. */
function veredicto(dnsRes, pruebas) {
  if (dnsRes.error) {
    return {
      nivel: 'error',
      codigo: 'DNS',
      lineas: [
        `El DNS no resolvio "${dnsRes.host ?? ''}" (${dnsRes.error}). Ese hostname NO existe en el DNS publico.`,
        'Formato esperado de Aiven: <servicio>-<proyecto>.*.aivencloud.com (el "*" es 1+ subdominios de balanceo).',
        'Causas tipicas: hostname mal escrito, o el servicio Aiven fue borrado/renombrado.',
        'CAUSA MAS COMUN: el servicio figura "Powered off" en Aiven (el plan Free se apaga solo por inactividad). Al apagarse se eliminan las VMs y el host DEJA DE RESOLVER.',
        'FIX: Aiven Console > tu proyecto > Services > el servicio > Overview > Actions > Power on service (o `avn service update <servicio> --power-on`).',
        'FIX: Aiven Console > tu servicio > Overview > copia el "Host" y "Port" EXACTOS y pegalos en DATABASE_URL.',
        'Si el servicio fuera VPC-only (sin acceso publico), habilita Public access: Aiven asigna un host con prefijo "public-".',
      ],
    };
  }

  const ipv4Ok = pruebas.ipv4.filter((p) => p.ok).length;
  const ipv6Ok = pruebas.ipv6.filter((p) => p.ok).length;
  const hayIpv6 = pruebas.ipv6.length > 0;
  const hayIpv4 = pruebas.ipv4.length > 0;

  if (!hayIpv4 && hayIpv6) {
    return {
      nivel: 'error',
      codigo: 'SOLO_IPV6',
      lineas: [
        'El host resuelve SOLO a IPv6. Prisma en un contenedor sin ruta IPv6 da P1001.',
        'FIX: pide a Aiven una conexion IPv4 o usa el literal IPv4 (ver siguiente bloque).',
      ],
    };
  }

  if (ipv4Ok > 0 && hayIpv6 && ipv6Ok === 0) {
    return {
      nivel: 'warn',
      codigo: 'IPV6_SIN_RUTA',
      lineas: [
        'IPv4 responde, pero IPv6 NO. El contenedor no tiene ruta IPv6 (Render usa rangos IPv4).',
        'Prisma puede elegir el AAAA (IPv6) y fallar con P1001 aunque IPv4 funcione.',
        'FIX 1 (recomendado): usa el literal IPv4 de abajo como host en DATABASE_URL.',
        'FIX 2: en Render define NODE_OPTIONS=--dns-result-order=ipv4first y redeploya.',
      ],
    };
  }

  if (ipv4Ok > 0) {
    return {
      nivel: 'ok',
      codigo: 'RED_OK',
      lineas: [
        'La red alcanza la base por IPv4 y el TLS responde.',
        'Si `prisma migrate status` sigue fallando, ya no es red ni forma: son CREDENCIALES (P1005/P1017) o SSL.',
      ],
    };
  }

  const detalles = pruebas.ipv4.concat(pruebas.ipv6).map((p) => p.detalle).join(' | ') || '(sin direcciones)';
  if (todasFallanCon(pruebas.ipv4, /ECONNREFUSED/i)) {
    return {
      nivel: 'error',
      codigo: 'PUERTO_CERRADO',
      lineas: [
        `Conexion rechazada (ECONNREFUSED): ${detalles}.`,
        'El puerto esta cerrado: el servicio Aiven esta APAGADO o en rebuild, o el puerto/host no es el correcto.',
        'FIX: panel de Aiven > servicio > comprueba que esta "Running" (boton Power on si aparece).',
      ],
    };
  }
  if (todasFallanCon(pruebas.ipv4, /timeout/i)) {
    return {
      nivel: 'error',
      codigo: 'FIREWALL',
      lineas: [
        `Timeout al conectar (${detalles}): hay filtrado de paquetes.`,
        'Causa probable: el IP filter de Aiven bloquea las IPs SALIENTES de Render.',
        'FIX: Aiven > servicio > Service settings > Cloud and network > Edit IP address allowlist.',
        'Anade los rangos salientes de Render (Dashboard > servicio > Connect > Outbound) o, para probar, 0.0.0.0/0.',
      ],
    };
  }
  if (/ENETUNREACH|EHOSTUNREACH|EADDRNOTAVAIL/i.test(detalles)) {
    return {
      nivel: 'error',
      codigo: 'SIN_RUTA',
      lineas: [`Sin ruta al host (${detalles}). El contenedor no puede enrutar a esa familia de direcciones.`],
    };
  }
  return {
    nivel: 'error',
    codigo: 'SIN_CONEXION',
    lineas: [`No se pudo conectar por ninguna direccion (${detalles}).`],
  };
}
async function main() {
  cargarEnvLocal();
  const hallado = resolverUrl();
  if (!hallado) {
    console.error('[db-diag] Ninguna variable de base de datos definida (DATABASE_URL). En Render: Environment > DATABASE_URL.');
    process.exit(1);
  }

  for (const aviso of avisosDeConflicto()) console.warn(`[db-diag] ${aviso}`);

  const cfg = parsear(hallado.valor);
  const dnsRes = await resolverDns(cfg.host);
  dnsRes.host = cfg.host; // para el mensaje de error DNS

  const pruebas = { ipv4: [], ipv6: [] };
  for (const ip of dnsRes.ipv4) pruebas.ipv4.push({ ip, ...(await probarTcp(ip, cfg.port, 4)) });
  for (const ip of dnsRes.ipv6) pruebas.ipv6.push({ ip, ...(await probarTcp(ip, cfg.port, 6)) });

  // TLS solo sobre la primera direccion que respondio por TCP (la representativa).
  const primeraOk = pruebas.ipv4.find((p) => p.ok) ?? pruebas.ipv6.find((p) => p.ok) ?? null;
  const tlsRes = primeraOk
    ? await probarTls(cfg.host, primeraOk.ip, cfg.port, primeraOk.ip.includes(':') ? 6 : 4)
    : null;

  let v = veredicto(dnsRes, pruebas);

  // Solo tiene sentido probar credenciales si la red ya llego: si no, el fallo
  // de login seria ruido (el mensaje real es el de red).
  const creds = v.nivel === 'ok' ? await verificarCredenciales(cfg, hallado.valor) : null;
  if (creds && !creds.ok) v = veredictoCredenciales(creds, cfg);

  if (USAR_JSON) {
    console.log(
      JSON.stringify(
        {
          variable: hallado.clave,
          host: cfg.host,
          puerto: cfg.port,
          base: cfg.base,
          usuario: cfg.usuario,
          password: mascara(cfg.password),
          parametros: cfg.params,
          dns: dnsRes,
          tcp: pruebas,
          tls: tlsRes,
          credenciales: creds,
          veredicto: v,
        },
        null,
        2
      )
    );
    process.exit(v.nivel === 'ok' ? 0 : 1);
  }

  console.log(`[db-diag] Variable usada: ${hallado.clave}`);
  console.log('[db-diag] Destino:');
  console.log(`  - host        ${cfg.host}`);
  console.log(`  - puerto      ${cfg.port}`);
  console.log(`  - base        ${cfg.base}`);
  console.log(`  - usuario     ${cfg.usuario}`);
  console.log(`  - password    ${mascara(cfg.password)}`);
  console.log(`  - parametros  ${cfg.params.length ? cfg.params.join(', ') : '(ninguno)'}`);

  console.log('[db-diag] DNS:');
  if (dnsRes.error) {
    console.log(`  - ERROR       ${dnsRes.error}`);
  } else {
    console.log(`  - IPv4 (A)    ${dnsRes.ipv4.length ? dnsRes.ipv4.join(', ') : '(ninguna)'}`);
    console.log(`  - IPv6 (AAAA) ${dnsRes.ipv6.length ? dnsRes.ipv6.join(', ') : '(ninguna)'}`);
  }

  console.log('[db-diag] TCP:');
  for (const p of pruebas.ipv4.concat(pruebas.ipv6)) {
    const fam = p.ip.includes(':') ? 'IPv6' : 'IPv4';
    console.log(`  - ${fam} ${p.ip.padEnd(40)} ${p.ok ? 'OK' : 'FALLO'} (${p.detalle}, ${p.ms}ms)`);
  }

  if (tlsRes) {
    console.log('[db-diag] TLS:');
    if (tlsRes.ok) {
      console.log(
        `  - handshake   OK (CN=${tlsRes.cn}, autorizado=${tlsRes.autorizado}${tlsRes.authError ? `, aviso=${tlsRes.authError}` : ''})`
      );
    } else {
      console.log(`  - handshake   FALLO (${tlsRes.detalle})`);
    }
  }

  if (creds) {
    console.log('[db-diag] CREDENCIALES (login real con pg):');
    for (const r of creds.resultados) {
      const estado = r.ok
        ? `OK${r.version ? ` (${r.version})` : ''}`
        : r.omitido
          ? `OMITIDO (${r.omitido})`
          : `FALLO (${[r.code, r.mensaje].filter(Boolean).join(' ')})`;
      console.log(`  - ${r.etiqueta.padEnd(34)} ${estado}`);
    }
  }

  const icono = v.nivel === 'ok' ? 'OK' : v.nivel === 'warn' ? 'AVISO' : 'BLOQUEO';
  console.log(`\n[db-diag] VEREDICTO (${icono}, codigo=${v.codigo}):`);
  for (const l of v.lineas) console.log(`  - ${l}`);

  // El literal IPv4 es el arreglo mas fiable si el problema es IPv6.
  if (dnsRes.ipv4.length > 0 && (v.codigo === 'IPV6_SIN_RUTA' || v.codigo === 'SOLO_IPV6')) {
    console.log('\n[db-diag] DATABASE_URL forzando IPv4 (sustituye el host, conserva tus params):');
    console.log(`  postgresql://${cfg.usuario}:${mascara(cfg.password)}@${dnsRes.ipv4[0]}:${cfg.port}/${cfg.base}?sslmode=require`);
  }

  process.exit(v.nivel === 'ok' ? 0 : 1);
}

/**
 * Contrasena TAL CUAL aparece en el archivo (sin decodificar %XX). Si difiere de
 * la decodificada, hay percent-encoding de por medio y conviene probar ambas.
 * @param {string} url
 */
function segmentoCrudo(url) {
  const sinEsquema = url.replace(/^[a-z+]+:\/\//i, '');
  const autoridad = sinEsquema.split('/')[0].split('?')[0];
  const at = autoridad.lastIndexOf('@');
  if (at < 0) return { usuarioRaw: '', passRaw: '' };
  const info = autoridad.slice(0, at);
  const dosPuntos = info.indexOf(':');
  return {
    usuarioRaw: dosPuntos < 0 ? info : info.slice(0, dosPuntos),
    passRaw: dosPuntos < 0 ? '' : info.slice(dosPuntos + 1),
  };
}

/**
 * Login REAL con `pg` (dependencia del repo): es lo que `prisma migrate status`
 * hace por debajo. Separa "la red llega" de "la contrasena sirve" (P1000) sin
 * depender de Prisma, y devuelve el codigo Postgres (28P01 = clave incorrecta).
 * @param {{host: string, port: number, usuario: string, base: string}} cfg
 * @param {string} password
 */
async function probarAuth(cfg, password) {
  let Client;
  try {
    const mod = await import('pg');
    Client = mod.Client ?? mod.default?.Client;
  } catch {
    return { ok: false, omitido: 'paquete "pg" no disponible' };
  }
  if (typeof Client !== 'function') return { ok: false, omitido: 'paquete "pg" no disponible' };

  const cliente = new Client({
    host: cfg.host,
    port: cfg.port,
    user: cfg.usuario,
    password,
    database: cfg.base,
    ssl: { rejectUnauthorized: false }, // equivalente a sslmode=require
    connectionTimeoutMillis: TIMEOUT_MS,
  });
  try {
    await cliente.connect();
    const r = await cliente.query('SELECT version() AS v');
    return { ok: true, version: String(r.rows?.[0]?.v ?? '').split(' ').slice(0, 2).join(' ') };
  } catch (e) {
    return { ok: false, code: e.code ?? null, mensaje: e.message };
  } finally {
    await cliente.end().catch(() => {});
  }
}

/**
 * Prueba la contrasena decodificada y, si el archivo trae escapes %XX, tambien
 * la CRUDA. Saber cual funciono distingue "es el encoding" de "es la clave".
 * @param {{host: string, port: number, usuario: string, base: string}} cfg
 * @param {string} url
 */
async function verificarCredenciales(cfg, url) {
  const { passRaw } = segmentoCrudo(url);
  const variantes = [{ etiqueta: 'decodificada (la que usa Prisma)', valor: cfg.password }];
  if (passRaw && passRaw !== cfg.password) {
    variantes.push({ etiqueta: 'CRUDA (sin decodificar %XX)', valor: passRaw });
  }

  const resultados = [];
  for (const variante of variantes) {
    const r = await probarAuth(cfg, variante.valor);
    resultados.push({ etiqueta: variante.etiqueta, ...r });
    if (r.ok) break;
  }
  return {
    ok: resultados.some((r) => r.ok),
    crudaDistinta: passRaw !== cfg.password,
    crudaTienePorcentaje: passRaw.includes('%'),
    resultados,
  };
}

/** Veredicto cuando la red llega pero Postgres rechaza al usuario (P1000). */
function veredictoCredenciales(creds, cfg) {
  if (creds.resultados.every((r) => r.omitido)) {
    return {
      nivel: 'warn',
      codigo: 'CREDENCIALES_SIN_PROBAR',
      lineas: [
        'La red alcanza la base, pero no se pudo probar el login (falta el paquete "pg").',
        'Ejecuta `npx prisma migrate status`: si da P1000/P1005/P1017, el problema son las credenciales, no la red.',
      ],
    };
  }

  const detalle = creds.resultados
    .map((r) => `[${r.etiqueta}] ${[r.code, r.mensaje].filter(Boolean).join(' ')}`)
    .join(' | ');
  const lineas = [`Postgres RECHAZO las credenciales de "${cfg.usuario}": ${detalle}`];

  if (creds.crudaDistinta) {
    lineas.push('La contrasena del archivo NO coincide con la decodificada (trae escapes %XX): usa el valor CRUDO sin escapar.');
  }
  if (creds.resultados.some((r) => r.code === '28P01')) {
    lineas.push('Codigo 28P01 = contrasena incorrecta para ese usuario.');
  }
  if (creds.resultados.some((r) => r.code === '3D000')) {
    lineas.push(`Codigo 3D000 = la base "${cfg.base}" no existe en ese servidor.`);
  }

  lineas.push('FIX: Aiven Console > tu servicio > Connection information > "reveal password", copia la clave EXACTA y pegala en DATABASE_URL (y en Render Environment).');
  lineas.push('Ojo: @ # / ? & : % dentro de la contrasena debe ir percent-encoded; si dudas, regenerala en Aiven > Users > avnadmin > Reset password.');
  lineas.push('Nota: al encender un servicio apagado Aiven restaura el ultimo backup; si cambiaste la clave DESPUES de ese backup, el servidor vuelve a la anterior.');
  return { nivel: 'error', codigo: 'CREDENCIALES', lineas };
}

// Solo como CLI: al importarlo para testear no debe correr main().
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}