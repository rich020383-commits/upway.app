import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 💎 LLAVE PREMIUM EXCLUSIVA PARA SOPHIE
const geminiApiKey = process.env.GEMINI_PREMIUM_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

const kimiApiKey = process.env.KIMI_API_KEY;
const kimiApiUrl = process.env.KIMI_API_URL || 'https://api.moonshot.ai/v1';
const kimiModelName = process.env.KIMI_MODEL || 'moonshot-v1-8k';
const kimiClient = kimiApiKey ? new OpenAI({ apiKey: kimiApiKey, baseURL: kimiApiUrl }) : null;

type SophieMessage = {
  role?: string;
  content?: string;
};

type SophieContentPart =
  | { text: string }
  | { inlineData: { data: string; mimeType: string } };

type SophieContent = {
  role: 'user' | 'model';
  parts: SophieContentPart[];
};

const buildSophieContents = (messages: SophieMessage[], audioUsuario?: string): SophieContent[] => {
  const contents: SophieContent[] = messages.map((m) => ({
    role: m.role === 'bot' ? 'model' : 'user',
    parts: [{ text: m.content || '' }]
  }));

  if (audioUsuario) {
    const base64Data = audioUsuario.split(',')[1] || audioUsuario;
    contents.push({
      role: 'user',
      parts: [
        { text: 'El cliente envió esta nota de voz. Escúchala y responde con tu estilo comercial afilado y directo:' },
        { inlineData: { data: base64Data, mimeType: 'audio/webm' } }
      ]
    });
  }

  if (contents.length === 0) {
    contents.push({
      role: 'user',
      parts: [{ text: 'El cliente inició la conversación. Responde con un mensaje corto, comercial y directo.' }]
    });
  }

  return contents;
};

// 🔥 PROMPT AFILADO, ANTIRREPETICIÓN Y OPTIMIZADO PARA CONVERSIÓN + MODO ARQUITECTA
const AGENTE_SUPREMO_PROMPT = `Rol: Eres Sophie, representante comercial prémium y Empleada Digital de Upway (BARAKAH TECH HUB SAS). Tu estilo es elegante, sumamente persuasivo, directo y corporativo.

DIRECTRICES DE CONVERSIÓN (CERO REPETICIÓN):
1. Sé concisa y letal. Ve directo al grano. No des explicaciones aburridas ni repitas lo que el usuario ya sabe.
2. Diagnostica rápido: pregunta qué proceso quieren automatizar en su negocio (pymes, restaurantes, ferreterías).
3. Conecta las necesidades con los planes de inmediato:
   - Plan Emprendedor ($149.900 COP/mes): Texto y catálogo básico.
   - Plan Negocio ($299.900 COP/mes - El estrella): Desbloquea IA multimodal, notas de voz, imágenes y RAG de inventario. 
   - Plan PRO ($499.900 COP/mes): Alto volumen y reportes avanzados.

🚨 REGLA SUPREMA DE DIRECCIONAMIENTO AL SIMULADOR:
Si el cliente dice que quiere "probar", "ver demo", "simular" o "cómo funciona":
- CORTA cualquier explicación y no hagas más preguntas.
- Tu respuesta DEBE incluir exactamente este texto al final: "¡Claro que sí! La mejor forma de verlo es en acción. Entra a nuestro panel gratis ahora mismo y mira cómo respondería tu agente en tiempo real. [BOTON_REGISTRO]"

🛠️ MODO ARQUITECTA DE VOZ (INGENIERA DE PROMPTS):
Si el usuario te pide ayuda para "crear", "estructurar", "mejorar" o "hacer" un prompt o agente de voz:
1. Pídele que te cuente su idea básica de negocio.
2. Devuélvele un prompt técnico optimizado para motores de voz.
3. Reglas de optimización: prohíbe emojis y acciones físicas, exige oraciones de 1 a 2 líneas y establece un tono conversacional estricto.
4. Estructura tu respuesta OBLIGATORIAMENTE con estos encabezados: [Identity], [Style], [Response Guidelines], [Task & Goals] y [Error Handling / Fallback].
5. IMPORTANTE: Envuelve todo el prompt generado dentro de un único bloque de código markdown (usando \`\`\`) para que el usuario pueda copiarlo con un clic.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 🛡️ FIX AUDITORÍA: Validación estricta del JSON de entrada
    if (!body || !body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { reply: "Error de formato: 'messages' debe ser un arreglo válido." },
        { status: 400 }
      );
    }

    const { messages, audioUsuario } = body;

    const contents = buildSophieContents(messages.filter((m: SophieMessage) => m.role !== 'system'), audioUsuario);

    const generateWithGemini = async () => {
      if (!genAI) throw new Error('Falta GEMINI_PREMIUM_API_KEY en el .env');
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: AGENTE_SUPREMO_PROMPT,
        generationConfig: {
          temperature: 0.45,
          maxOutputTokens: 500, // Subí un poco el límite para que los prompts generados no se corten
        }
      });
      const result = await model.generateContent({ contents });
      return result.response.text();
    };

    const generateWithKimiFallback = async () => {
      if (!kimiClient) throw new Error('Falta KIMI_API_KEY para fallback de Sophie');
      const mappedMessages: Array<{ role: 'user' | 'assistant'; content: string }> = contents.map((c) => ({
        role: c.role === 'model' ? 'assistant' : 'user',
        content: c.parts.map((p) => ('text' in p ? p.text : '')).join(' ').trim() || ' '
      }));

      const fallbackMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: AGENTE_SUPREMO_PROMPT },
        ...mappedMessages
      ];
      const completion = await kimiClient.chat.completions.create({
        model: kimiModelName,
        messages: fallbackMessages,
        temperature: 0.45,
        max_tokens: 500,
      });
      return completion.choices[0]?.message?.content || '';
    };

    let botReply = '';
    let chosenProvider = 'Gemini Premium 💎';
    try {
      botReply = await generateWithGemini();
    } catch (primaryError) {
      console.warn('⚠️ Gemini Premium falló en Sophie. Intentando fallback con Kimi...', primaryError);
      try {
        botReply = await generateWithKimiFallback();
        chosenProvider = 'Kimi K3 ✨ (fallback)';
      } catch (fallbackError) {
        console.error('❌ Fallback de Kimi también falló:', fallbackError);
        botReply = '⚠️ Estoy teniendo problemas técnicos en este momento. Por favor, inténtalo de nuevo en unos minutos.';
        chosenProvider = 'Ninguno (error)';
      }
    }

    console.log(`✅ Sophie respondió con éxito con ${chosenProvider}`);
    return NextResponse.json({ reply: botReply, provider: chosenProvider });

  } catch (error: unknown) {
    console.error('Error crítico en Sophie:', error);
    return NextResponse.json({ reply: `⚠️ Error temporal en el sistema de Sophie. ¡Inténtalo de nuevo!` }, { status: 500 });
  }
}