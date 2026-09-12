export const healthRoles = {
  orgOwner: 'org-owner',
  clinicAdmin: 'clinic-admin',
  triageManager: 'triage-manager',
  complianceReviewer: 'compliance-reviewer',
  supportAgent: 'support-agent',
  analyst: 'analyst',
  onboardingManager: 'onboarding-manager',
} as const;

/**
 * Unificación Business → Health: el JWT de NextAuth guarda `role='owner'`
 * para dueños de tienda/organización. Health usa `org-owner`.
 * Este mapa evita 403 fantasma sin tocar el prompt del asistente ni el login.
 */
const ROLE_ALIASES: Record<string, string> = {
  owner: 'org-owner',
  admin: 'org-owner',
  'org_owner': 'org-owner',
  'clinic_admin': 'clinic-admin',
  'triage_manager': 'triage-manager',
  'compliance_reviewer': 'compliance-reviewer',
  'support_agent': 'support-agent',
  'onboarding_manager': 'onboarding-manager',
};

export function normalizeHealthRole(role: string | null | undefined): string {
  const raw = (role ?? '').trim();
  if (!raw) return '';
  const lower = raw.toLowerCase();
  return ROLE_ALIASES[lower] ?? ROLE_ALIASES[raw] ?? lower;
}

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
  const normalized = normalizeHealthRole(role);
  const allowedRoles = healthPermissions[module] as readonly string[];
  return allowedRoles.includes(normalized);
}
