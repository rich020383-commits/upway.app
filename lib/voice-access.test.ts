import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  NO_CASE_MESSAGE,
  PENDING_CASE_MESSAGE,
  resolveVoiceAccess,
  voiceCapabilityDenied,
} from '@/lib/voice-access';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tienda: { findFirst: vi.fn() },
    healthOnboardingSession: { findFirst: vi.fn() },
    verticalOnboardingSession: { findFirst: vi.fn() },
  },
}));

const mockedTienda = prisma.tienda.findFirst as unknown as Mock;
const mockedHealth = prisma.healthOnboardingSession.findFirst as unknown as Mock;
const mockedVertical = prisma.verticalOnboardingSession.findFirst as unknown as Mock;

/**
 * El resolvedor hace DOS findFirst por modelo: uno buscando estado APPROVED y
 * otro "hay algún caso". Se separan por la presencia de `where.status`, que es
 * lo que distingue una consulta de la otra.
 */
function mockCasos(opts: {
  health?: { approved: boolean; any: boolean };
  vertical?: { approved: boolean; any: boolean; segment?: string };
  clinicId?: string | null;
}) {
  mockedTienda.mockResolvedValue({ clinicId: opts.clinicId ?? 'clinic-1' });
  mockedHealth.mockImplementation(({ where }: { where?: { status?: unknown } }) =>
    Promise.resolve(
      where?.status ? (opts.health?.approved ? { id: 'h1' } : null) : opts.health?.any ? { id: 'h1' } : null
    )
  );
  mockedVertical.mockImplementation(({ where }: { where?: { status?: unknown } }) =>
    Promise.resolve(
      where?.status
        ? opts.vertical?.approved
          ? { segment: opts.vertical.segment ?? 'center' }
          : null
        : opts.vertical?.any
          ? { segment: opts.vertical.segment ?? 'center' }
          : null
    )
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resolveVoiceAccess', () => {
  it('abre todo cuando el caso de Health está APPROVED', async () => {
    mockCasos({ health: { approved: true, any: true } });
    const r = await resolveVoiceAccess('user-1');
    expect(r.state).toBe('approved');
    expect(r.access).toEqual({
      canBrowse: true,
      canPreview: true,
      canClone: true,
      canProvision: true,
      canCall: true,
    });
  });

  it('abre todo cuando la vertical está APPROVED, sin importar cuál sea', async () => {
    mockCasos({ vertical: { approved: true, any: true, segment: 'inmobiliaria' } });
    const r = await resolveVoiceAccess('user-1');
    expect(r.state).toBe('approved');
    expect(r.segment).toBe('inmobiliaria');
    expect(r.access.canClone).toBe(true);
  });

  it('deja ver y OÍR el catálogo, pero no clonar, aprovisionar ni llamar, en revisión', async () => {
    mockCasos({ vertical: { approved: false, any: true, segment: 'center' } });
    const r = await resolveVoiceAccess('user-1');
    expect(r.state).toBe('review');
    expect(r.access.canBrowse).toBe(true);
    expect(r.access.canPreview).toBe(true);
    expect(r.access.canClone).toBe(false);
    expect(r.access.canProvision).toBe(false);
    expect(r.access.canCall).toBe(false);
  });

  it('distingue "no empezaste" de "ya está en revisión"', async () => {
    mockCasos({});
    const r = await resolveVoiceAccess('user-1');
    expect(r.state).toBe('none');
    expect(r.access.canPreview).toBe(true);
    expect(r.access.canClone).toBe(false);
  });

  it('NUNCA abre el candado si la base de datos falla', async () => {
    mockedTienda.mockRejectedValue(new Error('db caída'));
    const r = await resolveVoiceAccess('user-1');
    expect(r.access.canClone).toBe(false);
    expect(r.access.canCall).toBe(false);
    expect(r.access.canPreview).toBe(true);
  });

  it('un cliente de Health sin tienda (ownerUserId) también resuelve', async () => {
    mockedTienda.mockResolvedValue({ clinicId: null });
    mockedHealth.mockImplementation(({ where }: { where?: { status?: unknown } }) =>
      Promise.resolve(where?.status ? { id: 'h1' } : null)
    );
    mockedVertical.mockResolvedValue(null);
    const r = await resolveVoiceAccess('user-1');
    expect(r.state).toBe('approved');
  });
});

describe('voiceCapabilityDenied', () => {
  it('devuelve null cuando la operación está permitida', async () => {
    mockCasos({ health: { approved: true, any: true } });
    expect(await voiceCapabilityDenied('user-1', 'clone')).toBeNull();
  });

  it('bloquea clonar en revisión con 403 y un mensaje accionable', async () => {
    mockCasos({ vertical: { approved: false, any: true } });
    const denied = await voiceCapabilityDenied('user-1', 'clone');
    expect(denied?.status).toBe(403);
    expect(denied?.error).toContain(PENDING_CASE_MESSAGE);
    expect(denied?.error).toContain('crear tu propia voz');
  });

  it('usa el mensaje de "sin caso" cuando el cliente ni empezó', async () => {
    mockCasos({});
    const denied = await voiceCapabilityDenied('user-1', 'call');
    expect(denied?.error).toContain(NO_CASE_MESSAGE);
  });
});
