import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

// Mock antes de importar el módulo bajo test: workspace.ts vincula prisma en
// tiempo de importación.
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    tienda: { findFirst: vi.fn(), updateMany: vi.fn() },
    organization: { findFirst: vi.fn(), create: vi.fn() },
    clinic: { create: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { ensureOwnedWorkspace } from './workspace';

const mockedUserFind = prisma.user.findUnique as unknown as Mock;
const mockedTiendaFind = prisma.tienda.findFirst as unknown as Mock;
const mockedTiendaUpdate = prisma.tienda.updateMany as unknown as Mock;
const mockedOrgFind = prisma.organization.findFirst as unknown as Mock;
const mockedOrgCreate = prisma.organization.create as unknown as Mock;
const mockedClinicCreate = prisma.clinic.create as unknown as Mock;

const USER = { id: 'user-1', name: 'Richard Rich', email: 'rich020383@gmail.com' };

const clinic = (id: string) => ({ id, name: 'Clínica principal' });

const orgWithClinic = (clinicId = 'clinic-1') => ({
  id: 'org-1',
  name: 'Richard Rich',
  clinics: [clinic(clinicId)],
});

beforeEach(() => {
  vi.clearAllMocks();
  // updateMany siempre resuelve: es el caso feliz por defecto de linkTienda.
  mockedTiendaUpdate.mockResolvedValue({ count: 1 });
});

describe('ensureOwnedWorkspace — repara cuentas sin tenant propio', () => {
  it('crea Organization + Clinic cuando el usuario no tiene ninguna', async () => {
    mockedUserFind.mockResolvedValue(USER);
    mockedTiendaFind.mockResolvedValue({ segment: 'health' });
    mockedOrgFind.mockResolvedValue(null);
    mockedOrgCreate.mockResolvedValue({ id: 'org-new' });
    mockedClinicCreate.mockResolvedValue(clinic('clinic-new'));

    const scope = await ensureOwnedWorkspace('user-1');

    expect(scope).toEqual({ organizationId: 'org-new', clinicId: 'clinic-new' });
    expect(mockedOrgCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ownerId: 'user-1',
        slug: 'workspace-user-1',
        vertical: 'HEALTH',
      }),
    });
    expect(mockedClinicCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ organizationId: 'org-new', vertical: 'HEALTH' }),
    });
  });

  it('usa BUSINESS por defecto cuando el segmento no es de salud', async () => {
    mockedUserFind.mockResolvedValue(USER);
    mockedTiendaFind.mockResolvedValue({ segment: 'general' });
    mockedOrgFind.mockResolvedValue(null);
    mockedOrgCreate.mockResolvedValue({ id: 'org-new' });
    mockedClinicCreate.mockResolvedValue(clinic('clinic-new'));

    await ensureOwnedWorkspace('user-1');

    expect(mockedOrgCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ vertical: 'BUSINESS' }),
    });
  });

  it('repara la Tienda huérfana (organizationId null) con el scope resuelto', async () => {
    mockedUserFind.mockResolvedValue(USER);
    mockedTiendaFind.mockResolvedValue({ segment: 'general' });
    mockedOrgFind.mockResolvedValue(orgWithClinic());
    mockedClinicCreate.mockResolvedValue(clinic('clinic-new'));

    const scope = await ensureOwnedWorkspace('user-1');

    expect(scope).toEqual({ organizationId: 'org-1', clinicId: 'clinic-1' });
    // Nunca debe crear org/clinic si ya existen.
    expect(mockedOrgCreate).not.toHaveBeenCalled();
    expect(mockedClinicCreate).not.toHaveBeenCalled();

    expect(mockedTiendaUpdate).toHaveBeenCalledWith({
      where: { userId: 'user-1', organizationId: null },
      data: { organizationId: 'org-1', clinicId: 'clinic-1' },
    });
    expect(mockedTiendaUpdate).toHaveBeenCalledWith({
      where: { userId: 'user-1', clinicId: null },
      data: { clinicId: 'clinic-1' },
    });
  });

  it('crea la Clinic si la organización existe pero no tiene ninguna', async () => {
    mockedUserFind.mockResolvedValue(USER);
    mockedTiendaFind.mockResolvedValue({ segment: 'health' });
    mockedOrgFind.mockResolvedValue({ id: 'org-1', name: 'X', clinics: [] });
    mockedClinicCreate.mockResolvedValue(clinic('clinic-new'));

    const scope = await ensureOwnedWorkspace('user-1');

    expect(scope).toEqual({ organizationId: 'org-1', clinicId: 'clinic-new' });
    expect(mockedOrgCreate).not.toHaveBeenCalled();
    expect(mockedClinicCreate).toHaveBeenCalledTimes(1);
  });

  it('recupera el workspace cuando dos requests cruzados chocan en el slug', async () => {
    mockedUserFind.mockResolvedValue(USER);
    mockedTiendaFind.mockResolvedValue({ segment: 'general' });
    mockedOrgFind
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(orgWithClinic());
    mockedOrgCreate.mockRejectedValue({ code: 'P2002' });
    mockedClinicCreate.mockResolvedValue(clinic('clinic-new'));

    const scope = await ensureOwnedWorkspace('user-1');

    expect(scope).toEqual({ organizationId: 'org-1', clinicId: 'clinic-1' });
  });

  it('propaga errores que no son de unicidad', async () => {
    mockedUserFind.mockResolvedValue(USER);
    mockedTiendaFind.mockResolvedValue({ segment: 'general' });
    mockedOrgFind.mockResolvedValue(null);
    mockedOrgCreate.mockRejectedValue(new Error('connection reset'));

    await expect(ensureOwnedWorkspace('user-1')).rejects.toThrow('connection reset');
  });

  it('devuelve null si el usuario no existe', async () => {
    mockedUserFind.mockResolvedValue(null);

    await expect(ensureOwnedWorkspace('user-missing')).resolves.toBeNull();
    expect(mockedOrgCreate).not.toHaveBeenCalled();
  });
});
