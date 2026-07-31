import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    // 1. Ahora también recibimos el "historial" completo de la conversación
    const { promptMaestro, mensajeUsuario, historial } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Falta la API Key' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: `ESTÁS EN MODO SIMULADOR DE PRUEBAS INTERNO. 
      Comportate ESTRICTAMENTE según estas instrucciones de tu jefe: 
      ${promptMaestro || 'Eres un asistente cordial.'}`
    });

    // 2. Formateamos el historial de nuestra web al formato que entiende Gemini
    const historialFormateado = historial.map((msg: any) => ({
      role: msg.rol === 'usuario' ? 'user' : 'model',
      parts: [{ text: msg.texto }],
    }));

    // 3. Iniciamos un chat con memoria
    const chat = model.startChat({
      history: historialFormateado,
    });

    // 4. Enviamos solo el nuevo mensaje
    const result = await chat.sendMessage(mensajeUsuario);
    const respuestaIA = result.response.text();

    return NextResponse.json({ respuesta: respuestaIA });

  } catch (error) {
    console.error('Error en el simulador:', error);
    return NextResponse.json({ error: 'Fallo al procesar la simulación' }, { status: 500 });
  }
}