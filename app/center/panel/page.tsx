import type { Metadata } from 'next';
import OperationsPanel from '@/components/onboarding/operations-panel';
import { CENTER_ONBOARDING } from '@/lib/onboarding/center';

export const metadata: Metadata = {
  title: 'Mi operación · Upway Center',
  description: 'Solicitudes atendidas, escalamientos y consumo de tu operación.',
};

export default function CenterPanelPage() {
  return <OperationsPanel config={CENTER_ONBOARDING} />;
}
