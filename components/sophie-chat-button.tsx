'use client';

import { MessageCircleQuestion } from 'lucide-react';
import { abrirChat } from '@/lib/chat-event';

/**
 * Botón "Hablar con un experto" que abre el chat de Sophie.
 *
 * Antes esto era un `mailto:` que sacaba al visitante de la página y lo mandaba
 * a redactar un correo. El chat de Sophie ya vive en el sitio, conoce los planes
 * y responde al instante: mandar a alguien a un correo para "¿cuánto cuesta?"
 * pierde a la mayoría.
 *
 * El correo no se pierde como opción: sigue disponible en el propio chat, que
 * ofrece el traspaso al equipo humano con el contexto de la conversación.
 */
export default function SophieChatButton({
  className = 'inline-flex items-center justify-center gap-2 rounded-full border border-[#9fe0dc] bg-[#e7fbfa] px-6 py-3.5 text-sm font-bold text-[#0d8a88] transition hover:border-[#0ba9a9] hover:bg-[#d7f5f2]',
  label = 'Hablar con un experto',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button type="button" onClick={abrirChat} className={className}>
      <MessageCircleQuestion className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}
