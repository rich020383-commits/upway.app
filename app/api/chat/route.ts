import { NextRequest, NextResponse } from 'next/server';
import * as GenerativeAI from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;

// --- Configuración del Agente Supremo --- //
const AGENTE_SUPREMO_PROMPT = `Rol: Eres un cerrador de ventas de alto nivel, persuasivo, profesional y educado. Trabajas y te identificas orgullosamente como un "Empleado Digital de Upway". Objetivo Principal: Tu misión es asistir a los clientes a través del chat de la página web, explicar claramente el valor de nuestros servicios de inteligencia artificial y concretar ventas o agendar demostraciones de manera efectiva. Reglas de Interacción: - Utiliza siempre respuestas cortas, directas y fáciles de leer. - Usa emojis de manera estratégica para mantener la conversación dinámica y amigable. - Mantén en todo momento un tono corporativo pero cercano, proyectando que estás disponible constantemente. Estructura de Precios y Planes: Manejas nuestro catálogo de planes: desde el nivel Esencial por $149.900 COP hasta el nivel Empresa por $999.900 COP. Adapta la recomendación según las necesidades del cliente. Cierre y Pagos: Para cerrar la venta, indícale al cliente que aceptamos pagos 100% seguros a través de Nequi, Bancolombia o Wompi.`;

const safetySettings = [
  {
    category: GenerativeAI.HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: GenerativeAI.HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: GenerativeAI.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: GenerativeAI.HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: GenerativeAI.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: GenerativeAI.HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: GenerativeAI.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: GenerativeAI.HarmBlockThreshold.BLOCK_NONE,
  },
];

let model: GenerativeAI.GenerativeModel | null = null;

if (!API_KEY) {
  console.error("GEMINI_API_KEY no está definida. La API de Gemini no funcionará.");
} else {
  const genAI = new GenerativeAI.GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: AGENTE_SUPREMO_PROMPT });
}

export async function POST(req: NextRequest) {
  if (!model) {
    return NextResponse.json(
      { reply: "Lo siento, el sistema de IA no está configurado correctamente. Por favor, inténtalo más tarde." },
      { status: 500 }
    );
  }

  try {
    const { messages } = await req.json(); // 🔥 ACTUALIZADO: Recibimos el historial completo
    console.log('Historial de mensajes recibido en el chat web:', messages);

    // Formatear el historial para Gemini
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'bot' ? 'model' : m.role, // Gemini espera 'model' en lugar de 'bot'
      parts: [{ text: m.content }],
    }));

    const result = await model.generateContent({
      contents: contents, // 🔥 ACTUALIZADO: Enviamos el historial completo
      safetySettings,
    });
    const response = result.response;
    const botReply = response.text();

    return NextResponse.json({ reply: botReply });

  } catch (error) {
    console.error('Error en el endpoint /api/chat con Gemini:', error);
    return NextResponse.json(
      { reply: "¡Hola! Soy tu Empleado Digital de Upway y estoy siempre disponible para ti. Parece que hay un pequeño problema en este momento al contactar a la IA. Por favor, intenta enviarme tu mensaje de nuevo en unos instantes. ¡Gracias por tu paciencia! 😉" },
      { status: 500 }
    );
  }
}

