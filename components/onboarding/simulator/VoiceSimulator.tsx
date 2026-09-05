import { Activity, Loader2, Phone, PhoneOff } from 'lucide-react';

interface VoiceSimulatorProps {
  nombreAgente: string;
  estadoLlamada: 'inactiva' | 'conectando' | 'hablando';
  llamadaActiva: boolean;
  toggleLlamada: () => Promise<void>;
}

export function VoiceSimulator({
  nombreAgente,
  estadoLlamada,
  llamadaActiva,
  toggleLlamada
}: VoiceSimulatorProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 bg-[#07090C] relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#F5F7FA 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      <div className="text-center z-10 mb-8 md:mb-12">
        <h3 className="text-xl md:text-2xl font-bold mb-2 text-[#F5F7FA]">{nombreAgente || 'Asistente IA'}</h3>
        <p className={`text-[10px] md:text-xs font-mono uppercase tracking-widest ${estadoLlamada === 'hablando' ? 'text-[#19C8E8]' : 'text-[#8994A6]'}`}>
          {estadoLlamada === 'inactiva' && 'Listo para conexión de voz'}
          {estadoLlamada === 'conectando' && 'Enlazando motores...'}
          {estadoLlamada === 'hablando' && 'Transmisión en curso'}
        </p>
      </div>

      <div className="relative flex items-center justify-center mb-10 md:mb-16 z-10">
        <div className={`absolute w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#19C8E8]/10 blur-xl transition-all duration-1000 ${estadoLlamada === 'hablando' ? 'animate-ping opacity-100' : 'opacity-0'}`}></div>
        <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center z-20 transition-all duration-500 ${
          estadoLlamada === 'hablando'
            ? 'bg-[#19C8E8]/10 border border-[#19C8E8] shadow-[0_0_30px_rgba(25,200,232,0.2)]'
            : 'bg-[#121821] border border-[#1E293B]'
        }`}>
          {estadoLlamada === 'conectando' ? (
            <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-[#19C8E8] animate-spin" />
          ) : (
            <Activity className={`w-8 h-8 md:w-10 md:h-10 ${estadoLlamada === 'hablando' ? 'text-[#19C8E8] animate-pulse' : 'text-[#8994A6]'}`} />
          )}
        </div>
      </div>

      <div className="w-full max-w-[250px] md:max-w-xs z-10">
        <button
          onClick={() => void toggleLlamada()}
          className={`w-full py-3 md:py-4 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 md:gap-3 transition-all ${
            llamadaActiva
              ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30'
              : 'bg-[#F5F7FA] text-[#07090C] hover:bg-[#E2E8F0] shadow-lg'
          }`}
        >
          {llamadaActiva ? (
            <><PhoneOff size={16} /> Finalizar Transmisión</>
          ) : (
            <><Phone size={16} /> Iniciar Llamada</>
          )}
        </button>
      </div>
    </div>
  );
}
