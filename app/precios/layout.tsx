import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Planes y precios Upway - Salud, Inmobiliarias y Call Center | Upway',
  description:
    'Planes de voz IA para salud, inmobiliarias y call center. Minutos, numeros simultaneos y precios transparentes en COP con IVA incluido.',
};

export default function PreciosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
