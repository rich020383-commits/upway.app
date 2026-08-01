import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai'; 
import Groq from 'groq-sdk'; 
import { prisma } from '@/lib/prisma'; // Conexión corregida

const VERIFY_TOKEN = 'upway_webhook_secreto';
const UPWAY_PHONE_ID = '1172769935927318'; // 👑 EL NÚMERO VIP DE UPWAY

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
    // 1. CONEXIÓN A PRISMA: Buscar la tienda y su inventario
    const tienda = await prisma.tienda.findFirst({
        where: { phone_number_id: phoneId },
        include: { productos: true } 
    });

    if (!tienda) {
        console.warn(`⚠️ Mensaje a un número no registrado en BD: ${phoneId}`);
        return "Hola. Este número aún no tiene un agente de Upway activo. Regístrate en https://upway.business";
    }

    // 2. FORMATEAR EL INVENTARIO PARA EL RAG
    const inventarioCompleto: Producto[] = tienda.productos.map((p: any) => ({
        nombre: String(p.nombre),
        categoria: p.categoria ? String(p.categoria) : "General",
        precio: Number(p.precio)
    }));

    // 3. EJECUTAR EL BUSCADOR RAG
    const productosRelevantes = buscarEnInventarioLocal(textoCliente, inventarioCompleto);
    let contextoInventario = "No hay stock directo en el inventario para esta consulta.";
    if (productosRelevantes.length > 0) {
       contextoInventario = `PRODUCTOS ENCONTRADOS:\n${productosRelevantes.map(p => `- ${p.nombre} - Precio: $${p.precio}`).join('\n')}`;
    }

    // 4. OBTENER EL PROMPT DINÁMICO (LA REGLA NINJA O EL DEL CLIENTE)
    let promptMaestro = "";
    
    if (phoneId === UPWAY_PHONE_ID) {
        // 👑 RUTA VIP: Regla Ninja estricta para Sophie vendiendo tu SaaS
        promptMaestro = `Eres Sophie, la asistente virtual experta en ventas y automatización de Upway. Tu tono es persuasivo, tecnológico, amigable y muy directo. Tus respuestas deben ser cortas (ideales para WhatsApp) y usar emojis.
        
        REGLA DE ORO (NINJA): NUNCA ofrezcas agendar llamadas, reuniones o demos con un humano. Eres un SaaS de autoservicio.
        
        TU OBJETIVO PRINCIPAL: Tu misión es guiar al cliente a la acción inmediata. Convéncelos de registrarse en la plataforma por sí mismos.
        
        CALL TO ACTION (CTA): Tu cierre de ventas siempre debe ser invitarlos a crear su cuenta en https://upway.business/registro para que entren al panel de control y prueben el simulador en vivo con los datos de su propio negocio. Haz que suene fácil, rápido y automático.`;
    } else {
        // 🤝 RUTA CLIENTES: Prompt personalizado que el cliente configuró en su panel
        promptMaestro = tienda.systemPrompt || "Eres un asistente de ventas amigable. Vendes productos del inventario y asistes al cliente. Responde corto y con emojis.";
    }
    
    const systemPromptText = `${promptMaestro}\n\n=== BASE DE DATOS (SISTEMA RAG) ===\n${contextoInventario}\nRegla RAG: Basa tus respuestas de inventario SOLO en la información de la base de datos entregada arriba.`;

    // =================================================================
    // LA MAGIA DEL NEGOCIO: ENRUTAMIENTO DE COSTOS
    // =================================================================
    if (phoneId === UPWAY_PHONE_ID) {
        // 👑 RUTA VIP: UPWAY (GEMINI PREMIUM)
        console.log("👑 Entró mensaje a Upway. Usando GEMINI PREMIUM...");
        const apiKey = process.env.GEMINI_PREMIUM_API_KEY;
        if (!apiKey) throw new Error('Falta GEMINI_PREMIUM_API_KEY');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction: systemPromptText });
        
        const result = await model.generateContent(textoCliente);
        return result.response.text();

    } else {
        // 🤝 RUTA CLIENTES: COSTO CERO (GEMINI FREE -> GROQ)
        console.log(`🤝 Entró mensaje a cliente (${phoneId}). Usando RUTA GRATUITA...`);
        try {
            const freeApiKey = process.env.GEMINI_FREE_API_KEY;
            if (!freeApiKey) throw new Error('Falta GEMINI_FREE_API_KEY');

            const genAIFree = new GoogleGenerativeAI(freeApiKey);
            const modelFree = genAIFree.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction: systemPromptText });
            
            const result = await modelFree.generateContent(textoCliente);
            console.log("✅ Respondido con Gemini Free");
            return result.response.text();

        } catch (errorGemini) {
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
        
        // Corregido: Evitar que sea 'undefined' si Meta no lo envía
        const phoneIdDestino = changes.metadata?.phone_number_id || ""; 

        // 🛡️ BARRERA ANTIBUCLES: Respondemos OK a Meta inmediatamente
        const response = new NextResponse(null, { status: 200 });

        void (async () => {
          try {
            let respuesta = await generarRespuesta(textoCliente, phoneIdDestino);
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