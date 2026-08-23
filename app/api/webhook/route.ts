import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai'; 
import Groq from 'groq-sdk'; 
import { prisma } from '@/lib/prisma';

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'upway_inworker_seguro_2026';
const UPWAY_PHONE_ID = '1172769935927318'; // 👑 EL NÚMERO VIP DE UPWAY
const INWORKER_PHONE_ID = '1334640129724588'; // 🚀 EL NUEVO NÚMERO DE INWORKER (SOPHIE)

const kimiApiKey = process.env.KIMI_API_KEY;
const kimiApiUrl = process.env.KIMI_API_URL || 'https://api.moonshot.ai/v1';
const kimiModelName = process.env.KIMI_MODEL || 'moonshot-v1-8k';
const kimiClient = kimiApiKey ? new OpenAI({ apiKey: kimiApiKey, baseURL: kimiApiUrl }) : null;
const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;

const FAQ_CACHE = new Map<string, string>();

const BASIC_FAQ_LOOKUPS: Array<{
  pattern: RegExp;
  reply: string;
}> = [
  {
    pattern: /\b(hola|buenas|buenos días|buenas tardes|buenas noches|qué tal|hey)\b/i,
    reply: '¡Hola! 👋 Soy el asistente digital de Upway. ¿Quieres conocer los planes o ver cómo funciona el panel en vivo?'
  },
  {
    pattern: /\b(precio|plan|costo|cuesta|valor)\b/i,
    reply: 'Nuestros planes van desde $149.900 COP/mes para texto y catálogo básico, hasta $499.900 COP/mes para automación avanzada, audio y reportes. ¿Quieres que te recomiende el mejor según tu negocio?'
  },
  {
    pattern: /\b(direcci[oó]n|d[oó]nde est[aá]|ubicaci[oó]n)\b/i,
    reply: 'Estamos listos para ayudarte desde nuestro panel de Upway. Para conocer la dirección exacta de la tienda, responde con el nombre del local o el tipo de negocio.'
  },
  {
    pattern: /\b(horario|horarios|abre|abren|atenci[oó]n)\b/i,
    reply: 'Atendemos por WhatsApp y nuestro asistente virtual está disponible 24/7 para responder tus consultas comerciales.'
  },
  {
    pattern: /\b(demo|probar|ver demo|simular|cómo funciona)\b/i,
    reply: '¡Claro que sí! La mejor forma de verlo es en acción. Entra a nuestro panel gratis ahora mismo y mira cómo respondería tu agente en tiempo real. [BOTON_REGISTRO]'
  }
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
  const message = `⚠️ Relevo activado en Upway: ${provider} falló. ${String(error)}`;
  await sendMonitorAlert(message);
};

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

interface Producto {
  nombre: string;
  categoria?: string;
  precio: number;
}

const limpiarTexto = (txt: string) => txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

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

async function generarRespuesta(textoCliente: string, phoneId: string, tiendaRecord: any) {
    let systemPromptText = "";

    // 🚀 AHORA INWORKER Y UPWAY TIENEN LOS MISMOS PRIVILEGIOS Y LA CASCADA COMPLETA
    if (phoneId === UPWAY_PHONE_ID || phoneId === INWORKER_PHONE_ID) {
        console.log(`👑 Canal VIP (${phoneId}). Activando a Sophie con SISTEMA EN CASCADA...`);
        
        const promptSophie = `Rol: Eres Sophie, la asistente virtual y cerradora de ventas estrella de Upway. Tu tono es persuasivo, tecnológico, amigable y muy directo. Tus respuestas deben ser cortas (ideales para WhatsApp) y usar emojis.
        
        Objetivo Principal: Tu misión es diagnosticar el tamaño del negocio del cliente y recetar el plan exacto que necesitan.
        
        Planes y Precios:
        🔵 PLAN EMPRENDEDOR ($149.900 COP/mes): Atención por texto. Hasta 500 productos.
        🔵 PLAN NEGOCIO ($299.900 COP/mes) - EL MÁS POPULAR: Capacidad de procesar audios. Toma de pedidos automatizada. 2.000 productos.
        🟣 PLAN EMPRESA ($499.900 COP/mes): Lectura de PDFs. 10.000 productos.
        
        REGLA NINJA: NUNCA ofrezcas agendar llamadas con humanos. Eres un SaaS de autoservicio.
        CALL TO ACTION: Tu cierre de ventas siempre debe ser invitarlos a crear su cuenta en https://upway.business. Aceptamos Nequi, Bancolombia, Bold o Wompi.`;
        
        systemPromptText = promptSophie;

        const generateWithGeminiPremium = async () => {
            const apiKey = process.env.GEMINI_PREMIUM_API_KEY || process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error('Falta llave de Gemini Premium en el .env');
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ 
                model: 'gemini-2.5-flash', 
                systemInstruction: systemPromptText,
                generationConfig: { temperature: 0.45, maxOutputTokens: 280 }
            });
            const result = await model.generateContent(textoCliente);
            return result.response.text();
        };

        const generateWithGroq = async () => {
            const groqApiKey = process.env.GROQ_API_KEY;
            if (!groqApiKey) throw new Error('Falta GROQ_API_KEY');
            const groqClient = new Groq({ apiKey: groqApiKey });
            const chatCompletion = await groqClient.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPromptText },
                    { role: 'user', content: textoCliente }
                ],
                model: "llama3-8b-8192",
                temperature: 0.45,
            });
            return chatCompletion.choices[0]?.message?.content || "";
        };

        const generateWithKimi = async () => {
            if (!kimiClient) throw new Error('Falta KIMI_API_KEY para fallback');
            const completion = await kimiClient.chat.completions.create({
                model: kimiModelName,
                messages: [
                    { role: 'system', content: systemPromptText },
                    { role: 'user', content: textoCliente }
                ],
                temperature: 0.45,
                max_tokens: 280,
            });
            return completion.choices[0]?.message?.content || '';
        };

        try {
            const result = await withTimeout(generateWithGeminiPremium(), 4000, 'Gemini Premium');
            console.log("✅ [SOPHIE] Respondido con motor principal (Gemini Premium)");
            return result;
        } catch (err1) {
            console.warn("⚠️ [SOPHIE] Gemini Premium falló. Activando relevo Groq (Llama 3)...", err1);
            await sendProviderAlert('Gemini Premium', err1);
            try {
                const groqResult = await withTimeout(generateWithGroq(), 3500, 'Groq Llama 3');
                console.log("✅ [SOPHIE] Groq salvó la conversación");
                return groqResult;
            } catch (err2) {
                console.warn('⚠️ [SOPHIE] Groq falló. Intentando fallback final con Kimi...', err2);
                await sendProviderAlert('Groq', err2);
                try {
                    const kimiResult = await withTimeout(generateWithKimi(), 3500, 'Kimi');
                    console.log('✅ [SOPHIE] Kimi respondió como último respaldo.');
                    return kimiResult;
                } catch (err3) {
                    console.warn('❌ [SOPHIE] Kimi falló. Cascada agotada.', err3);
                    await sendProviderAlert('Kimi', err3);
                    throw err3; 
                }
            }
        }

    } else {
        console.log(`🏢 Usando base de datos del cliente para el número: ${phoneId}`);
        
        const inventarioCompleto: Producto[] = (tiendaRecord?.productos || []).map((p: { nombre?: unknown; categoria?: unknown; precio?: unknown }) => ({
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

        const faqStaticResponse = resolveStaticFaqResponse(textoCliente, tiendaRecord ? { direccion: tiendaRecord.direccion } : undefined);
        if (faqStaticResponse) {
          console.log('🔍 Respuesta rápida desde caché FAQ o reglas estáticas.');
          return faqStaticResponse;
        }

        console.log(`🤝 Generando respuesta para cliente de tienda. Usando RUTA GRATUITA...`);
        const generateWithGeminiFree = async () => {
            const freeApiKey = process.env.GEMINI_FREE_API_KEY;
            if (!freeApiKey) throw new Error('Falta GEMINI_FREE_API_KEY');

            const genAIFree = new GoogleGenerativeAI(freeApiKey);
            const modelFree = genAIFree.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: systemPromptText });
            const result = await modelFree.generateContent(textoCliente);
            return result.response.text();
        };

        const generateWithGeminiPremium = async () => {
            const premiumApiKey = process.env.GEMINI_PREMIUM_API_KEY || process.env.GEMINI_API_KEY;
            if (!premiumApiKey) throw new Error('Falta GEMINI_PREMIUM_API_KEY o GEMINI_API_KEY');

            const genAIPremium = new GoogleGenerativeAI(premiumApiKey);
            const modelPremium = genAIPremium.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: systemPromptText });
            const result = await modelPremium.generateContent(textoCliente);
            return result.response.text();
        };

        const generateWithGroq = async () => {
            const groqApiKey = process.env.GROQ_API_KEY;
            if (!groqApiKey) throw new Error('Falta GROQ_API_KEY');
            const groqClient = new Groq({ apiKey: groqApiKey });
            const chatCompletion = await groqClient.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPromptText },
                    { role: 'user', content: textoCliente }
                ],
                model: "llama3-8b-8192",
                temperature: 0.3,
            });
            return chatCompletion.choices[0]?.message?.content || "No pude generar respuesta.";
        };

        const generateWithKimi = async () => {
            if (!kimiClient) throw new Error('Falta KIMI_API_KEY para fallback gratuito');
            const completion = await kimiClient.chat.completions.create({
                model: kimiModelName,
                messages: [
                    { role: 'system', content: systemPromptText },
                    { role: 'user', content: textoCliente }
                ],
                temperature: 0.3,
                max_tokens: 280,
            });
            return completion.choices[0]?.message?.content || "No pude generar respuesta.";
        };

        try {
            const result = await withTimeout(generateWithGeminiFree(), 3500, 'Gemini Free');
            console.log("✅ Respondido con Gemini Free (Cliente)");
            return result;
        } catch (freeError) {
            console.warn("⚠️ Gemini Free falló. Activando relevo Groq (Llama 3)...", freeError);
            await sendProviderAlert('Gemini Free', freeError);
            try {
                const groqResult = await withTimeout(generateWithGroq(), 3500, 'Groq Llama 3');
                console.log("✅ Groq salvó la venta del cliente");
                return groqResult;
            } catch (groqError) {
                console.warn('⚠️ Groq también falló. Intentando fallback gratuito con Kimi...', groqError);
                await sendProviderAlert('Groq', groqError);
                try {
                    const kimiResult = await withTimeout(generateWithKimi(), 3500, 'Kimi');
                    console.log('✅ Kimi respondió como fallback gratuito.');
                    return kimiResult;
                } catch (kimiError) {
                    console.warn('❌ Kimi también falló. Activando Gemini Premium como respaldo final.', kimiError);
                    await sendProviderAlert('Kimi', kimiError);
                    try {
                        const premiumResult = await withTimeout(generateWithGeminiPremium(), 4000, 'Gemini Premium Fallback');
                        console.log('✅ Gemini Premium pago respondió como respaldo final.');
                        return premiumResult;
                    } catch (premiumError) {
                        console.warn('❌ Gemini Premium también falló en el fallback final.', premiumError);
                        await sendProviderAlert('Gemini Premium', premiumError);
                        throw premiumError;
                    }
                }
            }
        }
    }
}

async function enviarMensajePorWhatsApp(destinoTelefono: string, mensaje: string, phoneId: string, dynamicToken: string) {
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
  } catch (error) {
    console.error('❌ Error enviando a Meta:', error);
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

          if (change.field === 'messages') {
            const value = change.value;
            if (value?.messages?.length) {
              const mensajeEntrante = value.messages[0];
              
              const userPhone = mensajeEntrante.from;
              const textoCliente = mensajeEntrante.text?.body ?? '';
              const phoneIdDestino = value.metadata?.phone_number_id || ""; 

              const response = new NextResponse(null, { status: 200 });

              void (async () => {
                try {
                  let tiendaRecord = null;
                  let dynamicToken = process.env.WHATSAPP_TOKEN || ""; 

                  // 🚀 EXCLUIMOS A INWORKER Y UPWAY DE BUSCAR EN LA BASE DE DATOS
                  if (phoneIdDestino !== UPWAY_PHONE_ID && phoneIdDestino !== INWORKER_PHONE_ID) {
                    tiendaRecord = await prisma.tienda.findFirst({
                      where: { metaPhoneNumberId: phoneIdDestino },
                      include: { productos: true } 
                    });

                    if (!tiendaRecord) {
                      console.warn(`⚠️ Mensaje ignorado: No hay tienda vinculada al número ${phoneIdDestino}`);
                      return; 
                    }
                    dynamicToken = tiendaRecord.metaAccessToken || "";
                  }

                  const respuesta = await generarRespuesta(textoCliente, phoneIdDestino, tiendaRecord);
                  await enviarMensajePorWhatsApp(userPhone, respuesta, phoneIdDestino, dynamicToken);
                  
                } catch (error) {
                  console.error('Fallo general en la respuesta del bot.', error);
                }
              })();

              return response;
            }
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