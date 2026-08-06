import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 💎 LLAVE PREMIUM EXCLUSIVA PARA SOPHIE
const geminiApiKey = process.env.GEMINI_PREMIUM_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

// 🔥 PROMPT AFILADO, ANTIRREPETICIÓN Y OPTIMIZADO PARA CONVERSIÓN
const AGENTE_SUPREMO_PROMPT = `Rol: Eres Sophie, representante comercial prémium y Empleada Digital de Upway (BARAKAH TECH HUB SAS). Tu estilo es elegante, sumamente persuasivo, directo y corporativo.

DIRECTRICES DE CONVERSIÓN (CERO REPETICIÓN):
1. Sé concisa y letal. Ve directo al grano. No des explicaciones aburridas ni repitas lo que el usuario ya sabe.
2. Diagnostica rápido: pregunta qué proceso quieren automatizar en su negocio (pymes, restaurantes, ferreterías).
3. Conecta las necesidades con los planes de inmediato:
   - Plan Emprendedor ($149.900 COP/mes): Texto y catálogo básico.
   - Plan Negocio ($299.900 COP/mes - El estrella): Desbloquea IA multimodal, notas de voz, imágenes y RAG de inventario. (Si mencionan audios o pagos, recétalo de una vez).
   - Plan PRO ($499.900 COP/mes): Alto volumen y reportes avanzados.
4. Manejo de objeciones: Si mencionan Zendesk/Callbell, diles que cobran por asesor humano; Upway es un empleado digital con tarifa plana. Si mencionan ManyChat, diles que son bots rígidos del pasado; tú piensas y cierras ventas.

🚨 REGLA SUPREMA DE DIRECCIONAMIENTO AL SIMULADOR:
Si el cliente dice que quiere "probar", "ver demo", "simular" o "cómo funciona":
- CORTA cualquier explicación.
- No hagas más preguntas.
- Tu respuesta DEBE incluir exactamente este texto al final: "¡Claro que sí! La mejor forma de verlo es en acción. Entra a nuestro panel gratis ahora mismo y mira cómo respondería tu agente en tiempo real. [BOTON_REGISTRO]"`;

export async function POST(req: NextRequest) {
  try {
    const { messages, audioUsuario } = await req.json();
    
    if (!genAI) throw new Error('Falta GEMINI_PREMIUM_API_KEY en el .env');

    // 🚀 Usamos gemini-2.5-flash (o gemini-1.5-pro) con parámetros de control de costos
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash', 
      systemInstruction: AGENTE_SUPREMO_PROMPT,
      generationConfig: {
        temperature: 0.6,      // Más precisa, menos divagación y repetición
        maxOutputTokens: 400,  // 💰 Límite estricto de tokens para ahorrar dinero por respuesta
      }
    });

    // Filtrar el rol 'system' del historial del cliente
    const chatMessages = messages.filter((m: any) => m.role !== 'system');

    let formattedContents = chatMessages.map((m: any) => ({
      role: m.role === 'bot' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // 🎧 SI HAY AUDIO, LO PROCESAMOS NATIVAMENTE
    if (audioUsuario) {
      console.log("🎤 Audio detectado en Sophie (Modo Ahorro y Alta Conversión)...");
      const base64Data = audioUsuario.split(',')[1] || audioUsuario;
      
      if (formattedContents.length > 0 && formattedContents[formattedContents.length - 1].role === 'user') {
        formattedContents[formattedContents.length - 1] = {
          role: 'user',
          parts: [
            { text: "El cliente envió esta nota de voz. Escúchala y responde con tu estilo comercial afilado y directo:" },
            { inlineData: { data: base64Data, mimeType: "audio/webm" } }
          ]
        };
      }
    }

    const result = await model.generateContent({ contents: formattedContents });
    const botReply = result.response.text();

    console.log(`✅ Sophie respondió con éxito bajo control de tokens`);
    return NextResponse.json({ reply: botReply, provider: 'Gemini Premium 💎' });

  } catch (error: any) {
    console.error('Error crítico en Sophie:', error);
    return NextResponse.json({ reply: `⚠️ Error temporal en el sistema de Sophie. ¡Inténtalo de nuevo!` }, { status: 500 });
  }
}