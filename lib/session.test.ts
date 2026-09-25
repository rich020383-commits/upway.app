import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next-auth/jwt', () => ({ getToken: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: { tienda: { findFirst: vi.fn() } },
}));

import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { getOwnedTienda, getSessionUser } from './session';

const mockedGetToken = getToken as unknown as Mock;
const mockedTiendaFind = prisma.tienda.findFirst as unknown as Mock;

const CUID = 'cmu739q6k000012js5q17tlln';
const EMAIL = 'rich020383@gmail.com';
const req = () => new NextRequest('http://localhost/api/voice/voices');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getSessionUser — el id debe ser el de la fila en User', () => {
  it('devuelve el cuid del token, no el correo', async () => {
    mockedGetToken.mockResolvedValue({ id: CUID, email: EMAIL, name: 'Richard' });
    const user = await getSessionUser(req());
    // Este es el bug: con `id: userEmail` cualquier filtro por `userId`
    // (Tienda.userId, Organization.ownerId) devolvía cero filas → 404.
    expect(user?.id).toBe(CUID);
    expect(user?.id).not.toBe(EMAIL);
    expect(user?.email).toBe(EMAIL);
  });

  it('el ownership de tienda se resuelve con el id real', async () => {
    mockedGetToken.mockResolvedValue({ id: CUID, email: EMAIL });
    mockedTiendaFind.mockResolvedValue({ id: 'tienda-1', userId: CUID });

    const { tienda, error } = await getOwnedTienda(req(), prisma, 'tienda-1');

    expect(error).toBeUndefined();
    expect(tienda?.id).toBe('tienda-1');
    expect(mockedTiendaFind).toHaveBeenCalledWith({
      where: { id: 'tienda-1', userId: CUID },
      orderBy: { id: 'asc' },
    });
  });

  it('conserva el id del revisor externo (bloqueo H2)', async () => {
    mockedGetToken.mockResolvedValue({ id: 'meta-reviewer', email: 'revisor@upway.business' });
    const { error } = await getOwnedTienda(req(), prisma, 'tienda-1');
    expect(error?.status).toBe(403);
  });

  it('usa el correo solo como respaldo cuando el token no trae id', async () => {
    mockedGetToken.mockResolvedValue({ email: EMAIL });
    const user = await getSessionUser(req());
    expect(user?.id).toBe(EMAIL);
    expect(user?.email).toBe(EMAIL);
  });

  it('descarta un id en blanco en vez de devolver cadena vacía', async () => {
    mockedGetToken.mockResolvedValue({ id: '   ', email: EMAIL });
    const user = await getSessionUser(req());
    expect(user?.id).toBe(EMAIL);
  });

  it('devuelve null sin sesión y sin token vacío', async () => {
    mockedGetToken.mockResolvedValue(null);
    expect(await getSessionUser(req())).toBeNull();

    mockedGetToken.mockResolvedValue({});
    expect(await getSessionUser(req())).toBeNull();
  });

  it('no filtra por una tienda que pertenece a otro usuario', async () => {
    mockedGetToken.mockResolvedValue({ id: CUID, email: EMAIL });
    mockedTiendaFind.mockResolvedValue(null);
    const { tienda, error } = await getOwnedTienda(req(), prisma, 'tienda-ajena');
    expect(tienda).toBeUndefined();
    expect(error?.status).toBe(404);
  });
});
