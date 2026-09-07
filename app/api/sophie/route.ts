import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 💎 SOPHIE acepta la llave premium o la llave estándar de Gemini
const geminiApiKey = process.env.GEMINI_PREMIUM_API_KEY || process.env.GEMINI_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

const kimiApiKey = process.env.KIMI_API_KEY;
const kimiApiUrl = process.env.KIMI_API_URL || 'https://api.moonshot.ai/v1';
const kimiModelName = process.env.KIMI_MODEL || 'moonshot-v1-8k';
const kimiClient = kimiApiKey ? new OpenAI({ apiKey: kimiApiKey, baseURL: kimiApiUrl }) : null;
const groqClient = process.env.GROQ_API_KEY
  ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' })
  : null;
const sambanovaClient = process.env.SAMBANOVA_API_KEY
  ? new OpenAI({ apiKey: process.env.SAMBANOVA_API_KEY, baseURL: 'https://api.sambanova.ai/v1' })
  : null;
const mistralClient = process.env.MISTRAL_API_KEY
  ? new OpenAI({ apiKey: process.env.MISTRAL_API_KEY, baseURL: 'https://api.mistral.ai/v1' })
  : null;
const openRouterClient = process.env.OPENROUTER_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: 'https://openrouter.ai/api/v1' })
  : null;
const cerebrasClient = process.env.CEREBRAS_API_KEY
  ? new OpenAI({ apiKey: process.env.CEREBRAS_API_KEY, baseURL: 'https://api.cerebras.ai/v1' })
  : null;
const PROVIDER_TIMEOUT_MS = 8000;

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

const buildSophieContents = (messages: SophieMessage[], audioUsuario?: string, audioTranscrito?: string): SophieContent[] => {
  const contents: SophieContent[] = messages.map((m) => ({
    role: m.role === 'bot' || m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.content || '' }]
  }));

  if (audioUsuario) {
    const base64Data = audioUsuario.split(',')[1] || audioUsuario;
    contents.push({
      role: 'user',
      parts: [
        { text: audioTranscrito
          ? `El cliente envió una nota de voz. Esta es la transcripción: "${audioTranscrito}"`
          : 'El cliente envió esta nota de voz. Escúchala y responde con tu estilo comercial afilado y directo:' },
        ...(audioTranscrito ? [] : [{ inlineData: { data: base64Data, mimeType: 'audio/webm' } }])
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

const transcribirAudioWeb = async (audioUsuario: string): Promise<string> => {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) throw new Error('Falta GROQ_API_KEY para transcribir el audio web');

  const base64Data = audioUsuario.split(',')[1] || audioUsuario;
  const buffer = Buffer.from(base64Data, 'base64');
  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: 'audio/webm' }), 'sophie.webm');
  formData.append('model', 'whisper-large-v3');
  formData.append('language', 'es');

  const response = await withTimeout(fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${groqApiKey}` },
    body: formData
  }), 8000, 'Groq Whisper');
  const data = await response.json() as { text?: string; error?: { message?: string } };
  if (!response.ok || !data.text?.trim()) {
    throw new Error(data.error?.message || 'La transcripción web devolvió texto vacío');
  }
  return data.text.trim();
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, providerName: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${providerName} timeout after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
};

// 🔥 PROMPT MAESTRO COMPLETO BLINDADO: SOPHIE V2 (UPWAY BUSINESS)
const AGENTE_SUPREMO_PROMPT = `
[IDENTITY & BRAND]
Rol: Sophie v2, Especialista Comercial y Operativa B2B de Upway.
Marca pública: Upway (nunca "Upway 2.0"). "v2" es tu versión de agente.
Estilo: Elegante, ejecutiva, directa, persuasiva y orientada a la operación real. No eres soporte básico ni un chatbot genérico.

[🚨 FRENOS DE EMERGENCIA Y BLOQUEOS ABSOLUTOS]
1. REGLA INVIOLABLE DE HUMANOS Y PRECIOS:
   - Si el cliente menciona las palabras: "humano", "asesor", "precio", "costo", "cotización", "cuánto vale", "planes" o solicita hablar con una persona:
   - DETÉN inmediatamente el flujo de diagnóstico.
   - NUNCA desgloses la estructura de costos (plataforma, implementación, consumo) ni hagas estimaciones financieras.
   - NUNCA exijas volúmenes de mensajes antes de ofrecer la transferencia si el cliente ya pidió hablar con un asesor.
   - RESPONDE SIEMPRE terminando con este marcador EXACTO: [CONTACTAR_ASESOR]
     Ejemplo: "Para darte la tarifa exacta y el plan ideal según la operación de tu negocio, te conecto de inmediato con nuestro equipo humano por WhatsApp. [CONTACTAR_ASESOR]"

2. REGLA INVIOLABLE DE TIEMPOS Y RAPIDEZ (SELF-SERVE HOY MISMO):
   - PROHIBIDO ABSOLUTAMENTE mencionar tiempos de "1 a 2 semanas" o procesos de configuración lentos que asusten al prospecto.
   - Si el cliente pregunta por "rapidez", "tiempo", "cuándo se activa", "implementación" o muestra prisa:
   - Presenta SIEMPRE como PRIMERA OPCIÓN OBLIGATORIA la Activación Automática (Self-Serve hoy mismo en 5 pasos):
     "¡Puedes activar tu flujo HOY MISMO en solo 5 pasos desde nuestra plataforma! Durante el proceso te guiamos paso a paso con acompañamiento en vivo si lo requieres. Y si prefieres que nuestro equipo haga la configuración completa por ti, también nos encargamos de dejártelo activo y listo sin que tengas que preocuparte por la parte técnica."

3. CERO ALUCINACIONES DE RESCATE:
   - PROHIBIDO inventar "pilotos rápidos", ofertas improvisadas o flujos no oficiales cuando el cliente exprese inconformidad.
   - Si el cliente expresa molestia o rechazo, mantén la postura ejecutiva, valida empáticamente su punto y ofrece conectar de inmediato con un director operativo.

[SECUENCIA OBLIGATORIA EN 4 PASOS (Aplica solo si el cliente NO ha pedido precios ni asesor humano)]
1. Sector/Negocio -> 2. Diagnóstico/Problema -> 3. Valor Concreto -> 4. Siguiente Paso (Diagnóstico / Activación)

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
"¡Excelente! Podemos activar tu flujo hoy mismo en 5 pasos desde nuestra plataforma. Durante el proceso se te pedirá crear una cuenta de Meta Developers (si no la tienes) y agregar tu método de pago / billing account (recomendado para escalar). En todas las páginas tendrás un botón flotante con nuestro equipo acompañándote en vivo."

2. Implementación Manual / Asistida (Equipo Upway):
"Si prefieres no enredarte con la parte técnica, nuestro equipo de Upway realiza la operación completa de implementación: configuramos tu agente, lo integramos a tus sistemas y te entregamos el sistema activo y listo. Solo nos entregas los datos básicos de tu negocio y nosotros hacemos el trabajo duro."

[CAPACIDADES OPERATIVAS DE UPWAY]
- Atención 24/7 y agenda inteligente en tiempo real.
- Confirmación de disponibilidad, recordatorios, detección de no-shows y reprogramaciones.
- Calificación de leads según reglas del negocio.
- Escalamiento transparente a humanos en casos complejos o sensibles.
- Cero dependencia de proveedores externos visibles para el cliente.

[MODO ARQUITECTA DE PROMPTS]
Si el usuario solicita diseñar, estructurar o mejorar un prompt para un asistente o agente de voz:
1. Solicita la idea de negocio y el flujo objetivo.
2. Genera el prompt en un bloque de código markdown \`\`\`.
3. Usa los encabezados: [Identity], [Style], [Response Guidelines], [Task & Goals], [Error Handling / Fallback].
4. Cero emojis, oraciones cortas, tono profesional, controlado y natural.

[REGLAS NINJA Y RESTRICCIONES REFORZADAS]
- Máximo 1 pregunta por mensaje. Cero formularios largos.
- PROHIBIDO usar las palabras: "simulador", "demo genérica", "bot genérico", "asistente virtual básico", "Upway 2.0", "Vapi".
- Si el usuario pide hablar con una persona, NO insistas en seguir preguntando volúmenes o datos: deriva inmediatamente.
- Tu objetivo principal es empujar hacia la acción real: diagnóstico, activación o implementación.
`;
// 🚨 Número de WhatsApp del equipo humano de Upway (handoff web -> WhatsApp).
// Se puede sobreescribir con HUMAN_TRANSFER_WEB_NUMBER; por defecto usa el número
// de la conexión comercial ya asignada.
const HUMAN_TRANSFER_WA_NUMBER = process.env.HUMAN_TRANSFER_WEB_NUMBER || '573126427856';

const buildWaAdvisorLink = (lastUserMessage: string): string => {
  const contexto = lastUserMessage ? ` Contexto de mi consulta: "${lastUserMessage.slice(0, 180)}"` : '';
  const texto = encodeURIComponent(`Hola, vengo del chat de Sophie en la web. Quiero hablar con un asesor humano para conocer el precio y el tiempo de implementación de Upway.${contexto}`);
  return `https://wa.me/${HUMAN_TRANSFER_WA_NUMBER}?text=${texto}`;
};

// 🚨 Detección server-side de intención de asesor humano / precio / implementación.
// Garantiza el marcador [CONTACTAR_ASESOR] aunque el LLM no lo genere.
const HUMAN_INTENT_PATTERN = /(humano|asesor|persona real|hablar con alguien|me atienda|agente real|consultor)|\b(precio|precios|costo|costos|cuanto vale|cuánto vale|cotizaci[oó]n|tarifa|plan(es)?|implementaci[oó]n|cu[aá]nto tiempo|tiempo de implementaci[oó]n|cuando se activa|cu[aá]ndo se activa)\b/i;

const humanIntentReply = 'Con gusto. Para darte la tarifa exacta y el tiempo de implementación según tu operación, te conecto de inmediato con nuestro equipo humano por WhatsApp: te atienden en minutos. [CONTACTAR_ASESOR]';

const detectHumanIntent = (messages: SophieMessage[]): boolean => {
  const lastUser = [...messages]
    .reverse()
    .find((m) => m.role !== 'bot' && m.role !== 'assistant' && m.role !== 'model')
    ?.content?.trim() || '';
  return HUMAN_INTENT_PATTERN.test(lastUser);
};

const buildLocalFallback = (messages: SophieMessage[]): string => {  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role !== 'bot' && message.role !== 'assistant' && message.role !== 'model')
    ?.content?.trim() || '';
  const numericAnswer = lastUserMessage.match(/^\d[\d.,\s]*$/)?.[0]?.trim();

  if (numericAnswer) {
    return `Perfecto, con aproximadamente ${numericAnswer} leads al mes ya tiene sentido automatizar la calificación y el seguimiento. El siguiente paso es revisar de dónde llegan, cuánto tardan en responderles y cómo se coordinan las visitas. ¿Quieres activar un diagnóstico de ese flujo?`;
  }

  return 'Entiendo. Podemos ordenar ese flujo con atención inmediata, calificación de leads y seguimiento automático. ¿Quieres que revisemos primero el proceso que más oportunidades te está haciendo perder?';
};

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
    let audioTranscrito: string | undefined;
    if (audioUsuario) {
      try {
        audioTranscrito = await transcribirAudioWeb(audioUsuario);
      } catch (audioError) {
        console.warn('⚠️ No se pudo transcribir el audio web; Gemini intentará procesarlo directamente.', audioError);
      }
    }

    const contents = buildSophieContents(messages.filter((m: SophieMessage) => m.role !== 'system'), audioUsuario, audioTranscrito);

    const openAiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: AGENTE_SUPREMO_PROMPT },
      ...contents.map((content) => ({
        role: content.role === 'model' ? 'assistant' as const : 'user' as const,
        content: content.parts.map((part) => ('text' in part ? part.text : '')).join(' ').trim() || ' '
      }))
    ];

    type OpenAiClient = Pick<OpenAI, 'chat'>;
    type Provider = {
      name: string;
      client: OpenAiClient | null;
      model: string;
    };

    const providers: Provider[] = [
      { name: 'Kimi ✨', client: kimiClient, model: kimiModelName },
      { name: 'Groq 🚀', client: groqClient, model: 'openai/gpt-oss-20b' },
      { name: 'SambaNova ⚡', client: sambanovaClient, model: 'Meta-Llama-3.1-8B-Instruct' },
      { name: 'Mistral 🔥', client: mistralClient, model: 'mistral-small-latest' },
      { name: 'OpenRouter 🃏', client: openRouterClient, model: 'openrouter/free' },
      { name: 'Cerebras ⚡', client: cerebrasClient, model: 'llama-3.3-70b' }
    ];

    const generateWithOpenAiCompatible = async (provider: Provider): Promise<string> => {
      if (!provider.client) throw new Error(`${provider.name} no está configurado`);
      const completion = await provider.client.chat.completions.create({
        model: provider.model,
        messages: openAiMessages,
        temperature: 0.45,
        max_tokens: 500
      });
      return completion.choices[0]?.message?.content || '';
    };

    const fallbackProviders: Array<{ name: string; execute: () => Promise<string> }> = [
      ...providers.map((provider) => ({
        name: provider.name,
        execute: () => generateWithOpenAiCompatible(provider)
      }))
    ];

    if (genAI) {
      fallbackProviders.push({
        name: 'Gemini Premium 💎',
        execute: async () => {
          const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: AGENTE_SUPREMO_PROMPT,
            generationConfig: { temperature: 0.45, maxOutputTokens: 500 }
          });
          const result = await model.generateContent({ contents });
          return result.response.text();
        }
      });
    }

    let botReply = '';
    let chosenProvider = 'Sin proveedor disponible';
    let providerWorked = false;
    let lastError: unknown;

    for (const provider of fallbackProviders) {
      try {
        const reply = await withTimeout(provider.execute(), PROVIDER_TIMEOUT_MS, provider.name);
        if (!reply.trim()) throw new Error(`${provider.name} devolvió respuesta vacía`);
        botReply = reply;
        chosenProvider = provider.name;
        providerWorked = true;
        console.log(`✅ Sophie respondió con éxito con ${chosenProvider}`);
        break;
      } catch (providerError) {
        lastError = providerError;
        console.warn(`⚠️ ${provider.name} falló en Sophie. Activando siguiente relevo...`, providerError);
      }
    }

    if (!providerWorked) {
      console.error('❌ Todos los motores de la cascada de Sophie fallaron.', lastError);
      botReply = buildLocalFallback(messages);
    }

    // 🚨 HANDOFF WEB -> HUMANO: si el cliente pidió asesor/precio/implementación,
    // se fuerza el marcador [CONTACTAR_ASESOR] y se devuelve el link de WhatsApp
    // directo con el equipo humano. Esto aplica también si la IA se equivocó y
    // respondió con un diagnóstico largo en vez de derivar.
    let waAdvisorLink: string | null = null;
    if (detectHumanIntent(messages)) {
      if (!botReply.includes('[CONTACTAR_ASESOR]')) {
        botReply = humanIntentReply;
      }
      const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role !== 'bot' && m.role !== 'assistant' && m.role !== 'model')
        ?.content?.trim() || '';
      waAdvisorLink = buildWaAdvisorLink(lastUserMessage);
    }

    return NextResponse.json({ reply: botReply, provider: chosenProvider, ok: providerWorked, waAdvisorLink });

  } catch (error: unknown) {
    console.error('Error crítico en Sophie:', error);
    return NextResponse.json({ reply: `⚠️ Error temporal en el sistema de Sophie. ¡Inténtalo de nuevo!` }, { status: 500 });
  }
}