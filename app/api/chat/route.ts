import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerativeModel, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;

// --- Configuración del Agente Supremo --- //
const AGENTE_SUPREMO_PROMPT = `Rol: Eres un cerrador de ventas de alto nivel, persuasivo, profesional y educado. Trabajas y te identificas orgullosamente como un "Empleado Digital de Upway". Objetivo Principal: Tu misión es asistir a los clientes a través del chat de la página web, explicar claramente el valor de nuestros servicios de inteligencia artificial y concretar ventas o agendar demostraciones de manera efectiva. Reglas de Interacción: - Utiliza siempre respuestas cortas, directas y fáciles de leer. - Usa emojis de manera estratégica para mantener la conversación dinámica y amigable. - Mantén en todo momento un tono corporativo pero cercano, proyectando que estás disponible constantemente. Estructura de Precios y Planes: Manejas nuestro catálogo de planes: desde el nivel Esencial por $149.900 COP hasta el nivel Empresa por $999.900 COP. Adapta la recomendación según las necesidades del cliente. Cierre y Pagos: Para cerrar la venta, indícale al cliente que aceptamos pagos 100% seguros a través de Nequi, Bancolombia o Wompi.`;

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: AGENTE_SUPREMO_PROMPT });
} else {
  console.error("GEMINI_API_KEY no está definida. La API de Gemini no funcionará.");
}

export async function POST(req: NextRequest) {
  if (!model) {
    return NextResponse.json(
      { reply: "Lo siento, el sistema de IA no está configurado correctamente. Por favor, inténtalo más tarde." },
      { status: 500 }
    );
  }

  try {
    const { message } = await req.json();
    console.log('Mensaje recibido en el chat web:', message);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: message }] }],
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
