export const healthRoles = {
  orgOwner: 'org-owner',
  clinicAdmin: 'clinic-admin',
  triageManager: 'triage-manager',
  complianceReviewer: 'compliance-reviewer',
  supportAgent: 'support-agent',
  analyst: 'analyst',
  onboardingManager: 'onboarding-manager',
} as const;

export const healthPermissions = {
  overview: ['org-owner', 'clinic-admin', 'triage-manager', 'analyst'],
  clinics: ['org-owner', 'clinic-admin'],
  inbox: ['org-owner', 'clinic-admin', 'support-agent', 'triage-manager'],
  agents: ['org-owner', 'clinic-admin', 'triage-manager'],
  triage: ['org-owner', 'clinic-admin', 'triage-manager'],
  policies: ['org-owner', 'clinic-admin', 'compliance-reviewer', 'triage-manager'],
  faq: ['org-owner', 'clinic-admin', 'triage-manager', 'support-agent'],
  analytics: ['org-owner', 'clinic-admin', 'analyst'],
  compliance: ['org-owner', 'clinic-admin', 'compliance-reviewer'],
  approvals: ['org-owner', 'clinic-admin', 'compliance-reviewer', 'triage-manager'],
  audit: ['org-owner', 'clinic-admin', 'compliance-reviewer'],
  production: ['org-owner', 'clinic-admin', 'compliance-reviewer'],
  settings: ['org-owner', 'clinic-admin'],
  onboarding: ['org-owner', 'clinic-admin', 'onboarding-manager'],
} as const;

export type HealthRole = (typeof healthRoles)[keyof typeof healthRoles];

export function canAccessHealthModule(role: string, module: keyof typeof healthPermissions) {
  const allowedRoles = healthPermissions[module] as readonly string[];
  return allowedRoles.includes(role);
}
