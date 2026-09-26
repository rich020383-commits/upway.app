import type { Metadata } from 'next';
import CaseStatus from '@/components/onboarding/case-status';
import { INMOBILIARIA_ONBOARDING } from '@/lib/onboarding/inmobiliaria';

export const metadata: Metadata = {
  title: 'Tu caso · Upway Inmobiliaria',
  description: 'Estado de tu solicitud de Upway Inmobiliaria: referencia, estado y próximos pasos.',
};

export default function InmobiliariaCasePage() {
  return <CaseStatus config={INMOBILIARIA_ONBOARDING} />;
}
