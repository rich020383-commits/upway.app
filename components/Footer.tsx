import Link from 'next/link';
import Image from 'next/image';
import { LEGAL_ENTITY } from '@/lib/legal';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-[#0f172a] via-[#132642] to-[#0d1727] text-slate-400 overflow-hidden">
      {/* Curved top divider */}
      <div className="relative">
        <svg className="w-full h-12 text-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="currentColor" />
        </svg>
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-16 pb-[calc(env(safe-area-inset-bottom)+6rem)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1b3a5f] shadow-lg border border-white/10 overflow-hidden">
              <Image src="/upway.png" alt="Upway Business" width={100} height={28} className="h-7 w-auto object-contain" />
            </div>
            <p className="text-sm leading-relaxed">Potenciando empresas mediante Inteligencia Artificial estratégica.</p>
            <div className="flex gap-3 pt-2">
              <a href="https://www.linkedin.com/in/sophia-de-belfort-990164431" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn de Upway Health" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#1b5ed6] flex items-center justify-center transition-all hover:-translate-y-0.5">
                <span className="text-xs font-bold">Li</span>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1b5ed6]" />
              Plataforma
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/login" className="hover:text-blue-400 transition-colors">Iniciar Sesión</Link></li>
              <li><Link href="/register" className="hover:text-blue-400 transition-colors">Crear Cuenta</Link></li>
              <li><Link href="/precios" className="hover:text-blue-400 transition-colors">Planes y Precios</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Industrias
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/precios" className="hover:text-blue-400 transition-colors">Clínicas y Salud</Link></li>
              <li><Link href="/inmobiliarias" className="hover:text-blue-400 transition-colors">Inmobiliarias</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Legal
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-blue-400 transition-colors">
                  Privacidad
                </Link>
              </li>
              <li><Link href="/terminos" className="hover:text-blue-400 transition-colors">Términos de servicio</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>© {new Date().getFullYear()} {LEGAL_ENTITY} Todos los derechos reservados.</p>
          <p className="text-slate-500">Hecho en Bogotá, Colombia 🇨🇴</p>
        </div>
      </div>
    </footer>
  );
}