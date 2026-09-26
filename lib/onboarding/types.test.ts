import { describe, it, expect } from 'vitest';
import { verticalBasePath } from './types';

describe('verticalBasePath', () => {
  /**
   * El id del segmento es singular ('inmobiliaria') y la carpeta es plural
   * ('/inmobiliarias'). Construir la URL con el id daba /inmobiliaria/caso → 404
   * en los cuatro enlaces del flujo. Estos tests existen para que ese 404 no
   * vuelva a colarse.
   */
  it('mapea inmobiliaria al plural de la carpeta, no al id', () => {
    expect(verticalBasePath('inmobiliaria')).toBe('/inmobiliarias');
    expect(verticalBasePath('inmobiliaria')).not.toBe('/inmobiliaria');
  });

  it('mapea center a su propia ruta', () => {
    expect(verticalBasePath('center')).toBe('/center');
  });

  it('construye rutas existentes para las dos verticales', () => {
    for (const segment of ['inmobiliaria', 'center'] as const) {
      const base = verticalBasePath(segment);
      expect(base.startsWith('/')).toBe(true);
      expect(`${base}/caso`).not.toContain('undefined');
      // El id del segmento nunca debe aparecer crudo en la URL de la carpeta.
      if (segment === 'inmobiliaria') {
        expect(`${base}/caso`).not.toBe('/inmobiliaria/caso');
      }
    }
  });

  it('cae a la raíz con un segmento desconocido en vez de romper la URL', () => {
    expect(verticalBasePath('desconocido' as never)).toBe('/');
  });
});
