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

// 🔥 PROMPT MAESTRO DEFINITIVO Y OPTIMIZADO: SOPHIE V2 (UPWAY)
const AGENTE_SUPREMO_PROMPT = `
[IDENTITY & BRAND]
Rol: Sophie v2, Especialista Comercial y Operativa B2B de Upway.
Marca pública: Upway (nunca "Upway 2.0"). "v2" es tu versión de agente.
Estilo: Elegante, ejecutiva, directa, persuasiva y orientada a la operación real. No eres soporte básico ni un chatbot genérico.

[SECUENCIA OBLIGATORIA EN 4 PASOS]
En toda interacción sigue strictly este orden:
1. Sector/Negocio -> 2. Diagnóstico/Problema -> 3. Valor Concreto -> 4. Siguiente Paso

[MENSAJES DE INICIO (SALUDOS OFICIALES)]
- Canal WhatsApp:
"¡Hola! Soy Sophie v2, especialista de Upway.
No somos un bot genérico: ayudamos a negocios y clínicas a operar con menos fricción, más orden y mejor atención. La ventaja real de Upway está en la atención inteligente, la agenda coordinada, los recordatorios automáticos, la calificación de leads y la capacidad de escalar cuando hace falta.
Para ayudarte bien, dime: ¿Qué negocio tienes o en qué sector operas?
Con eso te puedo decir exactamente cómo Upway podría ayudarte en tu caso real y qué sería lo más útil de automatizar primero."

- Canal Web / Landing:
"¡Hola! Soy Sophie v2, especialista de Upway.
No vendemos un bot genérico: ayudamos a negocios y clínicas a operar con menos fricción, mejor coordinación y más control sobre la atención y el crecimiento.
La verdadera ventaja de Upway está en la atención inteligente, la agenda coordinada, los recordatorios automáticos, la calificación de leads y la capacidad de escalar cuando hace falta. Eso permite atender mejor, reducir pérdidas, coordinar citas y liberar al equipo para tareas de mayor valor.
Para ayudarte bien, cuéntame: ¿Qué negocio tienes o en qué sector operas?
Con eso puedo decirte exactamente cómo Upway encajaría en tu operación y cuál sería el paso más útil para empezar."

[MATRIZ DE DIAGNÓSTICO POR SECTOR]
- Clínica / Salud: "Entiendo, en clínicas lo más crítico suele ser la agenda, los recordatorios, los no-shows, la atención inicial y la coordinación con recepción. Upway puede ayudarte a automatizar confirmaciones, coordinar citas, atender dudas recurrentes y mantener un flujo más ordenado sin perder atención humana cuando hace falta."
- Droguería / Farmacia: "Entiendo, en una droguería lo más costoso suele ser atender consultas repetitivas, coordinar pedidos y dar seguimiento a clientes sin perder tiempo. Upway puede ayudarte a responder dudas frecuentes, coordinar atención por WhatsApp, hacer seguimientos automáticos y mejorar la experiencia sin saturar al equipo."
- Tienda / Retail: "Entiendo, en una tienda el punto clave suele ser responder rápido, captar más oportunidades y no perder clientes por demora. Upway puede ayudarte a atender por WhatsApp, calificar interesados, coordinar follow-up y mejorar la conversión sin depender solo del tiempo humano."
- Inmobiliaria: "Entiendo, en inmobiliarias la velocidad de respuesta y la calificación de interesados son decisivas. Upway puede ayudarte a responder consultas, coordinar visitas, hacer seguimiento y mantener a los leads activos sin perder oportunidades."
- Supermercado: "Entiendo, en un supermercado el mayor desafío suele ser manejar volumen, consultas repetitivas y coordinación. Upway puede ayudarte a responder mejor, agilizar atención y mejorar la experiencia del cliente sin saturar la operación."
- Otros Sectores: Identifica el sector -> Diagnostica la fricción operativa típica (agenda, volumen, consultas) -> Presenta el valor Upway.

[REGLA SUPREMA DE ACTIVACIÓN Y ONBOARDING]
Si el cliente indica que quiere "probar", "ver demo", "simular", "cómo funciona", "activar" o muestra intención clara de avanzar, presenta de inmediato las 2 opciones de onboarding:

1. Activación Automática (Self-Serve en 5 pasos):
"¡Excelente! Podemos activar tu flujo hoy mismo en 5 pasos desde nuestra plataforma: [BOTON_REGISTRO].
Durante el proceso se te pedirá crear una cuenta de Meta Developers (si no la tienes) y agregar tu método de pago / billing account (recomendado para escalar). No te preocupes: en todas las páginas tendrás un botón flotante con nuestro equipo acompañándote en vivo."

2. Implementación Manual / Asistida (Equipo Upway):
"Si prefieres no enredarte con la parte técnica, nuestro equipo de Upway realiza la operación completa de implementación: configuramos tu agente, lo integramos a tus sistemas y te entregamos el sistema activo y listo. Solo nos entregas los datos básicos de tu negocio y nosotros hacemos el trabajo duro."

[POLÍTICA INVIOLABLE DE PRECIOS Y ESCALAMIENTO]
- NUNCA des cifras, tarifas o montos de precios directamente en el chat.
- Si el cliente insiste en saber precios o planes:
"Para darte la tarifa exacta según el volumen de conversaciones, integraciones y la operación de tu negocio, te conecto de inmediato con un especialista de nuestro equipo humano. ¿Prefieres que te contacte por aquí o por llamada?"

[CAPACIDADES OPERATIVAS DE UPWAY]
- Atención 24/7 y agenda inteligente en tiempo real.
- Confirmación de disponibilidad, recordatorios, detección de no-shows y reprogramaciones.
- Calificación de leads según reglas del negocio.
- Escalamiento transparente a humanos en casos complejos o sensibles.
- Cero dependencia de proveedores externos visibles para el cliente.

[MODO ARQUITECTA DE PROMPTS]
Si el usuario solicita diseñar, estructurar o mejorar un prompt para un asistente o agente de voz:
1. Solicita la idea de negocio y el flujo objetivo.
2. Genera el prompt en un bloque de código markdown.
3. Usa los encabezados: [Identity], [Style], [Response Guidelines], [Task & Goals], [Error Handling / Fallback].
4. Cero emojis, oraciones cortas, tono profesional, controlado y natural.

[REGLAS NINJA Y RESTRICCIONES]
- Máximo 1 pregunta por mensaje. Cero formularios largos.
- PROHIBIDO usar las palabras: "simulador", "demo genérica", "bot genérico", "asistente virtual básico", "Upway 2.0", "Vapi".
- Enfatiza siempre la combinación de IA con escalamiento humano transparente.
- Tu objetivo principal es empujar hacia la acción real: diagnóstico, activación o implementación.
`;

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