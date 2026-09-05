import { Bot, Loader2, Mic, Send, Square } from 'lucide-react';
import type { RefObject } from 'react';

export type Mensaje = {
  rol: 'usuario' | 'ia';
  texto: string;
  provider?: string;
  esAudio?: boolean;
};

interface WhatsappSimulatorProps {
  nombreAgente: string;
  mensajes: Mensaje[];
  input: string;
  setInput: (value: string) => void;
  escribiendo: boolean;
  grabando: boolean;
  chatContainerRef: RefObject<HTMLDivElement | null>;
  enviarMensajeBackend: (texto: string, audioBase64?: string | null) => Promise<void>;
  iniciarGrabacion: () => Promise<void>;
  detenerGrabacion: () => void;
}

export function WhatsappSimulator({
  nombreAgente,
  mensajes,
  input,
  setInput,
  escribiendo,
  grabando,
  chatContainerRef,
  enviarMensajeBackend,
  iniciarGrabacion,
  detenerGrabacion
}: WhatsappSimulatorProps) {
  return (
    <>
      <div className="shrink-0 bg-[#121821] p-3 md:p-4 flex items-center justify-between border-b border-[#1E293B]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 md:h-10 md:w-10 bg-[#1E293B] border border-[#8994A6]/20 rounded-full flex items-center justify-center">
            <Bot size={18} className="text-[#F5F7FA]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#F5F7FA] text-xs md:text-sm">{nombreAgente || 'Asistente IA'}</h3>
            <p className="text-[9px] md:text-[10px] text-[#19C8E8] font-mono tracking-widest mt-0.5">EN LÍNEA</p>
          </div>
        </div>
      </div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-[#07090C] no-scrollbar">
        {mensajes.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[80%] p-3 md:p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${
              msg.rol === 'usuario'
                ? 'bg-[#1E293B] text-[#F5F7FA] rounded-tr-sm border border-[#8994A6]/20'
                : 'bg-[#121821] text-[#F5F7FA] rounded-tl-sm border border-[#1E293B]'
            }`}>
              <p className={`${msg.esAudio ? 'italic text-[#19C8E8]' : ''}`}>{msg.texto}</p>
              {msg.provider && (
                <p className="text-[9px] md:text-[10px] text-[#8994A6] mt-2 text-right font-mono uppercase">⚡ {msg.provider}</p>
              )}
            </div>
          </div>
        ))}
        {escribiendo && (
          <div className="flex justify-start">
            <div className="bg-[#121821] border border-[#1E293B] p-3 md:p-4 rounded-2xl rounded-tl-sm flex items-center gap-3">
              <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin text-[#19C8E8]" />
              <span className="text-[10px] md:text-xs text-[#8994A6] font-mono tracking-widest">PROCESANDO...</span>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 bg-[#121821] p-3 md:p-4 border-t border-[#1E293B] flex items-center gap-2 md:gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void enviarMensajeBackend(input)}
          placeholder="Envía un mensaje de prueba..."
          disabled={grabando}
          className="flex-1 bg-[#07090C] text-[#F5F7FA] border border-[#1E293B] rounded-xl px-3 md:px-4 py-2.5 md:py-3 outline-none text-xs md:text-sm placeholder-[#8994A6]/50 focus:border-[#19C8E8] transition-all disabled:opacity-50"
        />
        {input.trim() ? (
          <button onClick={() => void enviarMensajeBackend(input)} className="h-10 w-10 md:h-11 md:w-11 shrink-0 bg-[#F5F7FA] rounded-xl flex items-center justify-center text-[#07090C] hover:bg-[#E2E8F0] transition-all">
            <Send size={16} className="ml-1 md:ml-0 md:size-[18px]" />
          </button>
        ) : (
          <button
            onMouseDown={() => void iniciarGrabacion()}
            onMouseUp={detenerGrabacion}
            onTouchStart={() => void iniciarGrabacion()}
            onTouchEnd={detenerGrabacion}
            className={`h-10 w-10 md:h-11 md:w-11 shrink-0 rounded-xl flex items-center justify-center transition-all ${
              grabando
                ? 'bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse'
                : 'bg-[#1E293B] text-[#F5F7FA] hover:bg-[#19C8E8]/10 hover:text-[#19C8E8] border border-[#1E293B]'
            }`}
          >
            {grabando ? <Square size={14} fill="currentColor" /> : <Mic size={16} className="md:size-[18px]" />}
          </button>
        )}
      </div>
    </>
  );
}
