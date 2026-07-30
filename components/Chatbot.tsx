"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, Sparkles } from "lucide-react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  
  const [messages, setMessages] = useState([
    { role: "bot", content: "¡Hola! Veo que estás listo para llevar tu empresa al siguiente nivel con Upway Business. Para entender mejor tu operación y asignarte el especialista adecuado, cuéntame: ¿Cuál es el proceso que más tiempo le consume a tu equipo actualmente?" }
  ]);
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const escucharBoton = () => {
      setIsOpen(true); 
    };
    window.addEventListener('abrir-chat', escucharBoton);
    return () => window.removeEventListener('abrir-chat', escucharBoton);
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 🔥 ACTUALIZADO: Apunta al nuevo dominio unificado
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://upway.business";
      const res = await fetch(`${baseUrl}/api/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      
      const organicDelay = Math.floor(Math.random() * 1000) + 1000;
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
        setIsLoading(false);
      }, organicDelay);

    } catch (error) {
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "bot", content: "Lo siento, mis servidores están en mantenimiento. Por favor, intenta de nuevo en unos minutos." }]);
        setIsLoading(false);
      }, 1500);
    }
  };

  return (
    <>
      <motion.button 
        animate={{ 
          scale: isOpen ? 1 : [1, 1.05, 1],
          boxShadow: isOpen 
            ? "0px 0px 15px rgba(0,0,0,0.2)" 
            : ["0px 0px 15px rgba(37,99,235,0.4)", "0px 0px 25px rgba(34,211,238,0.7)", "0px 0px 15px rgba(37,99,235,0.4)"]
        }}
        transition={{ duration: isOpen ? 0.2 : 2.5, repeat: isOpen ? 0 : Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed bottom-6 right-6 p-4 rounded-full transition-colors z-50 flex items-center justify-center ${
          isOpen ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="fixed bottom-24 right-6 w-[350px] md:w-[400px] h-[550px] bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden"
          >
            <div className="bg-slate-950 p-5 text-white flex items-center justify-between shrink-0 border-b border-slate-800 shadow-sm">
              <div className="flex items-center space-x-4">
                
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <motion.div
                    animate={{ 
                      scale: isLoading ? [1, 1.3, 1] : [1, 1.15, 1], 
                      opacity: isLoading ? [0.6, 1, 0.6] : [0.2, 0.6, 0.2],
                      rotate: isLoading ? 180 : 0
                    }}
                    transition={{ duration: isLoading ? 1 : 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-cyan-400/50 border-t-transparent"
                  />
                  <motion.div
                    animate={{ 
                      scale: isLoading ? [1, 1.5, 1] : [1, 1.3, 1], 
                      opacity: isLoading ? [0.3, 0.7, 0.3] : [0.1, 0.3, 0.1],
                      rotate: isLoading ? -180 : 0
                    }}
                    transition={{ duration: isLoading ? 1.5 : 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border border-blue-500/40 border-b-transparent"
                  />
                  <motion.div 
                    animate={{ boxShadow: isLoading ? "0 0 25px rgba(34,211,238,1)" : "0 0 10px rgba(34,211,238,0.5)" }}
                    className="relative w-8 h-8 bg-gradient-to-tr from-blue-600 to-cyan-300 rounded-full flex items-center justify-center z-10"
                  >
                    <Bot className="w-4 h-4 text-white" />
                  </motion.div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-950 rounded-full z-20 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                </div>

                <div>
                  <h3 className="font-bold text-sm tracking-wide flex items-center gap-1 text-slate-100">
                    Upway System <Sparkles className="w-3 h-3 text-cyan-400" />
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <motion.div 
                      animate={{ opacity: isLoading ? [1, 0.2, 1] : [0.4, 1, 0.4] }} 
                      transition={{ duration: isLoading ? 0.5 : 1.5, repeat: Infinity }}
                      className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
                    />
                    <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-semibold">
                      {isLoading ? "Procesando Datos..." : "Sistema Operativo"}
                    </p>
                  </div>
                </div>
              </div>
              
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white hover:rotate-90 transition-all duration-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 scroll-smooth">
              {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, originY: 1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 250, damping: 20 }}
                  key={i} 
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] p-4 text-sm leading-relaxed ${
                      m.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-md' 
                        : 'bg-white text-slate-700 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100'
                    }`}
                  >
                    {m.content.includes('[ABRIR_FORMULARIO]') ? (
                      <div className="flex flex-col gap-3">
                        <span>{m.content.replace('[ABRIR_FORMULARIO]', '')}</span>
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => window.dispatchEvent(new Event('abrir-modal-lead'))}
                          className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2.5 rounded-lg font-semibold shadow-md flex items-center justify-center gap-2 mt-2"
                        >
                          📋 Llenar Formulario
                        </motion.button>
                      </div>
                    ) : (
                      <span>{m.content}</span>
                    )}
                  </div>
                </motion.div>
              ))}
              
              <AnimatePresence>
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 flex items-center space-x-2">
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-2 h-2 bg-cyan-500 rounded-full" />
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 bg-blue-700 rounded-full" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              <motion.div 
                animate={{ 
                  boxShadow: input.length > 0 ? "0px 0px 12px rgba(34,211,238,0.4)" : "0px 0px 0px rgba(34,211,238,0)",
                  borderColor: input.length > 0 ? "rgba(34,211,238,0.5)" : "rgba(226,232,240,1)"
                }}
                className="relative flex items-center rounded-full border transition-colors bg-slate-50"
              >
                <input 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Escribe tu consulta aquí..."
                  disabled={isLoading}
                  className="w-full bg-transparent pl-5 pr-12 py-3.5 text-sm text-slate-900 outline-none disabled:opacity-50 rounded-full"
                />
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={sendMessage} 
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-cyan-500 disabled:bg-slate-300 text-white p-2 rounded-full transition-colors flex items-center justify-center shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}