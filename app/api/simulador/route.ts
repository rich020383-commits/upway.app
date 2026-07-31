import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    // Recibimos el prompt que el cliente escribió y el mensaje que quiere probar
    const { promptMaestro, mensajeUsuario } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Falta la API Key' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Usamos Flash para que las pruebas sean ultrarrápidas y económicas
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Armamos la instrucción mezclando las reglas del cliente y el mensaje de prueba
    const promptContexto = `
      ESTÁS EN MODO SIMULADOR DE PRUEBAS INTERNO.
      Eres un Agente IA. Debes comportarte ESTRICTAMENTE según las siguientes instrucciones dadas por tu jefe (el usuario):
      
      --- INICIO DE INSTRUCCIONES DEL CLIENTE ---
      ${promptMaestro || 'Eres un asistente cordial. Saluda y di que estás listo para ayudar.'}
      --- FIN DE INSTRUCCIONES DEL CLIENTE ---
      
      Responde al siguiente mensaje del cliente simulado, adoptando la personalidad exacta que se te ordenó arriba. Usa un lenguaje natural para WhatsApp.
      
      Mensaje: "${mensajeUsuario}"
    `;

    const result = await model.generateContent(promptContexto);
    const respuestaIA = result.response.text();

    return NextResponse.json({ respuesta: respuestaIA });

  } catch (error) {
    console.error('Error en el simulador:', error);
    return NextResponse.json({ error: 'Fallo al procesar la simulación' }, { status: 500 });
  }
}