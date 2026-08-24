"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Bot, User, Send, Check, CheckCheck, Loader2, ArrowLeft, Power } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InboxPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [tiendaData, setTiendaData] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 🔄 POLLING INTELIGENTE: Consulta la DB cada 3 segundos
  useEffect(() => {
    if (!userEmail) return;

    const fetchInbox = async () => {
      try {
        const res = await fetch(`/api/inbox?email=${userEmail}`);
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations);
          setTiendaData({
            tiendaId: data.tiendaId,
            token: data.metaAccessToken,
            phoneId: data.metaPhoneNumberId,
            isAiActive: data.isAiActive
          });
          setLoading(false);
        }
      } catch (error) {
        console.error("Error en polling:", error);
      }
    };

    fetchInbox(); // Primera carga
    const interval = setInterval(fetchInbox, 3000); // Latido cada 3 segundos
    return () => clearInterval(interval); // Limpiamos al salir
  }, [userEmail]);

  // Auto-scroll al final cuando se abre un chat o llegan mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatId, conversations]);

  const activeChat = conversations.find(c => c.id === activeChatId);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !activeChat || !tiendaData) return;
    
    setSending(true);
    const mensajeAEnviar = inputMessage;
    setInputMessage(''); // Limpiamos el input rápido para mejor UX

    try {
      await fetch('/api/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeChat.id,
          clientPhone: activeChat.clientPhone,
          content: mensajeAEnviar,
          metaAccessToken: tiendaData.token,
          metaPhoneNumberId: tiendaData.phoneId
        })
      });
      // El polling actualizará la vista en los próximos 3 segundos
    } catch (error) {
      console.error("Fallo al enviar:", error);
    } finally {
      setSending(false);
    }
  };

  const handleToggleAI = async () => {
    if (!tiendaData) return;
    try {
      const nuevoEstado = !tiendaData.isAiActive;
      const res = await fetch('/api/tienda/toggle-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiendaId: tiendaData.tiendaId, isAiActive: nuevoEstado })
      });
      if (res.ok) {
        setTiendaData({ ...tiendaData, isAiActive: nuevoEstado });
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#07090C] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#19C8E8]" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#07090C] text-[#F5F7FA] font-sans flex flex-col h-screen">
      {/* 🚀 HEADER SUPERIOR */}
      <div className="bg-[#0D1117] border-b border-[#1E293B] px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard/bots')} className="text-[#8994A6] hover:text-[#F5F7FA] transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Buzón Omnicanal</h1>
        </div>
        
        {/* BOTÓN DE PAUSA RÁPIDA EN EL HEADER */}
        <button 
          onClick={handleToggleAI}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
            tiendaData?.isAiActive 
              ? 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20' 
              : 'border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20'
          }`}
        >
          <Power className="h-4 w-4" /> {tiendaData?.isAiActive ? 'IA Activa' : 'Modo Humano'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 📋 PANEL IZQUIERDO: LISTA DE CHATS */}
        <div className="w-1/3 border-r border-[#1E293B] bg-[#0D1117] overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-[#8994A6] text-sm">No hay conversaciones aún.</div>
          ) : (
            conversations.map(chat => {
              const ultimoMensaje = chat.messages[chat.messages.length - 1];
              return (
                <div 
                  key={chat.id} 
                  onClick={() => setActiveChatId(chat.id)}
                  className={`p-4 border-b border-[#1E293B] cursor-pointer hover:bg-[#121821] transition-all ${activeChatId === chat.id ? 'bg-[#121821] border-l-4 border-l-[#19C8E8]' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">{chat.clientName || chat.clientPhone}</span>
                    <span className="text-[10px] text-[#8994A6]">
                      {ultimoMensaje ? new Date(ultimoMensaje.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-[#8994A6] truncate">
                    {ultimoMensaje ? ultimoMensaje.content : 'Sin mensajes'}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* 💬 PANEL DERECHO: CONVERSACIÓN */}
        <div className="w-2/3 flex flex-col bg-[#07090C]">
          {activeChat ? (
            <>
              {/* HEADER DEL CHAT */}
              <div className="p-4 bg-[#121821] border-b border-[#1E293B] flex items-center justify-between shrink-0">
                <span className="font-bold">{activeChat.clientName || activeChat.clientPhone}</span>
              </div>

              {/* ÁREA DE MENSAJES */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {activeChat.messages.map((msg: any) => {
                  const isUser = msg.senderRole === 'USER';
                  const isAI = msg.senderRole === 'AI';
                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[70%] p-3 text-sm rounded-2xl relative group ${
                        isUser ? 'bg-[#1E293B] rounded-tl-sm' : 
                        isAI ? 'bg-[#10B981]/10 border border-[#10B981]/20 text-[#F5F7FA] rounded-tr-sm' : 
                        'bg-[#9B5CFF]/10 border border-[#9B5CFF]/20 text-[#F5F7FA] rounded-tr-sm' // Modo Humano (Morado)
                      }`}>
                        
                        {/* Indicador de quién respondió */}
                        {!isUser && (
                          <div className="flex items-center gap-1 mb-1 opacity-50">
                            {isAI ? <Bot className="h-3 w-3 text-[#10B981]"/> : <User className="h-3 w-3 text-[#9B5CFF]"/>}
                            <span className="text-[9px] font-bold uppercase tracking-wider">{isAI ? 'Sofía' : 'Humano'}</span>
                          </div>
                        )}
                        
                        <p className="leading-relaxed">{msg.content}</p>
                        
                        {/* Doble Check Azul de Meta */}
                        {!isUser && (
                          <div className="absolute bottom-1 right-2">
                            {msg.status === 'read' ? (
                              <CheckCheck className="h-3 w-3 text-[#19C8E8]" /> // Azul/Celeste
                            ) : msg.status === 'delivered' ? (
                              <CheckCheck className="h-3 w-3 text-[#8994A6]" /> // Gris
                            ) : (
                              <Check className="h-3 w-3 text-[#8994A6]" /> // Gris un check
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* CAJA DE TEXTO (INPUT) */}
              <div className="p-4 bg-[#121821] border-t border-[#1E293B] flex items-center gap-3 shrink-0">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={tiendaData?.isAiActive ? "Pausa la IA para responder manualmente..." : "Escribe tu respuesta..."}
                  disabled={tiendaData?.isAiActive || sending}
                  className="flex-1 bg-[#07090C] text-sm px-4 py-3 rounded-xl border border-[#1E293B] focus:border-[#19C8E8] outline-none disabled:opacity-50 transition-all"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={tiendaData?.isAiActive || !inputMessage.trim() || sending}
                  className="h-12 w-12 bg-[#19C8E8] text-[#07090C] rounded-xl flex items-center justify-center hover:bg-[#33DDFF] disabled:opacity-50 disabled:hover:bg-[#19C8E8] transition-all shrink-0"
                >
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-1" />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#8994A6]">
              <div className="w-16 h-16 rounded-full border border-[#1E293B] flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 opacity-50" />
              </div>
              <p>Selecciona una conversación para empezar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}