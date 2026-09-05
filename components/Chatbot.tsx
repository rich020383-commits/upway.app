"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Cpu, Activity, Zap, ShieldCheck, Mic, Square } from "lucide-react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [aiProvider, setAiProvider] = useState("SISTEMA_EN_ESPERA");
  
  const [messages, setMessages] = useState([
    { 
      role: "system", 
      content: `Eres Sophie v2, estratega comercial premium de Upway 2.0, orientada a operaciones de alto valor y a la vertical Health. Tu misión es ayudar a clínicas, negocios de servicio y empresas con volumen serio a entender que no venden un bot, venden un sistema operativo de atención, ventas y coordinación.

REGLAS ESTRICTAS:
1. NUNCA ofrezcas menús numerados. Habla como un especialista senior, directo y elegante.
2. Tono premium, empático, claro y muy orientado a negocio.
3. Si el cliente te envía un audio, responde con naturalidad, resaltando la capacidad del sistema para operar con voz, urgencias, atención y coordinación.
4. Explica el costo con propiedad: software mensual dedicado + consumo de canales por uso real + posibilidad de crédito inicial o paquete de arranque.
5. No menciones Vapi ni marcas de infraestructura de forma visible. Habla del agente de voz como parte del sistema.

MODELO DE COSTO Y POSICIONAMIENTO:
- Upway 2.0 es un software operativo premium de acompañamiento comercial y clínico.
- El valor principal es la operación: triage, agenda, lead qualification, escalamiento, seguimiento y control.
- Los mensajes o consumo de canales fuera de lo gratuito se facturan según uso real y la cuenta de billing asociada.
- Podemos ofrecer una precarga/paquetes de créditos para arrancar sin fricción.

CIERRE HACIA EL SIMULADOR:
Si el cliente menciona que quiere probarlo, ver una demostración, agendar una cita o saber cómo funciona, dile que no tiene que esperar a ningún agendamiento. Invítalo a verlo en acción ahora mismo en el panel de simulación.
Cuando hagas esto, debes incluir EXACTAMENTE este texto al final de tu respuesta para habilitarle el acceso al sistema: [BOTON_REGISTRO]` 
    },
    { 
      role: "bot", 
      content: "¡Hola! Soy Sophie v2, especialista de Upway 2.0. Cuéntame cuál es tu operación, qué volumen de atención gestionas y dónde más te está costando crecer o responder mejor." 
    }
  ]);
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // 🔥 ESTADOS PARA AUDIO
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isRecording]);

  useEffect(() => {
    const escucharBoton = () => {
      setIsOpen(true); 
    };
    window.addEventListener('abrir-chat', escucharBoton);
    return () => window.removeEventListener('abrir-chat', escucharBoton);
  }, []);

  const cerrarChat = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); 
    setIsOpen(false);
  };

  // ==========================================
  // LÓGICA DE GRABACIÓN DE AUDIO
  // ==========================================
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result;
          enviarAudio(base64Audio as string);
        };

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error al acceder al micrófono:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const enviarAudio = async (base64Audio: string) => {
    const userMessage = { role: "user", content: "🎤 Nota de voz enviada" };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setAiProvider("ESCUCHANDO_AUDIO..."); 

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      // 🔥 APUNTAMOS A LA RUTA PREMIUM DE SOPHIE
      const res = await fetch(`${baseUrl}/api/sophie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, audioUsuario: base64Audio }), 
      });
      const data = await res.json();
      
      if (data.provider) setAiProvider(data.provider);
      
      const organicDelay = Math.floor(Math.random() * 800) + 500;
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
        setIsLoading(false);
      }, organicDelay);

    } catch (error) {
      setAiProvider("ERROR_DE_RED");
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "bot", content: "⚠️ ERROR DE SISTEMA: Interrupción en la red neuronal al procesar tu audio." }]);
        setIsLoading(false);
      }, 1500);
    }
  };

  // ==========================================
  // LÓGICA DE TEXTO
  // ==========================================
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage]; 
    setMessages(updatedMessages); 
    setInput("");
    setIsLoading(true);
    setAiProvider("ENRUTANDO_PETICIÓN...");

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      // 🔥 APUNTAMOS A LA RUTA PREMIUM DE SOPHIE
      const res = await fetch(`${baseUrl}/api/sophie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }), 
      });
      const data = await res.json();
      
      if (data.provider) setAiProvider(data.provider);
      
      const organicDelay = Math.floor(Math.random() * 800) + 500;
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
        setIsLoading(false);
      }, organicDelay);

    } catch (error) {
      setAiProvider("ERROR_DE_RED");
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "bot", content: "⚠️ ERROR DE SISTEMA: Interrupción en la red neuronal." }]);
        setIsLoading(false);
      }, 1500);
    }
  };

  return (
    <>
      {/* BOTÓN FLOTANTE */}
      <motion.button 
        animate={{ 
          boxShadow: isOpen 
            ? "0px 0px 0px rgba(0,0,0,0)" 
            : ["0px 0px 15px rgba(0,209,255,0.4)", "0px 0px 30px rgba(0,209,255,0.8)", "0px 0px 15px rgba(0,209,255,0.4)"]
        }}
        transition={{ duration: 2, repeat: isOpen ? 0 : Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full border border-[#00D1FF]/50 backdrop-blur-md transition-all z-[999] flex items-center justify-center overflow-hidden ${
          isOpen ? 'bg-[#0A0E14] text-white opacity-0 pointer-events-none' : 'bg-[#00D1FF]/10 text-[#00D1FF]'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-[#00D1FF]/20 to-transparent pointer-events-none" />
        <img 
          src="/sophie-icon.png" 
          alt="Abrir Sophie V2" 
          className="w-7 h-7 rounded-[8px] object-cover shadow-[0_0_10px_rgba(34,211,238,0.3)] transition-transform group-hover:scale-110 relative z-10" 
        />
      </motion.button>

      {/* PANEL DE COMANDO SOPHIE V2 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="fixed bottom-6 right-6 w-[360px] md:w-[420px] h-[600px] bg-[#0A0E14]/90 backdrop-blur-2xl rounded-2xl shadow-[0_0_50px_rgba(0,209,255,0.15)] border border-[#00D1FF]/20 z-[1000] flex flex-col overflow-hidden ring-1 ring-white/5"
          >
            {/* CABECERA (HUD TECH) */}
            <div className="bg-[#03050a]/80 p-4 border-b border-[#00D1FF]/20 flex items-center justify-between shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,209,255,0.05)_50%)] bg-[length:100%_4px] pointer-events-none" />
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="relative shrink-0">
                  {/* Brillo de fondo dinámico */}
                  <div className={`absolute inset-0 bg-[#00D1FF] blur-md rounded-xl transition-opacity duration-300 ${isLoading ? 'opacity-80 animate-pulse' : 'opacity-30'}`}></div>
                  
                  <img 
                    src="/sophie-icon.png" 
                    alt="Sophie V2" 
                    className={`relative w-11 h-11 rounded-xl object-cover border transition-all duration-300 ${isLoading ? 'border-white shadow-[0_0_20px_rgba(0,209,255,0.8)]' : 'border-[#00D1FF]/50 shadow-sm'}`} 
                  />
                  
                  {/* Punto verde de status */}
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#0A0E14] rounded-full"></span>
                </div>

                <div>
                  <h3 className="font-display font-bold text-[14px] text-white tracking-wide flex items-center gap-1.5">
                    SOPHIE_V2 <ShieldCheck className="w-3.5 h-3.5 text-[#00D1FF]" />
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[9px] font-mono text-[#00D1FF]/70 uppercase tracking-widest truncate max-w-[150px]" title={aiProvider}>
                      <Cpu className="w-3 h-3 shrink-0" /> {aiProvider}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-mono text-[#00D1FF]/70 uppercase tracking-widest shrink-0">
                      <Activity className="w-3 h-3 shrink-0" /> {isLoading ? "PROCESANDO" : "IDLE"}
                    </span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={cerrarChat} 
                className="text-white/60 hover:text-white hover:bg-white/10 p-2.5 rounded-xl transition-all relative z-[9999] cursor-pointer flex items-center justify-center bg-black/20"
                title="Cerrar chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* ÁREA DE MENSAJES (TERMINAL) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gradient-to-b from-[#03050a]/50 to-[#0A0E14]/80 scroll-smooth">
              {messages.filter(m => m.role !== "system").map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 250, damping: 25 }}
                  key={i} 
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] p-4 text-[13px] leading-relaxed relative ${
                      m.role === 'user' 
                        ? 'bg-[#00D1FF]/10 text-white border border-[#00D1FF]/30 rounded-lg rounded-tr-none shadow-[0_0_15px_rgba(0,209,255,0.1)]' 
                        : 'bg-white/[0.03] text-slate-300 border border-white/10 rounded-lg rounded-tl-none'
                    }`}
                  >
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30" />

                    {m.content.includes('[BOTON_REGISTRO]') ? (
                      <div className="flex flex-col gap-3">
                        <span>{m.content.replace('[BOTON_REGISTRO]', '')}</span>
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => window.location.href = '/register'} 
                          className="bg-[#00D1FF]/20 border border-[#00D1FF]/50 text-[#00D1FF] px-4 py-2.5 rounded text-[12px] font-mono tracking-widest uppercase hover:bg-[#00D1FF] hover:text-black transition-all flex items-center justify-center gap-2 mt-2 shadow-[0_0_15px_rgba(0,209,255,0.3)]"
                        >
                          <Zap className="w-4 h-4" /> IR AL SIMULADOR
                        </motion.button>
                      </div>
                    ) : (
                      <span className="font-body whitespace-pre-line">{m.content}</span>
                    )}
                  </div>
                </motion.div>
              ))}
              
              <AnimatePresence>
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/[0.03] border border-white/10 p-3.5 rounded-lg rounded-tl-none flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-[#00D1FF]/50 uppercase tracking-widest mr-2">Calculando</span>
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-1.5 h-3 bg-[#00D1FF] skew-x-[-20deg]" />
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-3 bg-[#00D1FF] skew-x-[-20deg]" />
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-3 bg-[#00D1FF] skew-x-[-20deg]" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <AnimatePresence>
                {isRecording && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="flex justify-end">
                    <div className="flex items-center gap-2 rounded-[20px] rounded-tr-[4px] border border-red-500/30 bg-red-500/10 p-3 backdrop-blur-md text-red-400 text-[11px] font-mono tracking-widest uppercase">
                      <span className="animate-pulse h-1.5 w-1.5 rounded-full bg-red-500 block"></span> Grabando...
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT DE TERMINAL CON BOTONERA MULTIMEDIA */}
            <div className="p-4 bg-[#03050a] border-t border-[#00D1FF]/20 shrink-0 relative z-20">
              <div className="relative flex items-center bg-[#0A0E14] border border-white/10 focus-within:border-[#00D1FF]/50 rounded text-white overflow-hidden transition-colors">
                <div className="pl-3 text-[#00D1FF] font-mono text-[14px]">{'>'}</div>
                <input 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={isRecording ? "Grabando audio..." : "Ingresa un comando o audio..."}
                  disabled={isLoading || isRecording}
                  className="w-full bg-transparent pl-3 pr-14 py-3.5 text-[13px] font-mono text-white placeholder-white/30 outline-none disabled:opacity-50"
                />
                
                {/* 🔥 BOTONERA DINÁMICA DE SOFÍA */}
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {input.trim() ? (
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={sendMessage} 
                      disabled={isLoading}
                      className="bg-white/5 hover:bg-[#00D1FF]/20 disabled:bg-transparent text-[#00D1FF] disabled:text-white/20 p-2.5 rounded transition-colors flex items-center justify-center"
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  ) : isRecording ? (
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={stopRecording} 
                      className="bg-red-500/20 hover:bg-red-500/40 text-red-500 p-2.5 rounded transition-colors flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse"
                    >
                      <Square className="w-4 h-4 fill-current" />
                    </motion.button>
                  ) : (
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={startRecording} 
                      disabled={isLoading}
                      className="bg-white/5 hover:bg-[#00D1FF]/20 text-[#00D1FF] p-2.5 rounded transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      <Mic className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}