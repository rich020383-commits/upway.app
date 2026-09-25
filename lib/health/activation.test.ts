import { describe, it, expect } from 'vitest';
import { buildActivationChecks, type ActivationInput } from './activation';

const base: ActivationInput = {
  hasOrganization: true,
  hasClinic: true,
  hasTienda: true,
  onboardingStatus: 'APPROVED',
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
    expect(checks).toHaveLength(7);
    expect(checks.every((c) => c.ok)).toBe(true);
  });

  it('bloquea sin numero dedicado Telnyx (voz no entregada)', () => {
    const { canActivate, checks } = buildActivationChecks({ ...base, hasPhone: false, voiceActive: false });
    expect(canActivate).toBe(false);
    expect(checks.find((c) => c.key === 'voice')?.ok).toBe(false);
  });

  it('el check de canales es informativo: nunca bloquea el go-live', () => {
    const { canActivate, checks } = buildActivationChecks(base);
    expect(canActivate).toBe(true);
    const policy = checks.find((c) => c.key === 'channel-policy');
    expect(policy?.ok).toBe(true);
    expect(policy?.detail).toMatch(/canal oficial es la voz/i);
  });

  it('el detalle del check no expone canales de mensajeria', () => {
    const { checks } = buildActivationChecks(base);
    const policy = checks.find((c) => c.key === 'channel-policy');
    expect(policy?.detail).toMatch(/mensajeria de terceros no aplica/i);
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

describe('buildActivationChecks — modelo voz-first + identidad conforme', () => {
  it('no deja ningun gate abierto a causa de los canales de mensajeria', () => {
    const { checks, canActivate } = buildActivationChecks(base);
    expect(canActivate).toBe(true);
    const bloqueados = checks.filter((c) => !c.ok).map((c) => c.key);
    expect(bloqueados).toEqual([]);
    expect(checks.some((c) => c.key === 'channel-policy' && c.ok)).toBe(true);
  });

  it('bloquea el go-live si un servicio exige documento sin tipo del catalogo', () => {
    const { checks, canActivate } = buildActivationChecks({
      ...base,
      identityServicesRequiringDocs: 2,
      identityServicesWithCatalogType: 1,
    });
    expect(canActivate).toBe(false);
    const identity = checks.find((c) => c.key === 'identity');
    expect(identity?.ok).toBe(false);
    expect(identity?.detail).toMatch(/no conforme/i);
  });

  it('permite go-live cuando todos los servicios con documento usan el catalogo', () => {
    const { checks, canActivate } = buildActivationChecks({
      ...base,
      identityServicesRequiringDocs: 3,
      identityServicesWithCatalogType: 3,
    });
    expect(canActivate).toBe(true);
    expect(checks.find((c) => c.key === 'identity')?.detail).toMatch(/3 de 3/);
  });

  it('sin servicios que exijan documento la identidad no bloquea', () => {
    const { checks, canActivate } = buildActivationChecks({
      ...base,
      identityServicesRequiringDocs: 0,
      identityServicesWithCatalogType: 0,
    });
    expect(canActivate).toBe(true);
    expect(checks.find((c) => c.key === 'identity')?.ok).toBe(true);
  });
});
