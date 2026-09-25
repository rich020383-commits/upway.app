import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    organization: { findUnique: vi.fn(), create: vi.fn() },
    clinic: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    user: { upsert: vi.fn() },
    tienda: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    healthProfile: { findUnique: vi.fn(), create: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { ensureClinicForId } from './clinic-context';

const mockedOrgFind = prisma.organization.findUnique as unknown as Mock;
const mockedClinicFindUnique = prisma.clinic.findUnique as unknown as Mock;
const mockedClinicFind = prisma.clinic.findFirst as unknown as Mock;
const mockedClinicCreate = prisma.clinic.create as unknown as Mock;
const mockedUserUpsert = prisma.user.upsert as unknown as Mock;
const mockedTiendaFind = prisma.tienda.findFirst as unknown as Mock;
const mockedTiendaCreate = prisma.tienda.create as unknown as Mock;
const mockedTiendaUpdate = prisma.tienda.update as unknown as Mock;

const DEMO_ORG = { id: 'org-demo', slug: 'demo-health-organization', ownerId: 'user-demo' };
const DEMO_CLINIC = { id: 'clinic-demo', name: 'Clínica demo Upway Health' };

beforeEach(() => {
  vi.clearAllMocks();
  mockedOrgFind.mockResolvedValue(DEMO_ORG);
  mockedUserUpsert.mockResolvedValue({ id: 'user-demo', email: 'demo-health@upway.local' });
  mockedTiendaCreate.mockResolvedValue({ id: 'tienda-new' });
  mockedTiendaUpdate.mockResolvedValue({ id: 'tienda-1' });
});

describe('ensureClinicForId — tenant demo con Tienda propia', () => {
  it('crea la Tienda del tenant demo cuando no existe', async () => {
    // Org + clínica ya existentes, pero CERO Tiendas (estado real en producción).
    mockedClinicFind.mockResolvedValueOnce(DEMO_CLINIC);
    mockedTiendaFind.mockResolvedValue(null);

    const clinic = await ensureClinicForId(null);

    expect(clinic.id).toBe(DEMO_CLINIC.id);
    expect(mockedTiendaCreate).toHaveBeenCalledTimes(1);
    expect(mockedTiendaCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-demo',
        organizationId: 'org-demo',
        clinicId: 'clinic-demo',
        segment: 'health',
        isAiActive: false,
      }),
    });
  });

  it('no duplica la Tienda cuando ya está enlazada a la clínica', async () => {
    mockedClinicFind.mockResolvedValueOnce(DEMO_CLINIC);
    mockedTiendaFind.mockResolvedValue({
      id: 'tienda-1',
      userId: 'user-demo',
      organizationId: 'org-demo',
      clinicId: 'clinic-demo',
    });

    await ensureClinicForId(null);

    expect(mockedTiendaCreate).not.toHaveBeenCalled();
    expect(mockedTiendaUpdate).not.toHaveBeenCalled();
  });

  it('enlaza una Tienda huérfana del dueño en vez de crear otra', async () => {
    mockedClinicFind.mockResolvedValueOnce(DEMO_CLINIC);
    mockedTiendaFind
      .mockResolvedValueOnce(null) // sin tienda vinculada a la org
      .mockResolvedValueOnce({ id: 'tienda-1', userId: 'user-demo' }); // huérfana

    await ensureClinicForId(null);

    expect(mockedTiendaCreate).not.toHaveBeenCalled();
    expect(mockedTiendaUpdate).toHaveBeenCalledWith({
      where: { id: 'tienda-1' },
      data: { organizationId: 'org-demo', clinicId: 'clinic-demo' },
    });
  });

  it('reutiliza la clínica existente aunque cambie de nombre (sin duplicados)', async () => {
    mockedClinicFind
      .mockResolvedValueOnce(null) // no coincide el nombre esperado
      .mockResolvedValueOnce({ id: 'clinic-otro-nombre', name: 'Otro nombre' });
    mockedTiendaFind.mockResolvedValue({
      id: 'tienda-1',
      userId: 'user-demo',
      organizationId: 'org-demo',
      clinicId: 'clinic-otro-nombre',
    });

    const clinic = await ensureClinicForId(null);

    expect(clinic.id).toBe('clinic-otro-nombre');
    expect(mockedClinicCreate).not.toHaveBeenCalled();
  });

  it('no toca las Tiendas cuando el organización es real (no la demo)', async () => {
    mockedOrgFind.mockResolvedValue({ id: 'org-real', slug: 'workspace-user-1', ownerId: 'user-1' });
    mockedClinicFind.mockResolvedValueOnce({ id: 'clinic-real', name: 'Clínica principal' });

    const clinic = await ensureClinicForId(null, 'org-real');

    expect(clinic.id).toBe('clinic-real');
    expect(mockedTiendaFind).not.toHaveBeenCalled();
    expect(mockedTiendaCreate).not.toHaveBeenCalled();
  });

  it('si el clinicId del token ya es válido, devuelve esa clínica sin tocar nada', async () => {
    mockedClinicFindUnique.mockResolvedValue({ id: 'clinic-token', name: 'Clínica real' });

    const clinic = await ensureClinicForId('clinic-token');

    expect(clinic.id).toBe('clinic-token');
    expect(mockedOrgFind).not.toHaveBeenCalled();
    expect(mockedTiendaCreate).not.toHaveBeenCalled();
  });
});
