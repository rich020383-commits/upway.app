import Link from 'next/link';
import { MessageCircleMore, Package, Bot, Sparkles } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton'; 

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // 🚀 BYPASS MAESTRO: Cero NextAuth, cero base de datos.
  const session = { user: { name: "Revisor Meta" } };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.3em] text-slate-500">UPWAY</p>
              <p className="text-lg font-semibold text-slate-900">Business Control</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <Link href="/dashboard/bots" className="flex items-center gap-2 transition hover:text-blue-700"><Bot className="h-4 w-4" /> Bots</Link>
            <Link href="/dashboard/inventario" className="flex items-center gap-2 transition hover:text-blue-700"><Package className="h-4 w-4" /> Inventario</Link>
            <Link href="/dashboard/activacion" className="flex items-center gap-2 transition hover:text-blue-700"><MessageCircleMore className="h-4 w-4" /> WhatsApp</Link>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">Hola, {session.user.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}