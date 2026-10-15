import Link from 'next/link';
import Image from 'next/image';
import { Linkedin, Mail } from 'lucide-react';
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
      {/* Curved top divider */}
      <div className="relative">
        <svg className="w-full h-12 text-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="currentColor" />
        </svg>
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-16 pb-[calc(env(safe-area-inset-bottom)+6rem)]">
        {/* Grid: 1 col en móvil, 2 en tablet y 4 en desktop con la columna de
            marca más ancha (1.4fr). Antes era `md:grid-cols-4` fijo: a 768px
            las 4 columnas quedaban apretadas y los correos @upway.business
            se salían de su celda. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-x-10 gap-y-12">
          <div className="space-y-5">
            {/* Logo con el mismo ajuste al marco que el hero (app/page.tsx
                UpwayLogo) y las verticales: px-4 py-2 + h-7→md:h-8. Antes era
                px-5 py-3 con h-7 fijo: el logo quedaba pequeño dentro de su
                propio marco. Se conserva el gradiente propio del footer. */}
            <div className="inline-flex items-center px-6 py-4 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1b3a5f] shadow-lg border border-white/10 overflow-hidden">
              <Image src="/upway.png" alt="Upway Business" width={1000} height={667} quality={90} sizes="192px" className="h-12 w-auto object-contain md:h-16" />
            </div>
            <p className="text-sm leading-relaxed">Potenciando empresas mediante Inteligencia Artificial estratégica.</p>
            {/* Canales de contacto por rol: siempre visibles en el pie de todas
                las páginas. Corresponden a los buzones reales del dominio
                (ventas y soporte son buzones propios, no alias). El encabezado
                "Contacto" sigue el mismo patrón (punto + título) de las otras
                tres columnas — antes los correos aparecían sin título. */}
            <div>
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1b5ed6]" />
                Contacto
              </h4>
              <ul className="space-y-2 text-sm">
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
            </div>
            <div className="flex gap-3">
              <a href="https://www.linkedin.com/in/sophia-de-belfort-990164431" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn de Upway Business" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#1b5ed6] flex items-center justify-center transition-all hover:-translate-y-0.5">
                <Linkedin className="w-4 h-4" aria-hidden />
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
              {/* El orden sigue el de las verticales en la portada: Health,
                  Center, Inmobiliaria. Antes faltaba Center, así que esta
                  columna solo mostraba dos de las tres. "Clínicas y Salud"
                  además apuntaba a /precios en vez de a /salud: los otros dos
                  enlazan a su landing, así que era el único que se saltaba el
                  paso por la vertical. */}
              <li><Link href="/salud" className="hover:text-blue-400 transition-colors">Clínicas y Salud</Link></li>
              <li><Link href="/center" className="hover:text-blue-400 transition-colors">Call Center</Link></li>
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
              <li>
                <a href={`mailto:${CONTACT_EMAIL_LEGAL}`} className="inline-flex items-center gap-2 hover:text-blue-400 transition-colors">
                  <Mail className="w-4 h-4 text-amber-400" aria-hidden />
                  {CONTACT_EMAIL_LEGAL}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT_EMAIL_PRIVACY}`} className="inline-flex items-center gap-2 hover:text-blue-400 transition-colors">
                  <Mail className="w-4 h-4 text-amber-400" aria-hidden />
                  {CONTACT_EMAIL_PRIVACY}
                </a>
              </li>
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
