"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Cpu, Activity, Zap, ShieldCheck, Mic, Square, MessageCircle } from "lucide-react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [aiProvider, setAiProvider] = useState("SISTEMA_EN_ESPERA");
  // 🚨 Link de WhatsApp del asesor humano (handoff web -> WhatsApp)
  const [waAdvisorLink, setWaAdvisorLink] = useState<string | null>(null);

  const [messages, setMessages] = useState([
    {
      role: "bot",
      content: "¡Hola! Soy Sophie v2, especialista de Upway.\nConozco los planes, precios y capacidades oficiales de Upway: pregúntame por tarifas, planes, activación o cómo funciona.\nPara ayudarte bien, dime: ¿Qué negocio tienes o en qué sector operas?"
    }
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 🔥 ESTADOS PARA AUDIO
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Scroll del chat: movemos ÚNICAMENTE el contenedor de mensajes.
   * Antes se usaba `scrollIntoView`, que arrastra a TODOS los ancestros
   * scrollables —incluida la página—: con el chat abierto, al llegar un
   * mensaje la landing completa se desplazaba sola en el celular.
   */
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  };

  // Al abrir saltamos al final sin animación: entrar desplazándose se sentía lento.
  useEffect(() => {
    if (!isOpen) return;
    scrollToBottom("auto");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    scrollToBottom();
  }, [messages, isLoading, isRecording, isOpen]);

  useEffect(() => {
    const escucharBoton = () => {
      setIsOpen(true);
    };
    window.addEventListener('abrir-chat', escucharBoton);
    return () => window.removeEventListener('abrir-chat', escucharBoton);
  }, []);

  /**
   * En celular el chat es una hoja a pantalla completa: mientras está abierto
   * se bloquea el scroll del documento para que la página de fondo no se
   * mueva al deslizar dentro de la conversación ni al abrir el teclado.
   * Desde 640px el panel vuelve a ser flotante y el documento queda libre.
   */
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    if (!window.matchMedia('(max-width: 639px)').matches) return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [isOpen]);

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
      // Antes el fallo sólo quedaba en consola: en celular el usuario veía
      // que "no pasaba nada" al tocar el micrófono.
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "🎤 No pude acceder a tu micrófono. Revisa los permisos del navegador o escríbeme por texto y seguimos.",
        },
      ]);
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
      if (data.waAdvisorLink) setWaAdvisorLink(data.waAdvisorLink);

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
      if (data.waAdvisorLink) setWaAdvisorLink(data.waAdvisorLink);

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
      {/* BOTÓN FLOTANTE
          El pulso ahora anima `opacity` (se resuelve en el compositor) en vez
          de `box-shadow`: animar la sombra de un elemento fijo obliga a
          repintar la pantalla completa en cada frame y era una de las causas
          del scroll trabado en celular. También respeta el área segura del
          iPhone (barra gestual) para no quedar tapado. */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Cerrar el chat de Sophie" : "Abrir el chat de Sophie"}
        className={`group fixed right-5 bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] w-14 h-14 rounded-full border border-[#00D1FF]/50 backdrop-blur-md transition-all z-[999] flex items-center justify-center overflow-hidden sm:right-6 sm:bottom-6 ${
          isOpen ? 'bg-[#0A0E14] text-white opacity-0 pointer-events-none' : 'bg-[#00D1FF]/10 text-[#00D1FF]'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 rounded-full shadow-[0_0_26px_rgba(0,209,255,0.65)] ${isOpen ? 'opacity-0' : 'animate-pulse-glow'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#00D1FF]/20 to-transparent pointer-events-none" />
        <img
          src="/sophie-icon.png"
          alt="Sophie, asistente de Upway"
          className="w-7 h-7 rounded-[8px] object-cover shadow-[0_0_10px_rgba(34,211,238,0.3)] transition-transform group-hover:scale-110 relative z-10"
        />
      </motion.button>

      {/* PANEL DE COMANDO SOPHIE V2 */}
      <AnimatePresence>
        {isOpen && (
          /* HOJA MÓVIL: a pantalla completa (hasta 640px) con alto `100dvh`
             para que la barra del navegador no recorte el campo de escritura.
             Desde `sm` vuelve al panel flotante de escritorio. */
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
            className="fixed inset-x-0 bottom-0 z-[1000] flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden overscroll-contain border-0 bg-[#0A0E14] ring-1 ring-white/5 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:h-[600px] sm:max-h-[calc(100dvh-3rem)] sm:w-[420px] sm:rounded-2xl sm:border sm:border-[#00D1FF]/20 sm:bg-[#0A0E14]/95 sm:shadow-[0_0_50px_rgba(0,209,255,0.15)]"
          >
            {/* CABECERA (HUD TECH) — con respeto al notch del celular */}
            <div className="bg-[#03050a]/80 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] border-b border-[#00D1FF]/20 flex items-center justify-between shrink-0 relative overflow-hidden sm:p-4">
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

            {/* ÁREA DE MENSAJES (TERMINAL)
                `overscroll-contain`: el deslizamiento se queda dentro de la
                conversación y no se encadena a la página de fondo. Se retiró
                `scroll-smooth` porque en móvil animaba el scroll del panel
                completo con cada mensaje nuevo. */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5 bg-gradient-to-b from-[#03050a]/50 to-[#0A0E14]/80 [-webkit-overflow-scrolling:touch]"
            >
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
                          onClick={() => window.location.href = '/register?next=' + encodeURIComponent('/health/onboarding')}
                          className="bg-[#00D1FF]/20 border border-[#00D1FF]/50 text-[#00D1FF] px-4 py-2.5 rounded text-[12px] font-mono tracking-widest uppercase hover:bg-[#00D1FF] hover:text-black transition-all flex items-center justify-center gap-2 mt-2 shadow-[0_0_15px_rgba(0,209,255,0.3)]"
                        >
                          <Zap className="w-4 h-4" /> REGISTRARME / INICIAR SESIÓN
                        </motion.button>
                      </div>
                    ) : m.content.includes('[CONTACTAR_ASESOR]') ? (
                      <div className="flex flex-col gap-3">
                        <span className="font-body whitespace-pre-line">{m.content.replace('[CONTACTAR_ASESOR]', '')}</span>
                        <motion.a
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          href={waAdvisorLink || `https://wa.me/573126427824`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setWaAdvisorLink(null)}
                          className="bg-[#25D366]/15 border border-[#25D366]/50 text-[#25D366] px-4 py-2.5 rounded text-[12px] font-mono tracking-widest uppercase hover:bg-[#25D366] hover:text-black transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(37,211,102,0.3)]"
                        >
                          <MessageCircle className="w-4 h-4" /> CONECTAR CON ASESOR
                        </motion.a>
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
            </div>

            {/* INPUT DE TERMINAL CON BOTONERA MULTIMEDIA
                El padding inferior suma el área segura del iPhone para que el
                campo no quede debajo de la barra gestual. */}
            <div className="px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:p-4 bg-[#03050a] border-t border-[#00D1FF]/20 shrink-0 relative z-20">
              <div className="relative flex items-center bg-[#0A0E14] border border-white/10 focus-within:border-[#00D1FF]/50 rounded text-white overflow-hidden transition-colors">
                <div className="pl-3 text-[#00D1FF] font-mono text-[14px]">{'>'}</div>
                {/* `onKeyDown` en vez de `onKeyPress` (evento obsoleto en React 19)
                    y controles móviles: tecla de envío, sin autocorrección y sin
                    mayúscula automática en comandos. El texto a 16px evita que
                    iOS haga zoom al enfocar y descoloque la interfaz. */}
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  enterKeyHint="send"
                  autoComplete="off"
                  autoCapitalize="sentences"
                  spellCheck={false}
                  aria-label="Escribe tu mensaje para Sophie"
                  placeholder={isRecording ? "Grabando audio..." : "Ingresa un comando o audio..."}
                  disabled={isLoading || isRecording}
                  className="w-full bg-transparent pl-3 pr-14 py-3.5 text-[16px] sm:text-[13px] font-mono text-white placeholder-white/30 outline-none disabled:opacity-50"
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