import type { Metadata } from 'next';
import { VerticalWizard } from '@/components/onboarding/vertical-wizard';
import { CENTER_ONBOARDING } from '@/lib/onboarding/center';

export const metadata: Metadata = {
  title: 'Onboarding Upway Center',
  description: 'Configura tu operación de Upway Center (servicio técnico y atención al cliente) y envíala a revisión.',
};

export default function CenterOnboardingPage() {
  return <VerticalWizard config={CENTER_ONBOARDING} />;
}