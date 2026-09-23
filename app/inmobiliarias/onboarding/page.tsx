import type { Metadata } from 'next';
import { VerticalWizard } from '@/components/onboarding/vertical-wizard';
import { INMOBILIARIA_ONBOARDING } from '@/lib/onboarding/inmobiliaria';

export const metadata: Metadata = {
  title: 'Onboarding Inmobiliarias — Upway',
  description: 'Configura tu operación de Upway Inmobiliarias y envíala a revisión.',
};

export default function InmobiliariaOnboardingPage() {
  return <VerticalWizard config={INMOBILIARIA_ONBOARDING} />;
}