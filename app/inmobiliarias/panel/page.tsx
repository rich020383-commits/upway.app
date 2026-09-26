import type { Metadata } from 'next';
import OperationsPanel from '@/components/onboarding/operations-panel';
import { INMOBILIARIA_ONBOARDING } from '@/lib/onboarding/inmobiliaria';

export const metadata: Metadata = {
  title: 'Mi operación · Upway Inmobiliaria',
  description: 'Interesados calificados, visitas agendadas y consumo de tu operación.',
};

export default function InmobiliariaPanelPage() {
  return <OperationsPanel config={INMOBILIARIA_ONBOARDING} />;
}
