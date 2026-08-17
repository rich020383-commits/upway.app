"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Bot, Sparkles, UserCircle } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton'; 
import { usePathname } from 'next/navigation';
import { getSession } from 'next-auth/react'; // 🔥 Importamos getSession

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname.includes('/onboarding');
  
  // Estado para guardar el nombre real del usuario
  const [userName, setUserName] = useState<string>("Cargando...");

  useEffect(() => {
    // Obtenemos la sesión real
    getSession().then((session) => {
      if (session?.user?.name) {
        setUserName(session.user.name);
      } else if (session?.user?.email) {
        // Si no tiene nombre registrado, le mostramos la primera parte del correo
        setUserName(session.user.email.split('@')[0]);
      } else {
        // Fallback por si acaso entran sin sesión en modo desarrollo
        setUserName("Usuario Upway");
      }
    });
  }, []);

  return (
    // Fondo oscuro Enterprise Luxury unificado
    <div className="min-h-screen bg-[#07090C] text-[#F5F7FA] font-sans selection:bg-[#19C8E8] selection:text-[#07090C]">
      
      {/* Header Premium (Oculto en Onboarding, visible en el Panel Central) */}
      {!isOnboarding && (
        <header className="sticky top-0 z-50 border-b border-[#1E293B] bg-[#07090C]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            
            {/* LOGO */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#19C8E8]/10 text-[#19C8E8] border border-[#19C8E8]/20 transition-all group-hover:border-[#19C8E8]/50">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold tracking-widest text-[#8994A6]">UPWAY</p>
                <p className="text-sm font-bold text-[#F5F7FA]">Business Control</p>
              </div>
            </Link>

            {/* NAVEGACIÓN DE LUJO */}
            <nav className="hidden items-center gap-8 text-sm font-semibold text-[#8994A6] md:flex">
              <Link href="/dashboard/bots" className="flex items-center gap-2 transition-colors hover:text-[#19C8E8]">
                <Bot className="h-4 w-4" /> Centro de Mando
              </Link>
              <Link href="/dashboard/inventario" className="flex items-center gap-2 transition-colors hover:text-[#19C8E8]">
                <Package className="h-4 w-4" /> Cerebro RAG
              </Link>
            </nav>

            {/* USUARIO REAL Y CERRAR SESIÓN */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1E293B] bg-[#0D1117]">
                <UserCircle className="h-4 w-4 text-[#8994A6]" />
                <span className="text-xs font-medium text-[#F5F7FA] capitalize">{userName}</span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>
      )}

      <main>{children}</main>
    </div>
  );
}