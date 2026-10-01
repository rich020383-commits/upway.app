import { describe, expect, it } from 'vitest';

import { ALL_HEALTH_PLANS } from '@/lib/health/plans-enterprise';
import { CENTER_PLANS } from '@/lib/center/plans';
import { INMOBILIARIA_PLANS } from '@/lib/inmobiliaria/plans';

/**
 * Superficie publica de los planes: `tagline`, `features` y `bestFor`.
 *
 * POR QUE EXISTE
 * --------------
 * Los planes custom (`eps-custom` en Health, `empresa-custom` en Centro)
 * guardaban su estrategia de precio DENTRO de `features`: la formula
 * `costo / (1 - 0.30)`, los costos de referencia y notas de operacion como
 * "No auto-activar: deal desk". El `tagline` de IPS Enterprise decia
 * "$580 COP/min implicito, con margen a uso completo".
 *
 * Todo eso se publica:
 *   - `app/precios/page.tsx`      renderiza `tagline` y mapea `features` entero
 *   - `components/health/plan-picker.tsx` renderiza `tagline`
 *   - `components/onboarding/vertical-wizard.tsx` renderiza `tagline` y
 *     `features.slice(0, 4)` — que en eps-custom capturaba justo las internas
 *   - `lib/sophie/knowledge.ts` arma su linea con `tagline` + `features` +
 *     `bestFor`, asi que el bot se lo contaba al cliente
 *
 * Es decir: nuestro piso de precio estaba afuera.
 *
 * El campo correcto es `internalNotes`, que no se renderiza en ningun lado.
 * Este test hace que volver a mezclarlos rompa CI en lugar de publicarse.
 */

type SuperficiePublica = {
  id: string;
  name: string;
  tagline: string;
  features: string[];
  bestFor: string;
  /** Puede existir; si existe, es lo unico lugar donde vive lo interno. */
  internalNotes?: string[];
};

const CUATRO_VERTICALES: { fuente: string; planes: readonly SuperficiePublica[] }[] = [
  { fuente: 'Health', planes: ALL_HEALTH_PLANS },
  { fuente: 'Centro', planes: CENTER_PLANS },
  { fuente: 'Inmobiliaria', planes: [...INMOBILIARIA_PLANS] },
];

/**
 * Frases que solo pueden vivir en `internalNotes`.
 *
 * No es una lista de palabras prohibidas arbitraria: cada patron corresponde a
 * algo que efectivamente estuvo publico y no deberia volver.
 */
const PROHIBIDO: { que: string; regex: RegExp }[] = [
  { que: 'la formula de margen', regex: /\(\s*1\s*-\s*0\.\d+\s*\)/ },
  { que: 'el costo de referencia', regex: /costo\s*~/i },
  { que: 'el piso de precio', regex: /\bpiso\b/i },
  { que: 'el margen', regex: /\bmargen\b/i },
  { que: 'el precio implicito', regex: /\bimplicit[oa]\b/i },
  { que: 'deal desk', regex: /deal\s*desk/i },
  { que: 'una instruccion interna de venta', regex: /\bno\s+(vender|auto-activar)\b/i },
  { que: 'la aprobacion interna', regex: /\bapproval\b/i },
  { que: 'la clave interna de capacidad', regex: /antes de firmar/i },
];

describe('superficie publica de los planes', () => {
  for (const { fuente, planes } of CUATRO_VERTICALES) {
    it(`${fuente}: ningun tagline, feature ni bestFor trae notas internas`, () => {
      for (const plan of planes) {
        // Sophie concatena estos tres campos en una sola linea para el cliente,
        // y las paginas de precios los renderizan tal cual: se escanean juntos.
        const superficie = [
          ['name', plan.name],
          ['tagline', plan.tagline],
          ['bestFor', plan.bestFor],
          ...plan.features.map((f, i) => [`features[${i}]`, f] as const),
        ] as const;

        for (const [campo, texto] of superficie) {
          for (const { que, regex } of PROHIBIDO) {
            expect(
              regex.test(texto),
              `${fuente}/${plan.id}.${campo} publica ${que}: "${texto}"`,
            ).toBe(false);
          }
        }
      }
    });
  }

  it('las notas internas de los planes custom se conservan en internalNotes', () => {
    const eps = ALL_HEALTH_PLANS.find((p) => p.id === 'eps-custom');
    const empresa = CENTER_PLANS.find((p) => p.id === 'empresa-custom');

    // No basta con limpiar la superficie: la estrategia de precio seguira
    // haciendo falta para cotizar, y debe seguir viva en algun lado.
    expect(eps?.internalNotes?.length ?? 0).toBeGreaterThanOrEqual(5);
    expect(empresa?.internalNotes?.length ?? 0).toBeGreaterThanOrEqual(4);
    expect(eps?.internalNotes).toContain(
      'Piso de cotizacion: costo / (1 - 0.30) — nunca por debajo de $550 COP/min',
    );
  });

  it('los planes custom siguen existiendo (limpiar la copia no los borro)', () => {
    expect(ALL_HEALTH_PLANS.find((p) => p.id === 'eps-custom')).toBeTruthy();
    expect(CENTER_PLANS.find((p) => p.id === 'empresa-custom')).toBeTruthy();
    // Sigue siendo cotizable: monthlyCOP 0 = deal desk, y no auto-activable.
    expect(ALL_HEALTH_PLANS.find((p) => p.id === 'eps-custom')?.autoActivatable).toBe(false);
    expect(CENTER_PLANS.find((p) => p.id === 'empresa-custom')?.autoActivatable).toBe(false);
  });

  /**
   * Prueba de que la prueba sirve.
   *
   * Un test que pasa en codigo limpio no demuestra nada: tambien pasa si los
   * patrones no detectan nada. Este fixture guarda la copia literal de lo que
   * estuvo en `features` y `tagline` hasta oct-2026, y exige que CADA linea
   * sea detectada. Si alguien "suaviza" un patron y la fuga vuelve, aqui cae.
   */
  it('cada texto que estuvo publicado habria hecho fallar este test', () => {
    const VIEJO = [
      'Piso de cotizacion: costo / (1 - 0.30) — nunca por debajo de $550 COP/min',
      '60.000 min: costo ~$23.2M con numeros -> piso ~$33.0M (~30% de margen)',
      '200.000 min: costo ~$76.2M con numeros -> piso ~$110M (~30% de margen)',
      '300 simultaneas requieren ampliar capacidad del proveedor antes de firmar',
      'No auto-activar: deal desk + cotizacion',
      'Alto volumen: $580 COP/min implicito, con margen a uso completo.',
      'Redes/EPS: no vender fijo sin approval.',
      'Simultaneidad >40 exige ampliar capacidad del proveedor antes de firmar',
      '60k-200k min: cotizacion por volumen (deal desk).',
    ];

    for (const texto of VIEJO) {
      const golpes = PROHIBIDO.filter(({ regex }) => regex.test(texto));
      expect(golpes.length, `"${texto}" pasaria el filtro`).toBeGreaterThan(0);
    }
  });

  it('el texto ya limpio no dispara ningun patron (falsos positivos)', () => {
    const LIMPIO = [
      'Cotizacion a medida segun volumen (desde 60.000 min/mes)',
      'Para IPS con desborde permanente: 25.000 min/mes y multiples lineas.',
      'Voz IA 24/7: atiende, confirma los datos y agenda',
      'Hasta 20 simultaneas (capacidad ampliada)',
      'Minuto adicional $690 COP (sin cortes)',
      'Registro auditable: grabacion 90 dias + log de evidencia',
      'Redes, EPS y operaciones con volumen que supera la escalera estandar.',
    ];

    for (const texto of LIMPIO) {
      const golpes = PROHIBIDO.filter(({ regex }) => regex.test(texto));
      expect(golpes.length, `"${texto}" seria bloqueado sin razon: ${golpes.map((g) => g.que).join(', ')}`).toBe(0);
    }
  });
});