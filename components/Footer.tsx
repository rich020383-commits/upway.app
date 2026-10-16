import Link from 'next/link';
import Image from 'next/image';
import { Linkedin, Mail, MessageCircle, LayoutDashboard, Briefcase, Shield } from 'lucide-react';
import {
  LEGAL_ENTITY,
  CONTACT_EMAIL_SALES,
  CONTACT_EMAIL_SUPPORT,
  CONTACT_EMAIL_LEGAL,
  CONTACT_EMAIL_PRIVACY,
} from '@/lib/legal';

export default function Footer() {
  return (
    <footer className="upway-dark-end bg-gradient-to-br from-[#0f172a] via-[#132642] to-[#0d1727] text-slate-400 overflow-hidden">
      <div className="relative">
        <svg className="w-full h-12 text-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="currentColor" />
        </svg>
      </div>
      <div className="mx-auto max-w-7xl pt-14 pb-[calc(env(safe-area-inset-bottom)+4rem)]">
        {/* Logo grande centrado arriba */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center px-6 py-3 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1b3a5f] shadow-lg border border-white/10 overflow-hidden">
            <Image src="/upway.png" alt="Upway" width={1000} height={667} quality={90} sizes="280px" className="h-auto w-full object-contain" />
          </div>
        </div>
        {/* 4 columnas debajo del logo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-10">
          <div className="space-y-4">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center"><MessageCircle className="w-4 h-4" /></span>
              Contacto
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href={`mailto:${CONTACT_EMAIL_SALES}`} className="inline-flex items-center gap-2 hover:text-blue-400 transition-colors">
                  <Mail className="w-4 h-4 text-blue-400" aria-hidden />
                  {CONTACT_EMAIL_SALES}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT_EMAIL_SUPPORT}`} className="inline-flex items-center gap-2 hover:text-blue-400 transition-colors">
                  <Mail className="w-4 h-4 text-emerald-400" aria-hidden />
                  {CONTACT_EMAIL_SUPPORT}
                </a>
              </li>
            </ul>
            <div className="flex gap-3 pt-2">
              <a href="https://www.linkedin.com/in/sophia-de-belfort-990164431" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn de Upway" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#1b5ed6] flex items-center justify-center transition-all hover:-translate-y-0.5">
                <Linkedin className="w-4 h-4" aria-hidden />
              </a>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center"><LayoutDashboard className="w-4 h-4" /></span>
              Plataforma
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/login" className="hover:text-blue-400 transition-colors">Iniciar SesiÃ³n</Link></li>
              <li><Link href="/register" className="hover:text-blue-400 transition-colors">Crear Cuenta</Link></li>
              <li><Link href="/precios" className="hover:text-blue-400 transition-colors">Planes y Precios</Link></li>
              <li><Link href="/demo" className="hover:text-blue-400 transition-colors">Demo en vivo con Sophie</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center"><Briefcase className="w-4 h-4" /></span>
              Industrias
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/salud" className="hover:text-blue-400 transition-colors">ClÃ­nicas y Salud</Link></li>
              <li><Link href="/center" className="hover:text-blue-400 transition-colors">Call Center</Link></li>
              <li><Link href="/inmobiliarias" className="hover:text-blue-400 transition-colors">Inmobiliarias</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center"><Shield className="w-4 h-4" /></span>
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/privacy" className="hover:text-blue-400 transition-colors">Privacidad</Link></li>
              <li><Link href="/terminos" className="hover:text-blue-400 transition-colors">TÃ©rminos de servicio</Link></li>
              <li><a href={`mailto:${CONTACT_EMAIL_LEGAL}`} className="inline-flex items-center gap-2 hover:text-blue-400 transition-colors">
                <Mail className="w-4 h-4 text-amber-400" aria-hidden />
                {CONTACT_EMAIL_LEGAL}
              </a></li>
              <li><a href={`mailto:${CONTACT_EMAIL_PRIVACY}`} className="inline-flex items-center gap-2 hover:text-blue-400 transition-colors">
                <Mail className="w-4 h-4 text-amber-400" aria-hidden />
                {CONTACT_EMAIL_PRIVACY}
              </a></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm pb-8">
          <p>Â© {new Date().getFullYear()} {LEGAL_ENTITY} Todos los derechos reservados.</p>
          <p className="text-slate-500">Hecho en BogotÃ¡, Colombia</p>
        </div>
      </div>
    </footer>
  );
}

