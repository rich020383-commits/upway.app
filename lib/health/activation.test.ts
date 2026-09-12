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
  planId: 'ips-plus-8000',
  planAutoActivatable: true,
  implementationIntakeReady: true,
};

describe('buildActivationChecks — modelo white-glove IPS', () => {
  it('permite go-live cuando Upway completo implementacion + plan', () => {
    const { checks, canActivate } = buildActivationChecks(base);
    expect(canActivate).toBe(true);
    expect(checks).toHaveLength(6);
    expect(checks.every((c) => c.ok)).toBe(true);
  });

  it('bloquea sin numero dedicado Telnyx (voz no entregada)', () => {
    const { canActivate, checks } = buildActivationChecks({ ...base, hasPhone: false, voiceActive: false });
    expect(canActivate).toBe(false);
    expect(checks.find((c) => c.key === 'voice')?.ok).toBe(false);
  });

  it('bloquea sin WhatsApp Meta conectado', () => {
    const { canActivate, checks } = buildActivationChecks({ ...base, whatsappActive: false });
    expect(canActivate).toBe(false);
    expect(checks.find((c) => c.key === 'whatsapp')?.ok).toBe(false);
  });

  it('bloquea sin aprobacion clinica aunque todo lo tecnico este verde', () => {
    const { canActivate, checks } = buildActivationChecks({
      ...base,
      clinicallyApproved: false,
      onboardingStatus: 'IN_PROGRESS',
    });
    expect(canActivate).toBe(false);
    expect(checks.find((c) => c.key === 'approval')?.ok).toBe(false);
  });

  it('bloquea sin datos clinicos (triaje + politicas del onboarding)', () => {
    const { canActivate } = buildActivationChecks({ ...base, triageCount: 0, policiesCount: 0 });
    expect(canActivate).toBe(false);
  });

  it('bloquea sin plan elegido', () => {
    const { canActivate, checks } = buildActivationChecks({ ...base, planId: null });
    expect(canActivate).toBe(false);
    expect(checks.find((c) => c.key === 'plan')?.ok).toBe(false);
  });

  it('bloquea plan EPS custom no auto-activable', () => {
    const { canActivate, checks } = buildActivationChecks({
      ...base,
      planId: 'eps-custom',
      planAutoActivatable: false,
    });
    expect(canActivate).toBe(false);
    expect(checks.find((c) => c.key === 'plan')?.detail).toMatch(/deal desk/i);
  });

  it('bloquea sin intake de implementacion', () => {
    const { canActivate, checks } = buildActivationChecks({
      ...base,
      implementationIntakeReady: false,
    });
    expect(canActivate).toBe(false);
    expect(checks.find((c) => c.key === 'plan')?.ok).toBe(false);
  });
});
