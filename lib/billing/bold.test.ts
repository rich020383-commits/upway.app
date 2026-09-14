import { afterEach, describe, expect, it } from 'vitest';
import {
  computeBoldLinkExpiry,
  formatBoldExpirationDate,
  resolveBoldLinkTtlDays,
} from './bold';

const DIAS_MS = 24 * 60 * 60 * 1000;

const setTtl = (value: string | undefined) => {
  if (value === undefined) delete process.env.BOLD_LINK_TTL_DAYS;
  else process.env.BOLD_LINK_TTL_DAYS = value;
};

describe('resolveBoldLinkTtlDays', () => {
  const original = process.env.BOLD_LINK_TTL_DAYS;

  afterEach(() => setTtl(original));

  it('usa 7 dias por defecto (ciclo de compra B2B en salud)', () => {
    setTtl(undefined);
    expect(resolveBoldLinkTtlDays()).toBe(7);
  });

  it('respeta el valor configurado en el entorno', () => {
    setTtl('5');
    expect(resolveBoldLinkTtlDays()).toBe(5);
    setTtl('3');
    expect(resolveBoldLinkTtlDays()).toBe(3);
  });

  it('cae al default ante valores invalidos o no positivos', () => {
    for (const invalid of ['abc', '0', '-4', '']) {
      setTtl(invalid);
      expect(resolveBoldLinkTtlDays()).toBe(7);
    }
  });

  it('acota el maximo para no dejar links eternos', () => {
    setTtl('365');
    expect(resolveBoldLinkTtlDays()).toBe(90);
  });
});

describe('computeBoldLinkExpiry', () => {
  const original = process.env.BOLD_LINK_TTL_DAYS;

  afterEach(() => setTtl(original));

  it('suma los dias de vigencia a la fecha base', () => {
    setTtl(undefined);
    const from = new Date('2026-09-14T10:00:00Z');
    const expiry = computeBoldLinkExpiry(from);
    expect(Math.round((expiry.getTime() - from.getTime()) / DIAS_MS)).toBe(7);
  });

  it('no muta la fecha recibida', () => {
    setTtl('5');
    const from = new Date('2026-09-14T10:00:00Z');
    const snapshot = from.getTime();
    computeBoldLinkExpiry(from);
    expect(from.getTime()).toBe(snapshot);
  });
});

describe('formatBoldExpirationDate', () => {
  it('formatea como YYYY-MM-DD', () => {
    expect(formatBoldExpirationDate(new Date(2026, 8, 21))).toBe('2026-09-21');
  });

  it('rellena con cero el mes y el dia', () => {
    expect(formatBoldExpirationDate(new Date(2027, 0, 5))).toBe('2027-01-05');
  });
});