import { describe, expect, it } from 'vitest';

import {
  LIMITE_FALLBACK,
  UMBRAL_ALERTA,
  evaluarCapacidad,
  mensajeDeBloqueo,
} from './concurrency';
import { parseSessionForm } from '@/lib/health/session-form';

describe('evaluarCapacidad — decision pura de bloqueo y alerta', () => {
  it('no bloquea ni avisa con holgura de sobra', () => {
    const e = evaluarCapacidad(0, 5);
    expect(e.bloqueado).toBe(false);
    expect(e.alerta).toBe(false);
    expect(e.holgura).toBe(5);
    expect(e.pct).toBe(0);
  });

  it('avisa ANTES de bloquear en todos los tamanos de plan', () => {
    // La regla que sostiene todo el modulo: el umbral de alerta nunca puede
    // ser el propio tope, o no habria aviso previo.
    for (const limite of [1, 2, 3, 5, 6, 16, 20, 40, 60, 100]) {
      const umbral = evaluarCapacidad(0, limite).umbralAlerta;
      expect(umbral, `limite ${limite}`).toBeGreaterThanOrEqual(1);
      expect(umbral, `limite ${limite}`).toBeLessThan(
        Math.max(2, limite),
      );
      // La primera llamada que cruza el umbral ya avisa y aun no bloquea.
      const enUmbral = evaluarCapacidad(umbral, limite);
      expect(enUmbral.alerta, `limite ${limite}`).toBe(true);
      expect(enUmbral.bloqueado, `limite ${limite}`).toBe(limite === 1);
    }
  });

  it('plan de 2: avisa con una activa y bloquea con dos', () => {
    expect(evaluarCapacidad(0, 2)).toMatchObject({ bloqueado: false, alerta: false });
    expect(evaluarCapacidad(1, 2)).toMatchObject({ bloqueado: false, alerta: true });
    expect(evaluarCapacidad(2, 2)).toMatchObject({ bloqueado: true, alerta: true });
  });

  it('plan de 5: el 80% estricto (4) avisa y el 5 bloquea', () => {
    expect(evaluarCapacidad(3, 5)).toMatchObject({ alerta: false, bloqueado: false });
    expect(evaluarCapacidad(4, 5)).toMatchObject({ alerta: true, bloqueado: false });
    expect(evaluarCapacidad(5, 5)).toMatchObject({ alerta: true, bloqueado: true });
  });

  it('plan de 20: avisa en 16', () => {
    expect(evaluarCapacidad(15, 20).alerta).toBe(false);
    expect(evaluarCapacidad(16, 20).alerta).toBe(true);
    expect(evaluarCapacidad(19, 20).bloqueado).toBe(false);
    expect(evaluarCapacidad(20, 20).bloqueado).toBe(true);
  });

  it('el umbral es floor(limite * 0.8), nunca por encima del tope', () => {
    expect(evaluarCapacidad(0, 20).umbralAlerta).toBe(Math.floor(20 * UMBRAL_ALERTA));
    expect(evaluarCapacidad(0, 100).umbralAlerta).toBe(Math.floor(100 * UMBRAL_ALERTA));
    for (const limite of [1, 2, 5, 16, 20, 100]) {
      expect(evaluarCapacidad(0, limite).umbralAlerta).toBeLessThanOrEqual(limite);
    }
  });

  it('limites invalidos caen al techo de cuenta, no a cero', () => {
    // Un tope en 0 o en NaN bloquearia TODA llamada: es el fallo mas grave que
    // puede tener este modulo, porque dejan de atenderse pacientes.
    for (const limite of [0, -1, Number.NaN, null as unknown as number]) {
      const e = evaluarCapacidad(0, limite);
      expect(e.limite, `limite ${String(limite)}`).toBe(LIMITE_FALLBACK);
      expect(e.bloqueado, `limite ${String(limite)}`).toBe(false);
    }
  });

  it('activas invalidas no bloquean', () => {
    for (const activas of [-3, Number.NaN, null as unknown as number]) {
      expect(evaluarCapacidad(activas, 5).bloqueado).toBe(false);
    }
  });

  it('bloquea tambien pasado el tope (cuenta desfasada o perdida)', () => {
    expect(evaluarCapacidad(7, 5).bloqueado).toBe(true);
    expect(evaluarCapacidad(7, 5).holgura).toBe(0);
  });

  it('el mensaje de bloqueo dice cuantas van y cuanto es el tope', () => {
    const msg = mensajeDeBloqueo(evaluarCapacidad(5, 5));
    expect(msg).toContain('5/5');
    expect(msg).toContain('sube de plan');
  });
});

describe('parseSessionForm — JSON opaco de la sesion de onboarding', () => {
  it('devuelve el planId guardado', () => {
    expect(parseSessionForm('{"planId":"ips-plus-8000"}').planId).toBe('ips-plus-8000');
  });

  it('nunca lanza: notes ausente, no-JSON o no-objeto', () => {
    expect(parseSessionForm(null)).toEqual({});
    expect(parseSessionForm(undefined)).toEqual({});
    expect(parseSessionForm('')).toEqual({});
    expect(parseSessionForm('no es json')).toEqual({});
    expect(parseSessionForm('"string"')).toEqual({});
    expect(parseSessionForm('42')).toEqual({});
  });

  it('planId que no es string no sirve como plan', () => {
    const form = parseSessionForm('{"planId":123}');
    expect(typeof form.planId).not.toBe('string');
  });
});