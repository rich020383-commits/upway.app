import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as GenerativeAI from '@google/generative-ai';

// --- INICIALIZACIÓN DE LOS 4 PROVEEDORES --- //
const cerebrasClient = process.env.CEREBRAS_API_KEY 
  ? new OpenAI({ apiKey: process.env.CEREBRAS_API_KEY, baseURL: 'https://api.cerebras.ai/v1' }) 
  : null;

const groqClient = process.env.GROQ_API_KEY 
  ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' }) 
  : null;

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_FREE_API_KEY;
const geminiGenAI = geminiApiKey ? new GenerativeAI.GoogleGenerativeAI(geminiApiKey) : null;

const mistralClient = process.env.MISTRAL_API_KEY 
  ? new OpenAI({ apiKey: process.env.MISTRAL_API_KEY, baseURL: 'https://api.mistral.ai/v1' }) 
  : null;

// --- CONFIGURACIÓN DEL AGENTE SUPREMO --- //
const AGENTE_SUPREMO_PROMPT = `Rol: Eres un cerrador de ventas de alto nivel, persuasivo, profesional y educado. Trabajas y te identificas orgullosamente como un "Empleado Digital de Upway". 

Objetivo Principal: Tu misión es asistir a los clientes en el chat, hacer preguntas estratégicas para diagnosticar el tamaño de su operación y recetar el plan exacto que necesitan.

🚨 REGLA SUPREMA DE DIRECCIONAMIENTO (DEMO Y PRUEBAS):
Si el usuario menciona palabras como: "probar", "simulador", "demo", "cómo se vería", "crear cuenta" o "ver cómo funciona":
1. CORTA INMEDIATAMENTE CUALQUIER EXPLICACIÓN LARGA.
2. NO le hagas preguntas de calificación.
3. 3. TU ÚNICA RESPUESTA DEBE SER enviarlo al panel de control gratis entregando este enlace de registro exacto: [⚡ INICIAR PROTOCOLO](/registro)
4. Dile algo corto y persuasivo como: "¡Claro que sí! La mejor forma de verlo es en acción. Entra a nuestro panel gratis ahora mismo y mira cómo respondería tu agente en tiempo real. 👇 \n\n [⚡ INICIAR PROTOCOLO](/registro)"

Cierre y Pagos:
Para cerrar la venta o agendar una demo, indica que el proceso se realiza directamente en nuestro panel, aceptando pagos seguros vía Bold, Nequi, Bancolombia o Wompi.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    let botReply = '';
    let usedProvider = '';

    const formattedMessages = [
      { role: 'system', content: AGENTE_SUPREMO_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'bot' ? 'assistant' : m.role, 
        content: m.content,
      })),
    ];

    // ==========================================
    // 🥇 1. CEREBRAS AI (Motor Principal Ultra Rápido)
    // ==========================================
    try {
      if (!cerebrasClient) throw new Error('Falta CEREBRAS_API_KEY');
      
      const completion = await cerebrasClient.chat.completions.create({
        model: 'gpt-oss-120b',
        messages: formattedMessages,
        temperature: 0.7,
      });

      botReply = completion.choices[0]?.message?.content || '';
      usedProvider = 'Cerebras AI (GPT-OSS) ⚡';
    } catch (errCerebras: any) {
      console.warn(`⚠️ Cerebras al límite. Activando 1er relevo (Groq)...`);

      // ==========================================
      // 🥈 2. GROQ (Primer Relevo de Alta Capacidad)
      // ==========================================
      try {
        if (!groqClient) throw new Error('Falta GROQ_API_KEY');

        const completionGroq = await groqClient.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: formattedMessages,
          temperature: 0.7,
        });

        botReply = completionGroq.choices[0]?.message?.content || '';
        usedProvider = 'Groq 🚀';
      } catch (errGroq: any) {
        console.warn(`⚠️ Groq al límite. Activando 2do relevo (Google Gemini)...`);

        // ==========================================
        // 🥉 3. GOOGLE GEMINI FLASH (Segundo Relevo)
        // ==========================================
        try {
          if (!geminiGenAI) throw new Error('Falta llave de Gemini');

          const geminiModel = geminiGenAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash', 
            systemInstruction: AGENTE_SUPREMO_PROMPT 
          });

          const contents = messages.map((m: { role: string; content: string }) => ({
            role: m.role === 'bot' ? 'model' : m.role,
            parts: [{ text: m.content }],
          }));

          const result = await geminiModel.generateContent({ contents });
          botReply = result.response.text();
          usedProvider = 'Google Gemini Flash 🛡️';
        } catch (errGemini: any) {
          console.warn(`⚠️ Gemini al límite. Activando 3er relevo (Mistral AI)...`);

          // ==========================================
          // 🛡️ 4. MISTRAL AI (Escudo Definitivo Masivo)
          // ==========================================
          try {
            if (!mistralClient) throw new Error('Falta MISTRAL_API_KEY');

            const completionMistral = await mistralClient.chat.completions.create({
              model: 'ministral-3b-2512',
              messages: formattedMessages,
              temperature: 0.7,
            });

            botReply = completionMistral.choices[0]?.message?.content || '';
            usedProvider = 'Mistral AI (Ministral) 🔥';
          } catch (errMistral: any) {
            console.error(`🔴 CRÍTICO: Los 4 proveedores fallaron.`, errMistral.message);
            throw new Error('Sistemas de IA temporalmente no disponibles.');
          }
        }
      }
    }

    console.log(`✅ Mensaje respondido exitosamente usando: ${usedProvider}`);
    return NextResponse.json({ reply: botReply, provider: usedProvider });

  } catch (error: any) {
    console.error('Error general en el endpoint /api/chat:', error);
    return NextResponse.json(
      { 
        reply: "¡Hola! Soy tu Empleado Digital de Upway. En este momento estamos experimentando un alto tráfico de operaciones, pero ya estoy activo de nuevo. ¡Inténtalo otra vez en unos instantes! 😉" 
      },
      { status: 500 }
    );
  }
}