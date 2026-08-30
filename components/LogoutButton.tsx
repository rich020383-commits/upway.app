"use client";

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const handleLogout = async () => {
    // Limpiamos cualquier estado local almacenado en el cliente si aplica
    localStorage.removeItem('upway-storage');
    
    // Cerramos sesión y redirigimos a la raíz (Landing Page)
    await signOut({ callbackUrl: '/' });
  };

  return (
    <button 
      onClick={handleLogout} 
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
    >
      <LogOut className="h-4 w-4" />
      Salir
    </button>
  );
}