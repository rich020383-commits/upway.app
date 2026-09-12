import { describe, it, expect } from 'vitest';
import { buildActivationChecks, type ActivationInput } from './activation';

const base: ActivationInput = {
  hasOrganization: true,
  hasClinic: true,
  hasTienda: true,
  onboardingStatus: 'APPROVED',
  whatsappActive: true,
  voiceActive: true,
  hasAssistant: true,
  hasPhone: true,
  triageCount: 3,
  policiesCount: 2,
  faqsCount: 5,
  clinicallyApproved: true,
};

describe('buildActivationChecks — modelo white-glove IPS', () => {
  it('permite go-live cuando Upway completó implementación', () => {
    const { checks, canActivate } = buildActivationChecks(base);
    expect(canActivate).toBe(true);
    expect(checks).toHaveLength(5);
    expect(checks.every((c) => c.ok)).toBe(true);
  });

  it('bloquea sin número dedicado Telnyx (voz no entregada)', () => {
    const { canActivate, checks } = buildActivationChecks({ ...base, hasPhone: false, voiceActive: false });
    expect(canActivate).toBe(false);
    expect(checks.find((c) => c.key === 'voice')?.ok).toBe(false);
  });

  it('bloquea sin WhatsApp Meta conectado', () => {
    const { canActivate, checks } = buildActivationChecks({ ...base, whatsappActive: false });
    expect(canActivate).toBe(false);
    expect(checks.find((c) => c.key === 'whatsapp')?.ok).toBe(false);
  });

  it('bloquea sin aprobación clínica aunque todo lo técnico esté verde', () => {
    const { canActivate, checks } = buildActivationChecks({
      ...base,
      clinicallyApproved: false,
      onboardingStatus: 'IN_PROGRESS',
    });
    expect(canActivate).toBe(false);
    expect(checks.find((c) => c.key === 'approval')?.ok).toBe(false);
  });

  it('bloquea sin datos clínicos (triaje + políticas del onboarding)', () => {
    const { canActivate } = buildActivationChecks({ ...base, triageCount: 0, policiesCount: 0 });
    expect(canActivate).toBe(false);
  });
});
