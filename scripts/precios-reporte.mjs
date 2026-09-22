// Reporte de tarifas Upway (Health e Inmobiliarias) — lee el CODIGO REAL, no una copia.
//
// Uso: node scripts/precios-reporte.mjs   (o: npm run precios)
//
// La verificacion que falla el build vive en lib/pricing/rules.test.ts (reglas R0-R7).
// Este script imprime el mismo calculo en formato humano para revisar la escalera,
// con los valores extraidos de lib/health/plans.ts, lib/health/plans-enterprise.ts y
// lib/inmobiliaria/plans.ts. Si un campo no se puede leer, el script falla en vez de
// imprimir numeros inventados.
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

// Constantes espejo de lib/telnyx/costs.ts + lib/pricing/rules.ts
const TRM = 3090;
const COST_PER_MIN = Math.round(0.1225 * TRM);
const COST_PER_NUMBER = Math.round(13.5 * TRM);
const OVERAGE = Math.round(0.2233 * TRM);
const HUMAN_MIN = Math.round((14 / 60) * TRM);
const UTIL = 0.55;
const ROUND = 1000;

const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
const pct = (n) => n.toFixed(1) + '%';

function field(block, name, id) {
  // Se corta en la coma para ignorar comentarios de linea (ej. setupCOP: 690000, // ...).
  const match = new RegExp('^    ' + name + ': ([^,\\n]+)', 'm').exec(block);
  if (!match) throw new Error('No pude leer ' + name + ' del plan ' + id);
  return match[1].trim();
}

function readPlans(relativePath) {
  const source = readFileSync(path.join(root, relativePath), 'utf8');
  return source
    .split(/\n  \{/)
    .filter((block) => /^    monthlyCOP: /m.test(block))
    .map((block) => {
      const id = /^    id: '([^']+)'/m.exec(block)?.[1];
      if (!id) throw new Error('Plan sin id en ' + relativePath);
      const rawOverage = field(block, 'overageCOP', id);
      return {
        id,
        monthlyCOP: Number(field(block, 'monthlyCOP', id)),
        setupCOP: Number(field(block, 'setupCOP', id)),
        includedMinutes: Number(field(block, 'includedMinutes', id)),
        includedNumbers: Number(field(block, 'includedNumbers', id)),
        overageCOP: /^\d+$/.test(rawOverage) ? Number(rawOverage) : OVERAGE,
      };
    });
}

function economics(plan) {
  const costFull = plan.includedMinutes * COST_PER_MIN + plan.includedNumbers * COST_PER_NUMBER;
  const costPlanning =
    plan.includedMinutes * UTIL * COST_PER_MIN + plan.includedNumbers * COST_PER_NUMBER;
  return {
    perMinute: plan.monthlyCOP / plan.includedMinutes,
    marginFull: ((plan.monthlyCOP - costFull) / plan.monthlyCOP) * 100,
    marginPlanning: ((plan.monthlyCOP - costPlanning) / plan.monthlyCOP) * 100,
    costFull,
  };
}

function report(title, plans) {
  const paid = plans.filter((p) => p.monthlyCOP > 0);
  console.log('\n=== ' + title + ' ===');
  console.log(
    'Plan'.padEnd(22) +
      'Min'.padStart(7) +
      'Nums'.padStart(6) +
      'Precio/mes'.padStart(14) +
      'Setup'.padStart(12) +
      '$/min'.padStart(8) +
      'Margen100%'.padStart(12) +
      'Margen55%'.padStart(11) +
      'Escalon'.padStart(10)
  );

  const problems = [];
  // El plan custom ("a cotizar": monthlyCOP 0 y overageCOP 0) no se valida: no tiene tarifa fija.
  paid
    .filter((p) => p.overageCOP !== OVERAGE)
    .forEach((p) =>
      problems.push(p.id + ': overage ' + money(p.overageCOP) + ' != tarifa unica ' + money(OVERAGE))
    );

  paid.forEach((plan, index) => {
    const e = economics(plan);
    const previous = index > 0 ? paid[index - 1] : null;
    const step = previous
      ? (plan.monthlyCOP - previous.monthlyCOP) / (plan.includedMinutes - previous.includedMinutes)
      : null;
    console.log(
      plan.id.padEnd(22) +
        String(plan.includedMinutes).padStart(7) +
        String(plan.includedNumbers).padStart(6) +
        money(plan.monthlyCOP).padStart(14) +
        money(plan.setupCOP).padStart(12) +
        Math.round(e.perMinute).toString().padStart(8) +
        pct(e.marginFull).padStart(12) +
        pct(e.marginPlanning).padStart(11) +
        (step === null ? '-' : Math.round(step).toString()).padStart(10)
    );

    if (e.marginFull < 30) problems.push(plan.id + ': margen a uso completo ' + pct(e.marginFull) + ' < 30%');
    if (e.marginPlanning < 55) problems.push(plan.id + ': margen a ' + UTIL * 100 + '% ' + pct(e.marginPlanning) + ' < 55%');
    if (e.perMinute > HUMAN_MIN) problems.push(plan.id + ': $/min ' + Math.round(e.perMinute) + ' > minuto humano ' + money(HUMAN_MIN));
    if (plan.monthlyCOP % ROUND !== 0 || plan.setupCOP % ROUND !== 0) {
      problems.push(plan.id + ': precio no cerrado (multiplos de ' + ROUND + ')');
    }
    if (previous) {
      const stepRate =
        (plan.monthlyCOP - previous.monthlyCOP) / (plan.includedMinutes - previous.includedMinutes);
      if (stepRate > OVERAGE * 0.95) {
        problems.push(
          plan.id +
            ': escalon ' +
            Math.round(stepRate) +
            ' > 95% del overage (' +
            Math.round(OVERAGE * 0.95) +
            ') -> ' +
            previous.id +
            ' + overage sale mas barato'
        );
      }
      if (e.perMinute >= economics(previous).perMinute) {
        problems.push(plan.id + ': $/min no decrece vs ' + previous.id);
      }
    }
  });

  console.log(
    problems.length === 0
      ? 'OK: la escalera cumple R0-R7.'
      : problems.map((p) => '  [FALLA] ' + p).join('\n')
  );
  return problems;
}

// ── Política vigente: fecha de corte y tarifas históricas (leídas de rules.ts) ──
function readPolicy() {
  const source = readFileSync(path.join(root, 'lib/pricing/rules.ts'), 'utf8');
  const effectiveFrom = /FINAL_TARIFF_EFFECTIVE_FROM = '([\d-]+)'/.exec(source)?.[1];
  if (!effectiveFrom) {
    throw new Error('No pude leer FINAL_TARIFF_EFFECTIVE_FROM de lib/pricing/rules.ts');
  }
  const legacy = {};
  const entry =
    /'(health|inmobiliaria):([a-z0-9-]+)': \{\r?\n    monthlyCOP: (\d+),\r?\n    setupCOP: (\d+),\r?\n    overageCOP: (\d+),/g;
  let match;
  while ((match = entry.exec(source))) {
    legacy[match[1] + ':' + match[2]] = {
      monthlyCOP: Number(match[3]),
      setupCOP: Number(match[4]),
      overageCOP: Number(match[5]),
    };
  }
  if (Object.keys(legacy).length === 0) {
    throw new Error('No pude leer LEGACY_TARIFFS de lib/pricing/rules.ts');
  }
  return { effectiveFrom, legacy };
}

function deltaPct(now, before) {
  if (!before) return now > 0 ? 'nuevo' : '-';
  const delta = ((now - before) / before) * 100;
  return (delta >= 0 ? '+' : '') + delta.toFixed(1) + '%';
}

function policyReport(healthPlans, inmobPlans) {
  const { effectiveFrom, legacy } = readPolicy();
  const catalogs = { health: healthPlans, inmobiliaria: inmobPlans };
  console.log('\n=== Politica vigente (acta 22-sep-2026) ===');
  console.log(
    'Tarifa final vigente desde ' +
      effectiveFrom +
      ': los contratos anteriores conservan su tarifa hasta renovar (resolveContractTariff en lib/pricing/rules.ts).'
  );
  console.log(
    '\nClave'.padEnd(34) +
      'Antes (mes/setup/overage)'.padStart(32) +
      'Ahora (mes/setup/overage)'.padStart(32) +
      'Delta mes'.padStart(12)
  );
  Object.keys(legacy)
    .sort()
    .forEach((key) => {
      const vertical = key.split(':')[0];
      const planId = key.split(':')[1];
      const before = legacy[key];
      const after = (catalogs[vertical] || []).find((plan) => plan.id === planId);
      if (!after) {
        console.log(key.padEnd(34) + '  [retirado del catalogo]'.padStart(30) + ''.padStart(30) + ''.padStart(12));
        return;
      }
      const fmt = (t) => money(t.monthlyCOP) + ' / ' + money(t.setupCOP) + ' / ' + money(t.overageCOP);
      console.log(
        key.padEnd(34) +
          fmt(before).padStart(32) +
          fmt(after).padStart(32) +
          deltaPct(after.monthlyCOP, before.monthlyCOP).padStart(12)
      );
    });
}

const health = readPlans('lib/health/plans.ts').concat(readPlans('lib/health/plans-enterprise.ts'));
const inmob = readPlans('lib/inmobiliaria/plans.ts');
const center = readPlans('lib/center/plans.ts');

console.log('Costo all-in: ' + money(COST_PER_MIN) + '/min | numero ' + money(COST_PER_NUMBER) + '/mes');
console.log('Overage unico: ' + money(OVERAGE) + '/min (margen ' + pct(((OVERAGE - COST_PER_MIN) / OVERAGE) * 100) + ')');
console.log('Minuto humano facturado (referencia de valor): ' + money(HUMAN_MIN));

const healthProblems = report('Upway Health', health);
const inmobProblems = report('Upway Inmobiliarias', inmob);
const centerProblems = report('Upway Center', center);
policyReport(health, inmob);

console.log(
  '\nPlanes leidos del codigo: Health ' +
    health.filter((p) => p.monthlyCOP > 0).length +
    ' | Inmobiliarias ' +
    inmob.filter((p) => p.monthlyCOP > 0).length +
    ' | Center ' +
    center.filter((p) => p.monthlyCOP > 0).length +
    ' | Custom (deal desk, "a cotizar") ' +
    [...health, ...inmob, ...center].filter((p) => p.monthlyCOP === 0).length
);

if (healthProblems.length > 0 || inmobProblems.length > 0 || centerProblems.length > 0) {
  process.exitCode = 1;
}
