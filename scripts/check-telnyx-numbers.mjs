/**
 * Diagnóstico de números Telnyx para Upway Health (voz / Call Control).
 *
 * Responde de una sola pasada:
 *  1. ¿Qué números YA tengo en la cuenta?           (GET /v2/phone_numbers)
 *  2. ¿Qué números COLOMBIANOS puedo comprar?       (GET /v2/available_phone_numbers)
 *  3. ¿Qué documentos pide Colombia?                (GET /v2/regulatory_requirements)
 *  4. ¿Qué Call Control Apps tengo y cuál es su ID? (GET /v2/call_control_applications)
 *
 * Uso:
 *   node --env-file=.env scripts/check-telnyx-numbers.mjs
 *
 * OJO: NO imprime secretos. Solo cuenta y enmascara.
 */

const API = 'https://api.telnyx.com/v2';
const KEY = process.env.TELNYX_API_KEY ?? '';

if (!KEY) {
  console.error('Falta TELNYX_API_KEY. Corre el script con --env-file=.env');
  process.exit(1);
}

async function call(path, label) {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = body?.errors?.[0]?.detail ?? JSON.stringify(body).slice(0, 200);
      console.log(`\n=== ${label} ===`);
      console.log(`  HTTP ${res.status} -> ${detail}`);
      return { ok: false, status: res.status, body };
    }
    return { ok: true, status: res.status, body };
  } catch (err) {
    console.log(`\n=== ${label} ===`);
    console.log('  ERROR de red: ' + (err instanceof Error ? err.message : String(err)));
    return { ok: false, status: 0, body: {} };
  }
}

function mask(phone) {
  if (typeof phone !== 'string' || phone.length < 6) return '(n/a)';
  return phone.slice(0, 5) + '****' + phone.slice(-2);
}

function areaCodeOf(phone) {
  // E.164 CO: +57 + indicativo(1) + numero. Aproximación útil para agrupar.
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.startsWith('57') && digits.length >= 5) return digits.slice(2, 5);
  return 'otros';
}

// ---------------------------------------------------------------- 1) Mis números
const mine = await call('/phone_numbers?page[size]=100', '1) NÚMEROS QUE YA TENGO');
if (mine.ok) {
  const list = mine.body?.data ?? [];
  console.log(`  Total: ${list.length}`);
  if (list.length === 0) {
    console.log('  (ninguno todavía — por eso TELNYX_DEFAULT_PHONE_NUMBER está vacía)');
  }
  for (const n of list.slice(0, 20)) {
    const status = n?.status ?? '?';
    const conn = n?.connection_id ?? '(sin asignar)';
    console.log(
      `  - ${mask(n?.phone_number)} | ${n?.phone_number_type ?? '?'} | ${status} | connection: ${conn}`
    );
  }
  if (list.length > 0) {
    const sinAsignar = list.filter((n) => !n?.connection_id).length;
    if (sinAsignar > 0) {
      console.log(
        `\n  ⚠ ${sinAsignar} número(s) SIN asignar a una Call Control App => la IA NO los contestará.`
      );
    }
  }
}

// ------------------------------------------- 2) Disponibles en Colombia para voz
const co = await call(
  '/available_phone_numbers?filter[country_code]=CO&filter[features]=voice&filter[limit]=50',
  '2) NÚMEROS DISPONIBLES EN COLOMBIA (voz)'
);
let coCount = 0;
if (co.ok) {
  const list = co.body?.data ?? [];
  coCount = list.length;
  console.log(`  Disponibles AHORA: ${list.length}`);
  if (list.length === 0) {
    console.log('  (vacío => no hay stock self-serve para CO con voz en este momento)');
  }
  const porIndicativo = {};
  for (const n of list) {
    const ac = areaCodeOf(n?.phone_number);
    porIndicativo[ac] = (porIndicativo[ac] ?? 0) + 1;
  }
  for (const n of list.slice(0, 10)) {
    const feat = Array.isArray(n?.features)
      ? n.features
          .map((f) => (typeof f === 'string' ? f : (f?.name ?? JSON.stringify(f))))
          .join(',')
      : 'sin features';
    const cost = n?.cost_information;
    const costStr = cost
      ? ` | upfront: ${cost.currency ?? ''} ${cost.upfront_cost ?? '0'} | mensual: ${
          cost.currency ?? ''
        } ${cost.monthly_cost ?? '0'}`
      : '';
    console.log(`  - ${mask(n?.phone_number)} | ${n?.phone_number_type ?? '?'} | ${feat}${costStr}`);
    const region = n?.region_information;
    if (Array.isArray(region)) {
      const regStr = region
        .map((r) => `${r?.region_name ?? '?'}=${r?.region_value ?? '?'}`)
        .join(', ');
      if (regStr) console.log(`      region: ${regStr}`);
    }
  }
  const entries = Object.entries(porIndicativo);
  if (entries.length) {
    console.log('  Por indicativo: ' + entries.map(([k, v]) => `${k}:${v}`).join('  '));
  }
}
// ------------------------------------- 3) Requisitos regulatorios para Colombia
const reg = await call(
  '/regulatory_requirements?filter[country_code]=CO&filter[phone_number_type]=local&page[size]=25',
  '3) REQUISITOS REGULATORIOS DE COLOMBIA (qué documentos piden)'
);
if (reg.ok) {
  const list = reg.body?.data ?? [];
  console.log(`  Requisitos: ${list.length}`);
  if (list.length === 0) {
    console.log('  (vacío => CO no aparece con requisitos cargados, o no está soportado)');
  }
  for (const r of list.slice(0, 15)) {
    console.log(
      `  - tipo: ${r?.requirement_type ?? '?'} | nombre: ${r?.name ?? '?'} | locale: ${
        r?.locality ?? '(nacional)'
      } | phone_type: ${r?.phone_number_type ?? ''} | action: ${r?.action ?? ''}`
    );
  }
  // Cada grupo trae los documentos ANIDADOS en `regulatory_requirements`.
  for (const group of list) {
    console.log(
      `  Grupo: ${group?.country_code ?? '?'} | action: ${group?.action ?? '?'} | tipo: ${
        group?.phone_number_type ?? '?'
      }`
    );
    const docs = group?.regulatory_requirements ?? [];
    console.log(`  Documentos requeridos: ${docs.length}`);
    for (const d of docs) {
      console.log(`  * ${d?.name ?? '(sin nombre)'}  [${d?.field_type ?? '?'}]`);
      if (d?.description) {
        console.log('    ' + String(d.description).replace(/\s+/g, ' ').slice(0, 320));
      }
    }
  }
  const docIds = new Set();
  for (const r of list) {
    for (const d of r?.regulatory_requirements ?? []) {
      if (d?.field_value) docIds.add(`${d.field_type}=${d.field_value}`);
    }
  }
  if (docIds.size) {
    console.log('  Valores esperados: ' + Array.from(docIds).slice(0, 10).join('  |  '));
  }
}

// -------------------------- 4) Call Control Applications (a quién se asigna)
const apps = await call('/call_control_applications?page[size]=50', '4) CALL CONTROL APPS');
if (apps.ok) {
  const list = apps.body?.data ?? [];
  console.log(`  Total: ${list.length}`);
  for (const a of list.slice(0, 10)) {
    const isOurApp = a?.id === process.env.TELNYX_APP_ID;
    console.log(
      `  - ${a?.application_name ?? '(sin nombre)'} | id: ${a?.id ?? '?'}${
        isOurApp ? '  <= ESTA es la de .env (TELNYX_APP_ID)' : ''
      }`
    );
    console.log(`      webhook_event_url: ${a?.webhook_event_url ?? '(sin webhook)'}`);
  }
  if (process.env.TELNYX_APP_ID) {
    const ourApp = list.find((a) => a?.id === process.env.TELNYX_APP_ID);
    if (!ourApp) {
      console.log('\n  ⚠ TELNYX_APP_ID de .env NO aparece en esta cuenta.');
    } else if (ourApp.webhook_event_url !== 'https://upway.business/api/voice/webhooks') {
      console.log('\n  ⚠ El webhook de la app NO apunta a https://upway.business/api/voice/webhooks');
      console.log(`     Está en: ${ourApp.webhook_event_url ?? '(vacío)'}`);
    }
  }
}

// ------------------------------------------------------------- Veredicto
console.log('\n==================== VEREDICTO ====================');
console.log(`Números propios: ${mine.ok ? (mine.body?.data ?? []).length : 'no consultable'}`);
console.log(`DIDs CO con voz disponibles ahora: ${co.ok ? coCount : 'no consultable'}`);
if (co.ok && coCount > 0) {
  console.log('=> SÍ puedes comprar número de Colombia self-serve. Compra y asígnalo a la Call Control App.');
  console.log('   Portal: Numbers -> Buy Numbers  (NO "Connectivity Suite -> Mobile Numbers").');
} else if (co.ok) {
  console.log('=> No hay stock CO self-serve en este momento.');
  console.log('   Revisa los requisitos regulatorios de arriba: si piden documentos, súbelos en');
  console.log('   Numbers -> Regulatory Requirements y reintenta.');
  console.log('   Si sigue vacío: portar el número de la clínica o usar desvío de llamadas.');
} else {
  console.log('=> No se pudo consultar disponibilidad (revisa el HTTP status de arriba).');
}
console.log('===================================================');
