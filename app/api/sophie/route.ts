import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 💎 LLAVE PREMIUM EXCLUSIVA PARA SOPHIE
const geminiApiKey = process.env.GEMINI_PREMIUM_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

// 🔥 EL PROMPT ORIGINAL, COMPLETO Y LETAL DE VENTAS
const AGENTE_SUPREMO_PROMPT = `Rol: Eres un cerrador de ventas de alto nivel, persuasivo, profesional y educado. Trabajas y te identificas orgullosamente como un "Empleado Digital de Upway". 

Objetivo Principal: Tu misión es asistir a los clientes en el chat, hacer preguntas estratégicas para diagnosticar el tamaño de su operación y recetar el plan exacto que necesitan.

ESTRATEGIA DE VENTAS Y PLANES (SaaS):
No ofrezcas todo de golpe. Pregunta primero qué necesitan automatizar. Usa estos planes para cerrar la venta:
1. Plan Emprendedor ($149.900 COP/mes): El básico. SOLO incluye atención por texto, toma de pedidos automatizada, catálogo estático y personalidad. (No incluye audios ni imágenes).
2. Plan Negocio ($299.900 COP/mes - Nuestro plan estrella y más vendido): Desbloquea la IA multimodal. Incluye procesamiento de Notas de Voz, lectura de Imágenes y Recibos, PDFs, inventario en tiempo real y confirmación de pagos. (Si el cliente menciona audios o pagos, recomiéndale este de inmediato).
3. Plan PRO ($499.900 COP/mes): Para alto volumen. Suma dashboards, reportes avanzados, análisis de tendencias y máxima concurrencia.

🚨 REGLA SUPREMA DE DIRECCIONAMIENTO (DEMO Y PRUEBAS):
Si el usuario menciona palabras como: "probar", "simulador", "demo", "cómo se vería", "crear cuenta" o "ver cómo funciona":
1. CORTA INMEDIATAMENTE CUALQUIER EXPLICACIÓN LARGA.
2. NO le hagas preguntas de calificación.
3. TU ÚNICA RESPUESTA DEBE SER enviarlo al panel usando la palabra clave.
4. Dile exactamente esto: "¡Claro que sí! La mejor forma de verlo es en acción. Entra a nuestro panel gratis ahora mismo y mira cómo respondería tu agente en tiempo real. [BOTON_REGISTRO]"

Cierre y Pagos:
Para cerrar la venta o agendar una demo, indica que el proceso se realiza directamente en nuestro panel, aceptando pagos seguros vía Bold, Nequi, Bancolombia o Wompi.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, audioUsuario } = await req.json();
    
    if (!genAI) throw new Error('Falta GEMINI_PREMIUM_API_KEY en el .env');

    // Usando Gemini 2.0 Pro (Modelo de pago, sin 404s)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-pro', 
      systemInstruction: AGENTE_SUPREMO_PROMPT 
    });

    let formattedContents = messages.map((m: any) => ({
      role: m.role === 'bot' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // 🎧 SI HAY AUDIO, GEMINI PREMIUM LO ESCUCHA NATIVAMENTE
    if (audioUsuario) {
      console.log("🎤 Audio detectado en Sophie. Procesando nativamente con Gemini Premium...");
      const base64Data = audioUsuario.split(',')[1] || audioUsuario;
      
      formattedContents[formattedContents.length - 1] = {
        role: 'user',
        parts: [
          { text: "El cliente ha enviado esta nota de voz. Escúchala con atención y responde de acuerdo a tu rol:" },
          { inlineData: { data: base64Data, mimeType: "audio/webm" } }
        ]
      };
    }

    const result = await model.generateContent({ contents: formattedContents });
    const botReply = result.response.text();

    console.log(`✅ Sophie respondió con éxito (Gemini Premium)`);
    return NextResponse.json({ reply: botReply, provider: 'Gemini Premium 💎' });

  } catch (error: any) {
    console.error('Error crítico en Sophie:', error);
    return NextResponse.json({ reply: "Hubo un error de conexión con mis servidores. ¡Inténtalo de nuevo!" }, { status: 500 });
  }
}