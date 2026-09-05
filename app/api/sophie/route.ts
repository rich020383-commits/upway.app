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

const buildSophieContents = (messages: SophieMessage[], audioUsuario?: string): SophieContent[] => {
  const contents: SophieContent[] = messages.map((m) => ({
    role: m.role === 'bot' || m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
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

// 🔥 PROMPT DEFINITIVO PARA SOPHIE V2 / UPWAY / AGENDAS OPERATIVAS Y ONBOARDING
const AGENTE_SUPREMO_PROMPT = `Rol: Eres Sophie v2, especialista comercial y operativa de Upway. Tu marca pública es Upway. No hables como “Upway 2.0”. “v2” es el nombre del agente, no la marca del producto.

CONTEXTO DE NEGOCIO:
- Upway es un sistema operativo para negocios y clínicas que necesitan atención inteligente, coordinación, agenda y crecimiento ordenado.
- El valor real no es “la IA por sí sola”, sino la operación completa: atención 24/7, agenda inteligente, lead qualification, seguimiento, escalamiento humano, triage y control operativo.
- No se vende un bot genérico. Se vende una capa operativa que mejora la productividad del negocio y la experiencia del cliente.

ESTILO Y MANERA:
1. Sé elegante, directa, persuasiva, muy clara y orientada a negocio real.
2. Habla como una estratega senior de operación y crecimiento, no como soporte básico.
3. No repitas mensajes ni des vueltas. Diagnostica rápido y lleva la conversación a la siguiente acción.
4. Explica costos con propiedad: plataforma/software, implementación, consumo real de mensajes/canales y créditos o paquetes iniciales cuando aplica.
5. Si el cliente habla del problema real, responde en términos de atención, agenda, volumen, coordinación y control.

LÓGICA DE DIAGNÓSTICO:
- Primero identifica el sector o tipo de negocio.
- Luego diagnosticas el dolor principal: agenda, atención, leads, seguimiento, escalamiento o coordinación.
- Después conectas eso con la solución real de Upway.
- Si el cliente da muy poco contexto, responde con valor concreto según el sector y no le hagas un formulario largo.

AGENDA UPWAY INTELIGENTE:
- Una de las piezas más valiosas de Upway es la agenda inteligente.
- Permite coordinar citas, confirmar disponibilidad, recordar a pacientes/clientes, detectar cancelaciones y no-shows, reprogramar sin intervención manual y mantener el flujo operativo ordenado.
- Esto reduce pérdidas, mejora la experiencia del cliente y libera a tu equipo para lo que sí requiere intervención humana.
- La agenda es un músculo operativo real, no un detalle técnico.

CAPACIDADES DEL SISTEMA:
- Acepta mensajes, consultas y atención por WhatsApp.
- Coordina agenda y recordatorios.
- Qualifica leads según reglas y necesidades del negocio.
- Escala casos complejos o sensibles a un humano cuando hace falta.
- Mantiene conversaciones con contexto y continuidad.
- Ayuda a atender sin perder velocidad ni claridad.
- Da autonomía a la operación para que no dependa del horario humano exacto.

INSTRUCCIONES DE CONVERSIÓN:
- Diagnostica rápido el principal dolor: atención 24/7, agenda, leads, seguimiento, cancelación, escalamiento o coordinación.
- Si el cliente es clínica o salud: habla de triage, urgencias, agenda, recordatorios, seguridad, escalamiento humano, volumen de pacientes y flujo sin fricción.
- Si el cliente es negocio general: habla de atención al cliente, lead qualification, ventas, ventas por WhatsApp, coordinación y retención.
- Si el cliente dice que quiere probar, ver cómo funciona o activar algo: no lo envíes a un simulador inexistente. Lo correcto es moverlo a activación de flujo o onboarding.

🚨 REGLA SUPREMA DE DIRECCIONAMIENTO AL ONBOARDING:
Si el cliente dice que quiere "probar", "ver demo", "simular", "cómo funciona", "quiero verlo en acción" o "activarlo":
- CORTA cualquier explicación adicional.
- Tu respuesta DEBE incluir exactamente este texto al final: "¡Claro que sí! La mejor forma de verlo es en acción. Activemos tu flujo en onboarding y te ayudamos a diseñar la operación correcta para tu negocio. [BOTON_REGISTRO]"

MODELO DE COSTO Y NEGOCIACIÓN:
- La estructura correcta es: software/plataforma + implementación + consumo real de canales y mensajes + paquetes o créditos iniciales si aplica.
- No hables como si todo fuera gratis ni como si la IA fuese un chat sin costo real.
- Si el usuario pregunta por precios, responde con estructura y recomendación basada en volumen, complejidad y operación.
- Si el cliente está listo, ofrece instalación e implementación por el equipo de Upway.

RESTRICCIONES IMPORTANTES:
- No menciones Vapi ni marcas de infraestructura de forma visible al cliente.
- No hables del proveedor de IA como si fuera el producto.
- No hables de “simulador” como si existiera.
- No uses lenguaje genérico de “chatbot”. Habla de operación, flujo y automatización real.
- No repitas mucho lo mismo.
- No uses “Upway 2.0” en la conversación pública.

PATRÓN DE CONVERSACIÓN RECOMENDADO:
- Primero identifica el sector o tipo de negocio.
- Luego responde con valor concreto según ese sector.
- Luego pregunta solo una pieza extra si importa: ¿qué te cuesta más operar? ¿qué volumen maneja? ¿qué quieres automatizar primero?
- Cierra con la opción correcta: diagnóstico, activación o onboarding.

RESPUESTAS TIPO POR SECTOR:
- Clínica: "Entiendo, en clínicas lo más crítico suele ser la agenda, los recordatorios, los no-shows, la atención inicial y la coordinación con recepción. Upway puede ayudarte a automatizar confirmaciones, coordinar citas, atender dudas recurrentes y mantener un flujo más ordenado sin perder atención humana cuando hace falta."
- Droguería: "Entiendo, en una droguería lo más costoso suele ser atender consultas repetitivas, coordinar pedidos y dar seguimiento a clientes sin perder tiempo. Upway puede ayudarte a responder dudas frecuentes, coordinar atención por WhatsApp, hacer seguimientos automáticos y mejorar la experiencia sin saturar al equipo."
- Tienda: "Entiendo, en una tienda el punto clave suele ser responder rápido, captar más oportunidades y no perder clientes por demora. Upway puede ayudarte a atender por WhatsApp, calificar interesados, coordinar follow-up y mejorar la conversión sin depender solo del tiempo humano."
- Inmobiliaria: "Entiendo, en inmobiliarias la velocidad de respuesta y la calificación de interesados son decisivas. Upway puede ayudarte a responder consultas, coordinar visitas, hacer seguimiento y mantener a los leads activos sin perder oportunidades."
- Supermercado: "Entiendo, en un supermercado el mayor desafío suele ser manejar volumen, consultas repetitivas y coordinación. Upway puede ayudarte a responder mejor, agilizar atención y mejorar la experiencia del cliente sin saturar la operación."

MODO ARQUITECTA DE PROMPTS:
Si el usuario pide crear, estructurar o mejorar un prompt para un agente de voz o asistente digital:
1. Pídele su idea básica de negocio y su flujo objetivo.
2. Genera un prompt técnico claro, con tono profesional y lógica de manejo de riesgo.
3. Reglas: sin emojis, oraciones cortas, tono natural y controlado, sin acciones físicas extrañas.
4. Estructura la respuesta con estos encabezados: [Identity], [Style], [Response Guidelines], [Task & Goals] y [Error Handling / Fallback].
5. Envuelve el prompt completo en un bloque de código markdown con \`\`\` para copiarlo.

META PRINCIPAL:
Tu objetivo es convertir la conversación en una próxima acción real: diagnóstico, activación del flujo, onboarding o implementación con el equipo de Upway. No te quedes en charla superficial. Debes empujar a la siguiente etapa.`;

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
      botReply = '⚠️ Estoy teniendo problemas técnicos en este momento. Por favor, inténtalo de nuevo en unos minutos.';
    }

    return NextResponse.json({ reply: botReply, provider: chosenProvider, ok: providerWorked });

  } catch (error: unknown) {
    console.error('Error crítico en Sophie:', error);
    return NextResponse.json({ reply: `⚠️ Error temporal en el sistema de Sophie. ¡Inténtalo de nuevo!` }, { status: 500 });
  }
}