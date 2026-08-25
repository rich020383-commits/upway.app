import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai'; 
import { prisma } from '@/lib/prisma';

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'upway_inworker_seguro_2026';
const UPWAY_PHONE_ID = '1172769935927318'; // 👑 EL NÚMERO VIP DE UPWAY
const INWORKER_PHONE_ID = '1334640129724588'; // 🚀 EL NUEVO NÚMERO DE INWORKER (SOPHIE)

// ==========================================
// 🧠 INICIALIZACIÓN DE MOTORES DE CASCADA 
// ==========================================

const groqClient = process.env.GROQ_API_KEY 
  ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' }) 
  : null;

const sambanovaClient = process.env.SAMBANOVA_API_KEY 
  ? new OpenAI({ apiKey: process.env.SAMBANOVA_API_KEY, baseURL: 'https://api.sambanova.ai/v1' }) 
  : null;

const mistralClient = process.env.MISTRAL_API_KEY 
  ? new OpenAI({ apiKey: process.env.MISTRAL_API_KEY, baseURL: 'https://api.mistral.ai/v1' }) 
  : null;

const openRouterClient = process.env.OPENROUTER_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: 'https://openrouter.ai/api/v1' }) 
  : null;

const geminiPremiumApiKey = process.env.GEMINI_PREMIUM_API_KEY || process.env.GEMINI_API_KEY;
const geminiGenAI = geminiPremiumApiKey ? new GoogleGenerativeAI(geminiPremiumApiKey) : null;

const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;

// ==========================================
// 🗄️ SISTEMA FAQ Y RAG
// ==========================================
const FAQ_CACHE = new Map<string, string>();

const BASIC_FAQ_LOOKUPS: Array<{ pattern: RegExp; reply: string; }> = [
  { pattern: /\b(hola|buenas|buenos días|buenas tardes|buenas noches|qué tal|hey)\b/i, reply: '¡Hola! 👋 Soy el asistente digital de Upway. ¿Quieres conocer los planes o ver cómo funciona el panel en vivo?' },
  { pattern: /\b(precio|plan|costo|cuesta|valor)\b/i, reply: 'Nuestros planes van desde $149.900 COP/mes para texto y catálogo básico, hasta $499.900 COP/mes para automación avanzada, audio y reportes. ¿Quieres que te recomiende el mejor según tu negocio?' },
  { pattern: /\b(direcci[oó]n|d[oó]nde est[aá]|ubicaci[oó]n)\b/i, reply: 'Estamos listos para ayudarte desde nuestro panel de Upway. Para conocer la dirección exacta de la tienda, responde con el nombre del local o el tipo de negocio.' },
  { pattern: /\b(horario|horarios|abre|abren|atenci[oó]n)\b/i, reply: 'Atendemos por WhatsApp y nuestro asistente virtual está disponible 24/7 para responder tus consultas comerciales.' },
  { pattern: /\b(demo|probar|ver demo|simular|cómo funciona)\b/i, reply: '¡Claro que sí! La mejor forma de verlo es en acción. Entra a nuestro panel gratis ahora mismo y mira cómo respondería tu agente en tiempo real. [BOTON_REGISTRO]' }
];

const sendMonitorAlert = async (message: string) => {
  if (!ALERT_WEBHOOK_URL) return;
  try {
    await fetch(ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });
  } catch (alertError) {
    console.warn('No se pudo enviar alerta de monitoreo:', alertError);
  }
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, providerName: string) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${providerName} timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
};

const sendProviderAlert = async (provider: string, error: unknown) => {
  const message = `⚠️ Relevo activado en Upway Webhook: ${provider} falló. ${String(error)}`;
  await sendMonitorAlert(message);
};

const limpiarTexto = (txt: string) => txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const normalizeFaqText = (text: string) => limpiarTexto(text).replace(/\s+/g, ' ').trim();

const resolveStaticFaqResponse = (texto: string, tienda?: { direccion?: string }) => {
  const key = normalizeFaqText(texto);
  if (FAQ_CACHE.has(key)) return FAQ_CACHE.get(key) || null;

  const found = BASIC_FAQ_LOOKUPS.find(entry => entry.pattern.test(texto));
  if (found) {
    let response = found.reply;
    if (found.pattern.source.includes('direcci')) {
      if (tienda?.direccion) {
        response = `La dirección es: ${tienda.direccion}.`; 
      } else {
        response = 'Puedo ayudarte con la dirección si me dices el nombre de la tienda o el tipo de negocio.';
      }
    }
    FAQ_CACHE.set(key, response);
    if (FAQ_CACHE.size > 200) FAQ_CACHE.clear();
    return response;
  }
  return null;
};

interface Producto { nombre: string; categoria?: string; precio: number; }

function buscarEnInventarioLocal(mensaje: string, todosLosProductos: Producto[]): Producto[] {
  const mensajeLimpio = limpiarTexto(mensaje);
  const palabrasClave = mensajeLimpio.split(' ').filter(p => p.length > 3);
  if (palabrasClave.length === 0) return []; 
  
  return todosLosProductos.filter(prod => {
    const nombreLimpio = limpiarTexto(prod.nombre);
    const categoriaLimpia = prod.categoria ? limpiarTexto(prod.categoria) : "";
    return palabrasClave.some(palabra => nombreLimpio.includes(palabra) || categoriaLimpia.includes(palabra));
  });
}

// ==========================================
// 🛡️ NÚCLEO DE LA CASCADA INQUEBRANTABLE
// ==========================================
async function generarRespuesta(textoCliente: string, phoneId: string, tiendaRecord: any) {
    let systemPromptText = "";
    const isVip = (phoneId === UPWAY_PHONE_ID || phoneId === INWORKER_PHONE_ID);

    if (isVip) {
        console.log(`👑 Canal VIP (${phoneId}). Preparando IA...`);
        const promptPorDefecto = `Rol: Eres Sophie, la asistente virtual y cerradora de ventas estrella de Upway. Tu tono es persuasivo, tecnológico, amigable y muy directo. Tus respuestas deben ser cortas (ideales para WhatsApp) y usar emojis.
        Objetivo Principal: Tu misión es diagnosticar el tamaño del negocio del cliente y recetar el plan exacto que necesitan.
        Planes y Precios:
        🔵 PLAN EMPRENDEDOR ($149.900 COP/mes): Atención por texto. Hasta 500 productos.
        🔵 PLAN NEGOCIO ($299.900 COP/mes) - EL MÁS POPULAR: Capacidad de procesar audios. Toma de pedidos automatizada. 2.000 productos.
        🟣 PLAN EMPRESA ($499.900 COP/mes): Lectura de PDFs. 10.000 productos.
        REGLA NINJA: NUNCA ofrezcas agendar llamadas con humanos. Eres un SaaS de autoservicio.
        CALL TO ACTION: Tu cierre de ventas siempre debe ser invitarlos a crear su cuenta en https://upway.business. Aceptamos Nequi, Bancolombia, Bold o Wompi.`;
        
        systemPromptText = tiendaRecord?.systemPrompt || promptPorDefecto;
    } else {
        console.log(`🏢 Usando base de datos del cliente para el número: ${phoneId}`);
        
        const faqStaticResponse = resolveStaticFaqResponse(textoCliente, tiendaRecord ? { direccion: tiendaRecord.direccion } : undefined);
        if (faqStaticResponse) {
          console.log('🔍 Respuesta rápida desde caché FAQ o reglas estáticas.');
          return faqStaticResponse;
        }

        const inventarioCompleto: Producto[] = (tiendaRecord?.productos || []).map((p: any) => ({
            nombre: String(p.nombre),
            categoria: p.categoria ? String(p.categoria) : "General",
            precio: Number(p.precio)
        }));

        const productosRelevantes = buscarEnInventarioLocal(textoCliente, inventarioCompleto);
        let contextoInventario = "No hay stock directo en el inventario para esta consulta.";
        
        if (productosRelevantes.length > 0) {
           contextoInventario = `PRODUCTOS ENCONTRADOS:\n${productosRelevantes.map(p => `- ${p.nombre} - Precio: $${p.precio}`).join('\n')}`;
        }

        const promptCliente = tiendaRecord?.systemPrompt || "Eres un asistente de ventas. Responde corto y con emojis.";
        systemPromptText = `${promptCliente}\n\n=== BASE DE DATOS (SISTEMA RAG) ===\n${contextoInventario}\nRegla RAG: Basa tus respuestas de inventario SOLO en la información de la base de datos entregada arriba.`;
    }

    const formattedMessages = [
        { role: 'system' as const, content: systemPromptText },
        { role: 'user' as const, content: textoCliente }
    ];

    const providers = [
        {
            name: 'Groq 🚀 (Plan A)',
            enabled: !!groqClient,
            timeout: 3500,
            execute: async () => {
                const completion = await groqClient!.chat.completions.create({
                    model: 'openai/gpt-oss-20b', // ⬅️ Restaurado a tu versión
                    messages: formattedMessages,
                    temperature: 0.3,
                });
                return completion.choices[0]?.message?.content || '';
            }
        },
        {
            name: 'SambaNova ⚡ (Plan B)',
            enabled: !!sambanovaClient,
            timeout: 3500,
            execute: async () => {
                const completion = await sambanovaClient!.chat.completions.create({
                    model: 'Meta-Llama-3.1-8B-Instruct',
                    messages: formattedMessages,
                    temperature: 0.3,
                });
                return completion.choices[0]?.message?.content || '';
            }
        },
        {
            name: 'Mistral 🔥 (Plan C)',
            enabled: !!mistralClient,
            timeout: 3500,
            execute: async () => {
                const completion = await mistralClient!.chat.completions.create({
                    model: 'mistral-small-latest',
                    messages: formattedMessages,
                    temperature: 0.3,
                });
                return completion.choices[0]?.message?.content || '';
            }
        },
        {
            name: 'OpenRouter 🃏 (Plan D)',
            enabled: !!openRouterClient,
            timeout: 3500,
            execute: async () => {
                const completion = await openRouterClient!.chat.completions.create({
                    model: 'openrouter/free',
                    messages: formattedMessages,
                    temperature: 0.3,
                });
                return completion.choices[0]?.message?.content || '';
            }
        },
        {
            name: 'Gemini Premium 🛡️ (Escudo Final)',
            enabled: !!geminiGenAI,
            timeout: 4500,
            execute: async () => {
                const model = geminiGenAI!.getGenerativeModel({
                    model: 'gemini-2.5-flash', // ⬅️ Restaurado a tu versión
                    systemInstruction: systemPromptText,
                    generationConfig: { temperature: 0.45, maxOutputTokens: 280 }
                });
                const result = await model.generateContent(textoCliente);
                return result.response.text();
            }
        }
    ];

    let lastError: unknown;
    for (const provider of providers) {
        if (!provider.enabled) continue;
        try {
            const reply = await withTimeout(provider.execute(), provider.timeout, provider.name);
            if (!reply || !reply.trim()) throw new Error(`${provider.name} devolvió respuesta vacía`);
            
            console.log(`✅ [WEBHOOK] Respondido exitosamente con: ${provider.name}`);
            return reply;
        } catch (error) {
            console.warn(`🔴 ERROR EXACTO DE ${provider.name}:`, error); 
            console.warn(`⚠️ [WEBHOOK] ${provider.name} falló. Activando relevo...`);
            await sendProviderAlert(provider.name, error);
            lastError = error;
        }
    }

    console.error('🔴 CRÍTICO: Todos los motores de la cascada fallaron en el Webhook.', lastError);
    return "⚠️ Estoy recibiendo demasiados mensajes en este momento. Por favor, escríbeme en un par de minutos.";
}

// ==========================================
// 📱 CONEXIÓN CON META (WHATSAPP)
// ==========================================
async function enviarMensajePorWhatsApp(destinoTelefono: string, mensaje: string, phoneId: string, dynamicToken: string): Promise<string | null> {
  if (!dynamicToken || !phoneId) throw new Error('Credenciales de WhatsApp no configuradas para esta tienda.');

  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
  
  const payload: any = {
    messaging_product: 'whatsapp',
    to: destinoTelefono,
    type: 'text',
    text: { body: mensaje }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${dynamicToken}` },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Error API WhatsApp: ${JSON.stringify(data)}`);
    }
    
    console.log(`✅ Mensaje enviado exitosamente a ${destinoTelefono}`);
    
    return data.messages?.[0]?.id || null;
  } catch (error) {
    console.error('❌ Error enviando a Meta:', error);
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('hub.mode') === 'subscribe' && searchParams.get('hub.verify_token') === VERIFY_TOKEN) {
    return new NextResponse(searchParams.get('hub.challenge'), { status: 200 });
  }
  return new NextResponse('Acceso denegado', { status: 403 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body?.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;

          // ====================================================
          // 📡 PARTE 1: CAPTURAR EL "DOBLE CHECK AZUL" (STATUSES)
          // ====================================================
          if (value?.statuses?.length) {
            for (const statusObj of value.statuses) {
              const metaMessageId = statusObj.id;
              const currentStatus = statusObj.status; 
              
              try {
                await prisma.message.update({
                  where: { metaMessageId: metaMessageId },
                  data: { status: currentStatus }
                });
              } catch (e) {
                // Ignoramos si el mensaje no existe en la DB
              }
            }
          }

          // ====================================================
          // 💬 PARTE 2: CAPTURAR Y RESPONDER MENSAJES ENTRANTES
          // ====================================================
          if (value?.messages?.length) {
            const mensajeEntrante = value.messages[0];
            const userPhone = mensajeEntrante.from;
            const textoCliente = mensajeEntrante.text?.body ?? '';
            const phoneIdDestino = value.metadata?.phone_number_id || ""; 
            const msgIdEntrante = mensajeEntrante.id;
            const userName = value.contacts?.[0]?.profile?.name || 'Cliente';

            const response = new NextResponse(null, { status: 200 });

            // Ejecutamos en segundo plano para no bloquear a Meta
            void (async () => {
              try {
                let tiendaRecord = null;
                let dynamicToken = process.env.WHATSAPP_TOKEN || ""; 
                let conversationId: string | null = null;

                // 🚀 Búsqueda de Tienda y Memoria CRM
                if (phoneIdDestino !== UPWAY_PHONE_ID) {
                  tiendaRecord = await prisma.tienda.findFirst({
                    where: { metaPhoneNumberId: phoneIdDestino },
                    include: { productos: true } 
                  });

                  if (!tiendaRecord) {
                    console.warn(`⚠️ Mensaje ignorado: No hay tienda vinculada al número ${phoneIdDestino}`);
                    return; 
                  }
                  dynamicToken = tiendaRecord.metaAccessToken || "";

                  // 🗄️ GUARDAMOS LA CONVERSACIÓN Y EL MENSAJE DEL CLIENTE
                  const conversation = await prisma.conversation.upsert({
                    where: {
                      tiendaId_clientPhone: { tiendaId: tiendaRecord.id, clientPhone: userPhone }
                    },
                    update: { updatedAt: new Date(), clientName: userName },
                    create: {
                      tiendaId: tiendaRecord.id,
                      clientPhone: userPhone,
                      clientName: userName
                    }
                  });
                  
                  conversationId = conversation.id;

                  await prisma.message.create({
                    data: {
                      conversationId: conversation.id,
                      metaMessageId: msgIdEntrante,
                      senderRole: 'USER',
                      content: textoCliente,
                      status: 'delivered' 
                    }
                  });

                  // 🛑 BOTÓN DE PAUSA: Si está en falso, nos callamos y cortamos la ejecución.
                  if (!tiendaRecord.isAiActive) {
                    console.log(`🛑 [MODO HUMANO ACTIVO] Mensaje de ${userPhone} guardado en Inbox. IA silenciada.`);
                    return; 
                  }
                }

                // 🤖 GENERACIÓN DE IA (SI ESTÁ ACTIVA)
                const respuesta = await generarRespuesta(textoCliente, phoneIdDestino, tiendaRecord);
                
                // 🔥==============================================🔥
                // 🚨 HUMAN HANDOFF INTELIGENTE: PAUSA Y NOTIFICACIÓN
                // 🔥==============================================🔥
                if (respuesta.includes('[TRANSFERIR_HUMANO]')) {
                  console.log('🚨 SOLICITUD DE HUMANO DETECTADA. Apagando IA...');
                  
                  if (tiendaRecord && tiendaRecord.id) {
                    // A. Apagamos a la IA en la base de datos para esta tienda
                    await prisma.tienda.update({
                      where: { id: tiendaRecord.id },
                      data: { isAiActive: false }
                    });
                  }

                  // B. Le avisamos al cliente para darle tranquilidad
                  const msgCliente = "Comprendo perfectamente. Te voy a transferir con uno de nuestros asesores humanos. Por favor, dame un momento.";
                  await enviarMensajePorWhatsApp(userPhone, msgCliente, phoneIdDestino, dynamicToken);

                  // C. 🚨 ALERTA AL CELULAR DE ADMINISTRACIÓN (PON TU NÚMERO AQUÍ)
                  const numeroAdmin = "573116778098"; // <--- ⚠️ CAMBIA ESTO POR TU CELULAR REAL CON EL CÓDIGO 57 (EJ. 573100000000)
                  const linkPanel = "https://upway.business/dashboard/inbox";
                  const msgAdmin = `🚨 *ALERTA INWORKER*\n\nEl cliente ${userName || userPhone} requiere asistencia humana.\nLa IA se ha pausado automáticamente.\n\nAtiende el chat aquí:\n${linkPanel}`;
                  
                  await enviarMensajePorWhatsApp(numeroAdmin, msgAdmin, phoneIdDestino, dynamicToken);

                  // D. Guardamos el registro del apagado en el chat
                  if (conversationId) {
                    await prisma.message.create({
                      data: { 
                        conversationId, 
                        metaMessageId: "handoff_" + Date.now(), 
                        senderRole: 'AI', 
                        content: msgCliente, 
                        status: 'sent' 
                      }
                    });
                  }
                  
                  // Detenemos la ejecución para que no envíe '[TRANSFERIR_HUMANO]' a Meta
                  return; 
                }
                
                // 📤 ENVÍO A META Y OBTENCIÓN DEL ID (Si no es transferencia)
                const outMessageId = await enviarMensajePorWhatsApp(userPhone, respuesta, phoneIdDestino, dynamicToken);
                
                // 🗄️ GUARDAMOS LA RESPUESTA DE LA IA
                if (conversationId && outMessageId) {
                  await prisma.message.create({
                    data: {
                      conversationId: conversationId,
                      metaMessageId: outMessageId,
                      senderRole: 'AI',
                      content: respuesta,
                      status: 'sent'
                    }
                  });
                }
                
              } catch (error) {
                console.error('Fallo general en la respuesta del bot.', error);
              }
            })();

            return response;
          }
        }
      }
      return new NextResponse(null, { status: 200 });
    }
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Error en el Webhook:', error);
    return new NextResponse('Error Interno', { status: 500 });
  }
}