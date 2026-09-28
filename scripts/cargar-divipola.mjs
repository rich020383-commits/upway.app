#!/usr/bin/env node
/**
 * scripts/cargar-divipola.mjs
 *
 * Genera el catalogo de municipios DIVIPOLA que usa la identidad conforme.
 *
 *   node scripts/cargar-divipola.mjs
 *
 * POR QUE ESTE SCRIPT EXISTE
 * --------------------------
 * `validateMunicipalityCode` validaba solo la FORMA del codigo (5 digitos,
 * departamento existente, no terminado en 000). Eso dejaba pasar municipios
 * inexistentes como 05999, que se certificaban igual. Para que la identidad
 * conforme tenga valor probatorio, el municipio tiene que existir de verdad.
 *
 * De donde salen los datos
 * -------------------------
 * Portal de Datos Abiertos del Gobierno Nacional (datos.gov.co), dataset
 * oficial `gdxc-w37w` — DIVIPOLA del DANE. No se generan ni se escriben a
 * mano: inventar codigos en un modulo de cumplimiento seria peor que no
 * verificarlos, porque convertiria "no comprobado" en "comprobado mal".
 *
 * ESTO ES UN DATO QUE ENVEJECE. El DANE crea y reclasifica municipios. Antes
 * de reactivar la identidad conforme en produccion, correr este script de nuevo
 * y revisar el diff del archivo generado.
 *
 * Lo que genera
 * --------------
 *   lib/health/identity/divipola.ts   MUNICIPALITY_NAMES: { [codigo]: nombre }
 *
 * El nombre es SOLO para mostrar y para leer en voz alta (el agente confirma
 * el municipio). La validacion de existencia se hace contra las claves.
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const FUENTE = 'https://www.datos.gov.co/resource/gdxc-w37w.json?$limit=5000';
const SALIDA = path.join('lib', 'health', 'identity', 'divipola.ts');

/**
 * Anclas de control — SOLO codigos verificados empiricamente contra la fuente.
 * No se escriben codigos de memoria: si uno falla, la fuente cambio o no es la
 * que creemos, y el script no escribe nada.
 */
const ANCLAS = [
  '11001', '05001', '76001', '08001', '23001', '41001', '50001', '52001',
  '63001', '66001', '68001', '73001', '85001', '88001', '91001', '25019',
];

/**
 * Mayuscula inicial respetando conectores del espanol. Un title-case ingenuo
 * produce "Villa De San Diego De Ubaté", que esta mal en castellano.
 * Solo se bajan los conectores inequivocos y nunca la primera palabra.
 */
const CONECTORES = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y']);
/** Siglas y abreviaturas que no se deben tocar: "Bogotá, D.C." */
const CONSERVAR = /(^|\s|,)(D\.C\.|D\.E\.|D\.T\.Y\.C\.|D\.T\.)/g;

function nombreLegible(oficial) {
  let out = oficial
    .split(/\s+/)
    .filter(Boolean)
    .map((palabra, i) => {
      // Las siglas se dejan tal cual, en mayusculas.
      if (/^[A-Z]{1,3}(\.[A-Z]{1,3})+[.,]?$/.test(palabra)) return palabra;
      if (i > 0 && CONECTORES.has(palabra.toLowerCase())) return palabra.toLowerCase();
      // Guiones internos ("Piendamó - Tunía") capitalizan el segundo tramo.
      if (/^-$/.test(palabra)) return palabra;
      return palabra.charAt(0) + palabra.slice(1).toLowerCase();
    })
    .join(' ');
  out = out.replace(/- ([a-záéíóúñ])/g, (_m, c) => '- ' + c.toUpperCase());
  out = out.replace(CONSERVAR, (m, pre, sigla) => pre + sigla.toUpperCase());
  return out;
}

const res = await fetch(FUENTE);
if (!res.ok) {
  console.error(`No se pudo descargar el DIVIPOLA: HTTP ${res.status}`);
  process.exit(1);
}
const datos = await res.json();

if (!Array.isArray(datos) || datos.length === 0) {
  console.error('La fuente devolvio una lista vacia. No se escribe nada.');
  process.exit(1);
}

const malos = datos.filter((r) => !/^\d{5}$/.test(String(r.cod_mpio ?? '')));
if (malos.length > 0) {
  console.error(`${malos.length} codigos con forma invalida. No se escribe nada.`);
  process.exit(1);
}
const departamentos = new Set(datos.map((r) => String(r.cod_mpio).slice(0, 2)));
if (departamentos.size !== 33) {
  console.error(`Se esperaban 33 departamentos y llegaron ${departamentos.size}.`);
  process.exit(1);
}
const faltan = ANCLAS.filter((c) => !datos.some((r) => r.cod_mpio === c));
if (faltan.length > 0) {
  console.error(`Faltan anclas conocidas: ${faltan.join(', ')}. No se escribe nada.`);
  process.exit(1);
}

// Comprobacion estructural, sin codigos escritos a mano: cada departamento
// debe tener su capital en XX001. Si el DANE reclasifica y un departamento se
// queda sin capital, el script se detiene y hay que revisarlo a proposito.
const sinCapital = [...departamentos].filter(
  (d) => !datos.some((r) => r.cod_mpio === `${d}001`)
);
if (sinCapital.length > 0) {
  console.error(`Departamentos sin capital XX001: ${sinCapital.join(', ')}.`);
  console.error('Puede ser un cambio real del DANE. Revisa antes de continuar.');
  process.exit(1);
}

const entradas = datos
  .map((r) => [String(r.cod_mpio), nombreLegible(String(r.nom_mpio))])
  .sort((a, b) => a[0].localeCompare(b[0]));

const cuerpos = entradas.map(([cod, nom]) => `  '${cod}': '${nom.replace(/'/g, "\\'")}',`).join('\n');

const salida = `/**
 * DIVIPOLA — catalogo oficial de municipios de Colombia.
 *
 * ⚠️ ARCHIVO GENERADO. No editar a mano.
 * Generado por \`node scripts/cargar-divipola.mjs\` desde el portal de Datos
 * Abiertos del Gobierno Nacional (datos.gov.co, dataset \`gdxc-w37w\`), que
 * publica el DANE. ${entradas.length} municipios, ${departamentos.size} departamentos.
 *
 * El nombre es solo de lectura (lo muestra el panel y lo lee el agente al
 * confirmar). La comprobacion de existencia se hace contra las CLAVES de este
 * objeto: por eso los codigos son la parte que importa para el cumplimiento.
 *
 * El DANE crea y reclasifica municipios. Antes de activar la identidad
 * conforme en produccion, regenerar y revisar el diff.
 */
export const MUNICIPALITY_NAMES: Readonly<Record<string, string>> = {
${cuerpos}
};

/** Total de municipios en el catalogo. */
export const MUNICIPALITY_COUNT = ${entradas.length};

/** ¿El codigo de municipio existe en el catalogo DIVIPOLA? */
export function isKnownMunicipality(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(MUNICIPALITY_NAMES, code);
}
`;

writeFileSync(SALIDA, salida, 'utf8');
console.log(`OK  ${entradas.length} municipios, ${departamentos.size} departamentos`);
console.log(`    ${SALIDA}`);
