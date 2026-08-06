import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai'; 
import Groq from 'groq-sdk'; 
import { prisma } from '@/lib/prisma';

const VERIFY_TOKEN = 'upway_webhook_secreto';
const UPWAY_PHONE_ID = '1172769935927318'; // 👑 EL NÚMERO VIP DE UPWAY

const kimiApiKey = process.env.KIMI_API_KEY;
const kimiApiUrl = process.env.KIMI_API_URL || 'https://api.moonshot.ai/v1';
const kimiModelName = process.env.KIMI_MODEL || 'moonshot-v1-8k';
const kimiClient = kimiApiKey ? new OpenAI({ apiKey: kimiApiKey, baseURL: kimiApiUrl }) : null;

// ==========================================
// INTERFACES DE TYPESCRIPT
// ==========================================
interface Producto {
  nombre: string;
  categoria?: string;
  precio: number;
}

// ==========================================
// EL MOTOR RAG: Búsqueda súper ligera en memoria
// ==========================================
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

// ==========================================
// GENERACIÓN DE RESPUESTA (EL ENRUTADOR MAESTRO)
// ==========================================
async function generarRespuesta(textoCliente: string, phoneId: string) {
    let systemPromptText = "";

    // ==========================================================
    // 🚀 BIFURCACIÓN ESTRATÉGICA SAAS: ¿ES UPWAY O ES UN CLIENTE?
    // ==========================================================
    
    if (phoneId === UPWAY_PHONE_ID) {
        // ==========================================================
        // 👑 RUTA VIP: EL NÚMERO OFICIAL DE UPWAY (SOPHIE)
        // ==========================================================
        console.log("👑 Entró mensaje al canal de Upway. Activando a Sophie...");
        
        const promptSophie = `Rol: Eres Sophie, la asistente virtual y cerradora de ventas estrella de Upway. Tu tono es persuasivo, tecnológico, amigable y muy directo. Tus respuestas deben ser cortas (ideales para WhatsApp) y usar emojis.
        
        Objetivo Principal: Tu misión es diagnosticar el tamaño del negocio del cliente y recetar el plan exacto que necesitan.
        
        Planes y Precios:
        🔵 PLAN EMPRENDEDOR ($149.900 COP/mes): Atención por texto. Hasta 500 productos.
        🔵 PLAN NEGOCIO ($299.900 COP/mes) - EL MÁS POPULAR: Capacidad de procesar audios. Toma de pedidos automatizada. 2.000 productos.
        🟣 PLAN EMPRESA ($499.900 COP/mes): Lectura de PDFs. 10.000 productos.
        
        REGLA NINJA: NUNCA ofrezcas agendar llamadas con humanos. Eres un SaaS de autoservicio.
        CALL TO ACTION: Tu cierre de ventas siempre debe ser invitarlos a crear su cuenta en https://upway.business. Aceptamos Nequi, Bancolombia, Bold o Wompi.`;
        
        systemPromptText = promptSophie;

    } else {
        // ==========================================================
        // 🏢 RUTA MULTITENANT: NÚMERO DE UN CLIENTE (FERRETERÍA, ETC)
        // ==========================================================
        console.log(`🏢 Buscando base de datos del cliente para el número: ${phoneId}`);
        
        const tienda = await prisma.tienda.findFirst({
            where: { metaPhoneNumberId: phoneId },
            include: { productos: true } 
        });

        if (!tienda) {
            console.warn(`⚠️ Mensaje a un número no registrado en BD: ${phoneId}`);
            return "Hola. Este número aún no tiene un agente de Upway activo. Regístrate en https://upway.business para activar el tuyo.";
        }

        const inventarioCompleto: Producto[] = tienda.productos.map((p: { nombre?: unknown; categoria?: unknown; precio?: unknown }) => ({
            nombre: String(p.nombre),
            categoria: p.categoria ? String(p.categoria) : "General",
            precio: Number(p.precio)
        }));

        const productosRelevantes = buscarEnInventarioLocal(textoCliente, inventarioCompleto);
        let contextoInventario = "No hay stock directo en el inventario para esta consulta.";
        
        if (productosRelevantes.length > 0) {
           contextoInventario = `PRODUCTOS ENCONTRADOS:\n${productosRelevantes.map(p => `- ${p.nombre} - Precio: $${p.precio}`).join('\n')}`;
        }

        const promptCliente = tienda.systemPrompt || "Eres un asistente de ventas. Responde corto y con emojis.";
        systemPromptText = `${promptCliente}\n\n=== BASE DE DATOS (SISTEMA RAG) ===\n${contextoInventario}\nRegla RAG: Basa tus respuestas de inventario SOLO en la información de la base de datos entregada arriba.`;
    }

    // =================================================================
    // EJECUCIÓN DE IA SEGÚN EL ENRUTAMIENTO
    // =================================================================
    if (phoneId === UPWAY_PHONE_ID) {
        // 👑 RUTA VIP: UPWAY (Usando tu modelo Premium para ventas)
        console.log("🧠 Generando respuesta comercial (Gemini Premium)...");
        const apiKey = process.env.GEMINI_PREMIUM_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('Falta llave de Gemini Premium en el .env');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash', 
          systemInstruction: systemPromptText,
          generationConfig: {
            temperature: 0.45,
            maxOutputTokens: 280,
          }
        });

        const generateWithGemini = async () => {
          const result = await model.generateContent(textoCliente);
          return result.response.text();
        };

        const generateWithKimiFallback = async () => {
          if (!kimiClient) throw new Error('Falta KIMI_API_KEY para fallback de Upway');
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
          return await generateWithGemini();
        } catch (geminiError) {
          console.warn('⚠️ Gemini Premium falló para Upway. Intentando fallback con Kimi...', geminiError);
          return await generateWithKimiFallback();
        }

    } else {
        // 🤝 RUTA CLIENTES: COSTO CERO (GEMINI FREE -> GROQ)
        console.log(`🤝 Generando respuesta para cliente de tienda. Usando RUTA GRATUITA...`);
        try {
            const freeApiKey = process.env.GEMINI_FREE_API_KEY;
            if (!freeApiKey) throw new Error('Falta GEMINI_FREE_API_KEY');

            const genAIFree = new GoogleGenerativeAI(freeApiKey);
            const modelFree = genAIFree.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: systemPromptText });
            
            const result = await modelFree.generateContent(textoCliente);
            console.log("✅ Respondido con Gemini Free (Cliente)");
            return result.response.text();

        } catch {
            console.warn("⚠️ Gemini Free falló. Activando relevo Groq (Llama 3)...");
            
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
            console.log("✅ Groq salvó la venta del cliente");
            return chatCompletion.choices[0]?.message?.content || "No pude generar respuesta.";
        }
    }
}

// ==========================================
// ENVÍO DE MENSAJES META
// ==========================================
async function enviarMensajePorWhatsApp(destino: string, mensaje: string, phoneId: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = phoneId || process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) throw new Error('Credenciales de WhatsApp no configuradas.');

  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: destino, type: 'text', text: { body: mensaje } }),
    });

    if (!response.ok) throw new Error(`Error API WhatsApp: ${response.status}`);
    console.log(`✅ Mensaje enviado exitosamente a ${destino}`);
  } catch (error) {
    console.error('❌ Error enviando a Meta:', error);
  }
}

// ==========================================
// 1. VERIFICACIÓN DE META (GET)
// ==========================================
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('hub.mode') === 'subscribe' && searchParams.get('hub.verify_token') === VERIFY_TOKEN) {
    return new NextResponse(searchParams.get('hub.challenge'), { status: 200 });
  }
  return new NextResponse('Acceso denegado', { status: 403 });
}

// ==========================================
// 2. RECEPCIÓN DE MENSAJES (POST)
// ==========================================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body?.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0]?.value;

      if (changes?.messages?.length) {
        const mensajeEntrante = changes.messages[0];
        const numeroCliente = mensajeEntrante.from;
        const textoCliente = mensajeEntrante.text?.body ?? '';
        
        const phoneIdDestino = changes.metadata?.phone_number_id || ""; 

        // 🛡️ BARRERA ANTIBUCLES
        const response = new NextResponse(null, { status: 200 });

        void (async () => {
          try {
            const respuesta = await generarRespuesta(textoCliente, phoneIdDestino);
            await enviarMensajePorWhatsApp(numeroCliente, respuesta, phoneIdDestino);
          } catch (error) {
            console.error('Fallo general en la respuesta del bot.', error);
          }
        })();

        return response;
      }
    }
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Error en el Webhook:', error);
    return new NextResponse('Error Interno', { status: 500 });
  }
}