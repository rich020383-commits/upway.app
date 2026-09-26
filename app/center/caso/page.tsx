import type { Metadata } from 'next';
import CaseStatus from '@/components/onboarding/case-status';
import { CENTER_ONBOARDING } from '@/lib/onboarding/center';

export const metadata: Metadata = {
  title: 'Tu caso · Upway Center',
  description: 'Estado de tu solicitud de Upway Center: referencia, estado y próximos pasos.',
};

export default function CenterCasePage() {
  return <CaseStatus config={CENTER_ONBOARDING} />;
}
