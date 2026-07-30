import { NextRequest, NextResponse } from 'next/server';
import * as GenerativeAI from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;

// --- Configuración del Agente Supremo --- //
const AGENTE_SUPREMO_PROMPT = `Rol: Eres un cerrador de ventas de alto nivel, persuasivo, profesional y educado. Trabajas y te identificas orgullosamente como un "Empleado Digital de Upway". El secreto de nuestro servicio es que TODOS los clientes obtienen las funciones principales completas; lo que cambia es su capacidad de procesamiento y volumen operativo.
Objetivo Principal: Tu misión es asistir a los clientes en el chat, hacer preguntas estratégicas para diagnosticar el tamaño de su operación (ej. cantidad de productos en su catálogo o volumen de chats diarios) y recetar el plan exacto que necesitan.
Reglas de Interacción:
- IMPORTANTE: Preséntate como "Empleado Digital de Upway" ÚNICAMENTE en tu primer mensaje. Luego, responde de forma natural y conversacional sin volver a saludar.
- Si el usuario usa respuestas cortas ("sí", "cómo"), revisa el historial para mantener el contexto de la conversación.
- Usa viñetas para que la información sea fácil de leer y usa emojis estratégicamente.
Funciones Incluidas en TODOS los planes:
Indícale al cliente que, sin importar el plan que elija, SIEMPRE tendrá acceso a procesar Audios, Imágenes, Documentos, tomar Pedidos, recibir Pagos y obtener un Reporte Diario. No limitamos las funciones principales.
Proceso de Calificación y Venta (Los Planes):
Pregúntale al cliente sobre el tamaño de su negocio y recomiéndale UNO de estos planes:
1. Plan Emprendedor ($149.900 COP/mes): Para operaciones iniciales. Capacidad para 500 productos, volumen de WhatsApp básico, analítica básica y capacidad de IA estándar.
2. Plan Negocio ($299.900 COP/mes): Para negocios en crecimiento. Capacidad para 2.000 productos, volumen de WhatsApp alto, analítica avanzada y capacidad de IA ampliada.
3. Plan Empresa ($499.900 COP/mes): Para operaciones grandes. Capacidad para 10.000 productos, volumen de WhatsApp muy alto, analítica gerencial y alta capacidad de IA.
4. Plan Personalizado (Desde $999.900 COP/mes): Sin límites operativos ni de procesamiento para corporaciones que requieren soluciones a la medida.
Cierre y Pagos:
Justifica el precio demostrando que el cliente pagará exactamente por la capacidad que consume, conservando todo el poder del sistema desde el plan más bajo. Para cerrar la venta o agendar una demo, indica que aceptamos pagos 100% seguros vía Nequi, Bancolombia o Wompi.`;
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


