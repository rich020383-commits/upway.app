export type TenantScope = {
  organizationId?: string;
  clinicId?: string;
  role?: string;
};

export type HealthModule =
  | 'overview'
  | 'clinics'
  | 'inbox'
  | 'agents'
  | 'triage'
  | 'policies'
  | 'faq'
  | 'analytics'
  | 'compliance'
  | 'approvals'
  | 'audit'
  | 'production'
  | 'settings'
  | 'onboarding';

export type HealthTriageRule = {
  id: string;
  clinicId: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: string;
  action: string;
  isActive: boolean;
};

export type HealthPolicy = {
  id: string;
  clinicId: string;
  title: string;
  body: string;
  version: string;
  isRequired: boolean;
};

export type HealthFaqEntry = {
  id: string;
  clinicId: string;
  question: string;
  answer: string;
  category: string;
  isPublished: boolean;
};

export type HealthComplianceRecord = {
  id: string;
  clinicId: string;
  title: string;
  summary: string;
  approvedBy?: string;
  version: string;
};
