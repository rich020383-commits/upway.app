import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit';
import { retrieve } from '@/lib/sophie/rag';
import { buildSophieSystemPrompt } from '@/lib/sophie/prompt';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { LEGAL_ENTITY } from '@/lib/legal';

/**
 * Limite de peticiones por IP.
 *
 * FIX AUDITORIA A12: este endpoint no tenia limite. Cualquiera podia hacer loop
 * sobre el y agotar la cuota pagada de los proveedores de LLM (Gemini, Groq,
 * OpenRouter, Cerebras...), dejando sin servicio a los usuarios reales.
 *
 * 30 peticiones/minuto es holgado para un chat humano real (incluida la
 * transcripcion de notas de voz) y corta el abuso trivial por script.
 * Ajustable por entorno para no recompilar en cada cambio de operacion.
 */
const SOPHIE_RATE_LIMIT = {
  limit: Number(process.env.SOPHIE_RATE_LIMIT ?? 30),
  windowMs: Number(process.env.SOPHIE_RATE_WINDOW_MS ?? 60_000),
};

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

// 🔥 El prompt maestro de Sophie ya no está hardcodeado aquí: se compone por
// request en lib/sophie/prompt.ts (buildSophieSystemPrompt) con el contexto RAG
// de lib/sophie/knowledge.ts + lib/sophie/rag.ts. Precios del catálogo oficial
// sí; costos internos y de proveedores, nunca.


// 🚨 Handoff web -> humano. Por política interna Upway no usa ni integra
// plataformas de mensajeria ni redes de Meta, así que el traspaso sale por correo al equipo comercial.
// Se puede sobreescribir con HUMAN_TRANSFER_EMAIL.
const HUMAN_TRANSFER_EMAIL = process.env.HUMAN_TRANSFER_EMAIL || 'contacto@upway.business';

/**
 * Marcadores que emite Sophie en su respuesta. `[BOTON_REGISTRO]` puede venir
 * con vertical (`[BOTON_REGISTRO:inmobiliaria]`) para que el botón de registro
 * no mande a un prospecto de inmobiliarias al onboarding clínico.
 */
const SOPHIE_MARKER_RE = /\[(BOTON_REGISTRO(?::[a-z-]+)?|CONTACTAR_ASESOR)\]/g;

const buildAdvisorLink = (messages: SophieMessage[]): string => {
  // 🧠 Contexto completo del handoff: el equipo humano debe leer el correo
  // sabiendo de qué habló el cliente con Sophie, no solo su última frase.
  const conversacion = [...messages]
    .filter((m) => (m.role !== 'system') && m.content?.trim())
    .slice(-6) // últimos 6 turnos (usuario + Sophie) para no pasarnos de longitud
    .map((m) => {
      const esBot = m.role === 'bot' || m.role === 'assistant' || m.role === 'model';
      const texto = m.content!.replace(SOPHIE_MARKER_RE, '').trim();
      return `${esBot ? 'Sophie' : 'Cliente'}: ${texto.slice(0, 220)}`;
    })
    .join('\n');

  const contexto = conversacion ? `\n\nResumen de mi conversación con Sophie:\n${conversacion}` : '';
  const cuerpo = encodeURIComponent(
    `Hola, vengo del chat de Sophie en la web. Quiero hablar con una persona del equipo de Upway.${contexto}`
  );
  const asunto = encodeURIComponent('Chat con Sophie: quiero hablar con el equipo');
  return `mailto:${HUMAN_TRANSFER_EMAIL}?subject=${asunto}&body=${cuerpo}`;
};

// 🚨 Detección server-side de petición EXPLÍCITA de asesor humano.
// Los precios ya NO fuerzan el handoff: Sophie responde con el catálogo oficial
// (RAG sobre lib/sophie/knowledge.ts). Este patrón solo garantiza el marcador
// [CONTACTAR_ASESOR] cuando el cliente pide persona real.
const HUMAN_INTENT_PATTERN = /\b(humano|humanos|asesor|asesora|asesores|persona real|hablar con alguien|me atienda|agente real)\b/i;

const humanIntentReply = 'Con gusto te atiende una persona de nuestro equipo. Te dejo el contacto directo para que te respondan lo antes posible: [CONTACTAR_ASESOR]';

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
  // FIX AUDITORIA A12: freno de cuota antes de tocar cualquier proveedor de LLM.
  const rate = checkRateLimit(`sophie:${getClientIp(req)}`, SOPHIE_RATE_LIMIT);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        reply:
          'Estamos recibiendo muchas solicitudes desde tu conexión. Espera unos segundos e inténtalo de nuevo, por favor.',
      },
      { status: 429, headers: rateLimitHeaders(rate) }
    );
  }

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

    // 🧠 RAG: recupera el conocimiento oficial de Upway relevante para la última
    // consulta del cliente (planes, precios, políticas, FAQ, activación) y compone
    // el system prompt con contexto. Los precios salen del catálogo canónico;
    // los costos internos y de proveedores jamás salen de aquí.
    const lastUserText = [...(messages as SophieMessage[])]
      .reverse()
      .find((m) => m.role !== 'bot' && m.role !== 'assistant' && m.role !== 'model')
      ?.content
      ?.trim() || '';
    const systemPrompt = buildSophieSystemPrompt(retrieve(lastUserText));

    const openAiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
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
        max_tokens: 800
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
            systemInstruction: systemPrompt,
            generationConfig: { temperature: 0.45, maxOutputTokens: 800 }
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

    // 🔍 Extrae datos de contacto de los mensajes del usuario para crear el lead
    const extractContactInfo = (msgs: SophieMessage[]): { name?: string; phone?: string; email?: string } => {
      const userMsgs = msgs.filter((m) => (m.role === 'user') && m.content?.trim());
      const lastUser = userMsgs[userMsgs.length - 1]?.content || '';
      const allUserText = userMsgs.map((m) => m.content).join(' ');

      const nameMatch = allUserText.match(/(?:me llamo|mi nombre es|soy)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ ]{2,40})/i);
      const phoneMatch = allUserText.match(/(\+?57\s?)?3\d{2}\s?\d{3}\s?\d{4}/);
      const emailMatch = allUserText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

      return {
        name: nameMatch?.[1]?.trim(),
        phone: phoneMatch?.[0],
        email: emailMatch?.[1],
      };
    };

    // 🚨 HANDOFF WEB -> HUMANO: si el cliente pidió explícitamente una persona,
    // se garantiza el marcador [CONTACTAR_ASESOR] (aunque el LLM no lo genere),
    // se crea el lead y se notifica al equipo por correo.
    let advisorLink: string | null = null;
    let leadId: string | null = null;
    if (detectHumanIntent(messages)) {
      if (!botReply.includes('[CONTACTAR_ASESOR]')) {
        botReply = humanIntentReply;
      }
      advisorLink = buildAdvisorLink(messages);

      const contacto = extractContactInfo(messages);

      const lead = await prisma.lead.create({
        data: {
          name: contacto.name || 'Cliente (chat web)',
          phone: contacto.phone || null,
          email: contacto.email || null,
          interest: 'Consulta desde chat web',
          notes: contacto.name ? `Contacto vía chat web de Upway.${contacto.email ? ` Email: ${contacto.email}` : ''}` : null,
          status: 'NEW',
          source: 'sophie-web-chat',
          sourceCallId: null,
          sourceCallPhone: null,
          sourceCallDuration: null,
          estimatedValue: null,
          segment: 'general',
          nextContactAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      leadId = lead.id;

      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: 'CREATED',
          message: 'Lead capturado por Sophie (chat web)',
          metadata: {
            source: 'sophie-web-chat',
            advisorLink,
          },
        },
      });

      const emailHtml = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8" /><title>Nuevo Lead de Sophie - Chat Web</title></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"><tr><td style="background-color: #1b5ed6; padding: 24px; text-align: center;"><h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">💬 Nuevo Lead de Sophie - Chat Web</h1><p style="color: #e2e8f0; margin: 8px 0 0; font-size: 14px;">${LEGAL_ENTITY} · ${new Date().toLocaleDateString('es-CO')}</p></td></tr><tr><td style="padding: 24px;"><h2 style="color: #0f172a; margin: 0 0 16px; font-size: 18px;">Datos del Lead</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;"><tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155; white-space: nowrap;">Nombre:</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${contacto.name || 'No proporcionado'}</td></tr><tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155; white-space: nowrap;">Teléfono:</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a;"><a href="tel:${contacto.phone || ''}" style="color: #1b5ed6; text-decoration: none;">${contacto.phone || 'No proporcionado'}</a></td></tr>${contacto.email ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155; white-space: nowrap;">Email:</td><td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a;"><a href="mailto:${contacto.email}" style="color: #1b5ed6; text-decoration: none;">${contacto.email}</a></td></tr>` : ''}</table></td></tr><tr><td style="padding: 24px;"><h2 style="color: #0f172a; margin: 0 0 16px; font-size: 18px;">Contexto de la conversación</h2><p style="color: #334155; font-size: 14px; line-height: 1.6;">El cliente solicitó hablar con un asesor humano a través del chat web de Sophie.</p></td></tr><tr><td style="padding: 24px; text-align: center;"><a href="${process.env.NEXTAUTH_URL ?? 'https://upway.app'}/leads/${lead.id}" style="background-color: #1b5ed6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">Ver lead en Upway</a></td></tr></table></body></html>`;

      const emailText = `NUEVO LEAD DE SOPHIE - CHAT WEB
========================================
Nombre: ${contacto.name || 'No proporcionado'}
Teléfono: ${contacto.phone || 'No proporcionado'}
${contacto.email ? `Email: ${contacto.email}` : ''}
Lead ID: ${lead.id}
Fecha: ${new Date().toLocaleDateString('es-CO')}
Ver lead: ${process.env.NEXTAUTH_URL ?? 'https://upway.app'}/leads/${lead.id}
${LEGAL_ENTITY} · Bogotá, Colombia`;

      await sendEmail({
        to: process.env.UPWAY_REVIEW_EMAIL || 'activacionplan@upway.business',
        subject: `[Upway] Nuevo Lead de Sophie (Chat Web): ${contacto.name || 'Sin nombre'}`,
        html: emailHtml,
        text: emailText,
        replyTo: contacto.email || undefined,
      });
    }

    return NextResponse.json({ reply: botReply, provider: chosenProvider, ok: providerWorked, advisorLink, leadId });

  } catch (error: unknown) {
    console.error('Error crítico en Sophie:', error);
    return NextResponse.json({ reply: `⚠️ Error temporal en el sistema de Sophie. ¡Inténtalo de nuevo!` }, { status: 500 });
  }
}