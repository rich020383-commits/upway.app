import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { canonicalHostRedirect } from './proxy';

const original = process.env.NEXTAUTH_URL;

function pedir(host: string, ruta = '/inmobiliarias/onboarding?segment=inmobiliaria') {
  return new NextRequest(`https://${host}${ruta}`);
}

beforeEach(() => {
  process.env.NEXTAUTH_URL = 'https://www.upway.business';
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  if (original === undefined) delete process.env.NEXTAUTH_URL;
  else process.env.NEXTAUTH_URL = original;
  vi.restoreAllMocks();
});

describe('canonicalHostRedirect — bucle de login por cookie en el host equivocado', () => {
  it('redirige el host sin www al canónico, conservando ruta y query', () => {
    const res = canonicalHostRedirect(pedir('upway.business'));
    expect(res?.status).toBe(308);
    expect(res?.headers.get('location')).toBe(
      'https://www.upway.business/inmobiliarias/onboarding?segment=inmobiliaria'
    );
  });

  it('NO redirige cuando ya estás en el host canónico', () => {
    // Si redirigiera aquí, el bucle de login sería infinito también con www.
    expect(canonicalHostRedirect(pedir('www.upway.business'))).toBeNull();
  });

  it('usa 308 para que un POST no pierda el cuerpo al redirigir', () => {
    // 302/307 convierten el POST en GET en algunos clientes.
    expect(canonicalHostRedirect(pedir('upway.business', '/api/voice/voices'))?.status).toBe(308);
  });

  it('no rompe el desarrollo local', () => {
    expect(canonicalHostRedirect(pedir('localhost:3000', '/'))).toBeNull();
  });

  it('si NEXTAUTH_URL no está, no rompe nada', () => {
    delete process.env.NEXTAUTH_URL;
    expect(canonicalHostRedirect(pedir('upway.business'))).toBeNull();
  });

  it('si NEXTAUTH_URL es inválida, sirve el sitio en vez de caerse', () => {
    process.env.NEXTAUTH_URL = 'no-es-una-url';
    expect(canonicalHostRedirect(pedir('upway.business'))).toBeNull();
  });

  it('sigue al host que diga NEXTAUTH_URL, no a uno fijo', () => {
    // Si alguien cambia la variable en Render, la redirección la sigue sola.
    process.env.NEXTAUTH_URL = 'https://upway.business';
    const res = canonicalHostRedirect(pedir('www.upway.business'));
    expect(res?.headers.get('location')).toBe(
      'https://upway.business/inmobiliarias/onboarding?segment=inmobiliaria'
    );
  });
});
