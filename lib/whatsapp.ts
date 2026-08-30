// 📱 Lógica de WhatsApp (Meta) extraída del webhook para mantener el route como dispatcher delgado
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ==========================================
// 🧾 TIPOS DEL WEBHOOK DE META Y DE TIENDA
// ==========================================

/** Tienda con su inventario incluido (resultado de prisma.tienda.findFirst con include.productos) */
export type TiendaWithProductos = Prisma.TiendaGetPayload<{ include: { productos: true } }>;

/** Mensaje entrante de WhatsApp (payload de value.messages[0]) */
export interface MetaIncomingMessage {
  from: string;
  id: string;
  type: string;
  text?: { body?: string };
  audio?: { id?: string; mime_type?: string };
}

/** Contacto que envió el mensaje */
export interface MetaContact {
  profile?: { name?: string };
  wa_id?: string;
}

/** Objeto "value" dentro de entry[].changes[] del webhook de Meta */
export interface MetaWebhookValue {
  metadata?: { phone_number_id?: string };
  contacts?: MetaContact[];
  messages?: MetaIncomingMessage[];
  statuses?: Array<{ id: string; status: string; recipient_id?: string; timestamp?: string }>;
}

/** Cuerpo completo del POST del webhook de Meta */
export interface MetaWebhookBody {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{ field?: string; value?: MetaWebhookValue }>;
  }>;
}

export const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'upway_inworker_seguro_2026';
export const UPWAY_PHONE_ID = '1172769935927318'; // 👑 EL NÚMERO VIP DE UPWAY
export const INWORKER_PHONE_ID = '1334640129724588'; // 🚀 EL NUEVO NÚMERO DE INWORKER (SOPHIE)

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

const geminiPremiumApiKey = process.env.GEMINI_PREMIUM_API_KEY || process.env.GEMINI_API_KEY;
const geminiGenAI = geminiPremiumApiKey ? new GoogleGenerativeAI(geminiPremiumApiKey) : null;

const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;

// ==========================================
// 🎙️ TRANSCRIPCIÓN DE AUDIO (Groq Whisper V3)
// ==========================================
export async function transcribirAudioWhatsApp(mediaId: string, metaAccessToken: string): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) throw new Error('Falta GROQ_API_KEY para transcribir');

  // 1. Obtener la URL temporal de descarga desde la API de Meta
  const mediaMetaRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${metaAccessToken}` }
  });

  const mediaMetaData = await mediaMetaRes.json();
  if (!mediaMetaRes.ok || !mediaMetaData.url) {
    throw new Error('No se pudo obtener la URL del audio desde Meta');
  }

  // 2. Descargar el archivo binario del audio usando el token de Meta
  const audioFileRes = await fetch(mediaMetaData.url, {
    headers: { Authorization: `Bearer ${metaAccessToken}` }
  });

  if (!audioFileRes.ok) {
    throw new Error('Error al descargar el archivo de audio de los servidores de Meta');
  }

  const arrayBuffer = await audioFileRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 3. Enviar el buffer a Groq Whisper V3
  const blob = new Blob([buffer], { type: 'audio/ogg' });
  const formData = new FormData();
  formData.append('file', blob, 'whatsapp_audio.ogg');
  formData.append('model', 'whisper-large-v3');
  formData.append('language', 'es');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${groqApiKey}` },
    body: formData
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'Error en transcripción Groq Whisper para WhatsApp');
  }

  const texto = String(data.text || '');
  if (!texto.trim()) throw new Error('La transcripción de WhatsApp devolvió texto vacío');

  return texto;
}

// ==========================================
// 🗄️ SISTEMA FAQ Y RAG
// ==========================================
const FAQ_CACHE = new Map<string, string>();

const BASIC_FAQ_LOOKUPS: Array<{ pattern: RegExp; reply: string; }> = [
  { pattern: /\b(hola|buenas|buenos días|buenas tardes|buenas noches|qué tal|hey)\b/i, reply: '¡Hola! 👋 Soy el asistente digital. ¿Quieres conocer los planes o ver cómo funciona el panel en vivo?' },
  { pattern: /\b(precio|plan|costo|cuesta|valor)\b/i, reply: 'Nuestros planes se adaptan a lo que tu negocio necesita. ¿Quieres que te recomiende el mejor?' },
  { pattern: /\b(direcci[oó]n|d[oó]nde est[aá]|ubicaci[oó]n)\b/i, reply: 'Para conocer la dirección exacta, responde con el nombre del local o el tipo de servicio.' },
  { pattern: /\b(horario|horarios|abre|abren|atenci[oó]n)\b/i, reply: 'Nuestro asistente virtual está disponible 24/7 para responder tus consultas comerciales.' },
  { pattern: /\b(demo|probar|ver demo|simular|cómo funciona)\b/i, reply: '¡Claro que sí! La mejor forma de verlo es en acción. Entra a nuestro panel gratis ahora mismo. [BOTON_REGISTRO]' }
];

const sendMonitorAlert = async (message: string) => {
  if (!ALERT_WEBHOOK_URL) return;
  try {
    await fetch(ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });
  } catch (alertError) {
    console.warn('No se pudo enviar alerta de monitoreo:', alertError);
  }
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, providerName: string) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${providerName} timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
};

const sendProviderAlert = async (provider: string, error: unknown) => {
  const message = `⚠️ Relevo activado en Upway Webhook: ${provider} falló. ${String(error)}`;
  await sendMonitorAlert(message);
};

const limpiarTexto = (txt: string) => txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const normalizeFaqText = (text: string) => limpiarTexto(text).replace(/\s+/g, ' ').trim();

const resolveStaticFaqResponse = (texto: string, tienda?: { direccion?: string }) => {
  const key = normalizeFaqText(texto);
  if (FAQ_CACHE.has(key)) return FAQ_CACHE.get(key) || null;

  const found = BASIC_FAQ_LOOKUPS.find(entry => entry.pattern.test(texto));
  if (found) {
    let response = found.reply;
    if (found.pattern.source.includes('direcci')) {
      if (tienda?.direccion) {
        response = `La dirección es: ${tienda.direccion}.`;
      } else {
        response = 'Puedo ayudarte con la dirección si me dices el nombre de la tienda o el tipo de negocio.';
      }
    }
    FAQ_CACHE.set(key, response);
    if (FAQ_CACHE.size > 200) FAQ_CACHE.clear();
    return response;
  }
  return null;
};

interface Producto { nombre: string; categoria?: string; precio: number; }

function buscarEnInventarioLocal(mensaje: string, todosLosProductos: Producto[]): Producto[] {
  const mensajeLimpio = limpiarTexto(mensaje);
  const palabrasClave = mensajeLimpio.split(' ').filter(p => p.length > 3);
  if (palabrasClave.length === 0) return [];

  return todosLosProductos.filter(prod => {
    const nombreLimpio = limpiarTexto(prod.nombre);
    const categoriaLimpia = prod.categoria ? limpiarTexto(prod.categoria) : "";
    return palabrasClave.some(palabra => nombreLimpio.includes(palabra) || categoriaLimpia.includes(palabra));
  });
}

// ==========================================
// 🛡️ NÚCLEO DE LA CASCADA INQUEBRANTABLE
// ==========================================
export async function generarRespuesta(textoCliente: string, phoneId: string, tiendaRecord: any) {
  let systemPromptText = "";
  const isVip = (phoneId === UPWAY_PHONE_ID || phoneId === INWORKER_PHONE_ID);

  if (isVip) {
    console.log(`👑 Canal VIP (${phoneId}). Preparando IA...`);
    const promptPorDefecto = `Rol: Eres Sophie, la asistente virtual y cerradora de ventas estrella. Tu tono es persuasivo, tecnológico, amigable y muy directo. Tus respuestas deben ser cortas (ideales para WhatsApp) y usar emojis.
        Objetivo Principal: Tu misión es diagnosticar el negocio del cliente y guiarlo en su automatización.
        CALL TO ACTION: Tu cierre de ventas siempre debe ser invitarlos a crear su cuenta en https://upway.business.`;

    systemPromptText = tiendaRecord?.systemPrompt || promptPorDefecto;
  } else {
    console.log(`🏢 Usando base de datos del cliente para el número: ${phoneId}`);

    const faqStaticResponse = resolveStaticFaqResponse(textoCliente, tiendaRecord ? { direccion: tiendaRecord.direccion } : undefined);
    if (faqStaticResponse) {
      console.log('🔍 Respuesta rápida desde caché FAQ o reglas estáticas.');
      return faqStaticResponse;
    }

    const inventarioCompleto: Producto[] = (tiendaRecord?.productos || []).map((p: any) => ({
      nombre: String(p.nombre),
      categoria: p.categoria ? String(p.categoria) : "General",
      precio: Number(p.precio)
    }));

    const productosRelevantes = buscarEnInventarioLocal(textoCliente, inventarioCompleto);
    let contextoInventario = "No hay stock directo en el inventario para esta consulta.";

    if (productosRelevantes.length > 0) {
      contextoInventario = `PRODUCTOS ENCONTRADOS:\n${productosRelevantes.map(p => `- ${p.nombre} - Precio: $${p.precio}`).join('\n')}`;
    }

    const promptCliente = tiendaRecord?.systemPrompt || "Eres un asistente de ventas. Responde corto y con emojis.";
    systemPromptText = `${promptCliente}\n\n=== BASE DE DATOS (SISTEMA RAG) ===\n${contextoInventario}\nRegla RAG: Basa tus respuestas de inventario SOLO en la información de la base de datos entregada arriba.`;
  }

  const formattedMessages = [
    { role: 'system' as const, content: systemPromptText },
    { role: 'user' as const, content: textoCliente }
  ];

  type ProviderConfig = {
    name: string;
    timeout: number;
    run: (client: any) => Promise<string>;
    client?: any;
  };

  const openAiCompatible = (model: string) => async (client: any) => {
    const completion = await client.chat.completions.create({
      model,
      messages: formattedMessages,
      temperature: 0.3,
    });
    return completion.choices[0]?.message?.content || '';
  };

  const providerConfigs: ProviderConfig[] = [
    { name: 'Groq 🚀 (Plan A)', client: groqClient, timeout: 3500, run: openAiCompatible('openai/gpt-oss-20b') },
    { name: 'SambaNova ⚡ (Plan B)', client: sambanovaClient, timeout: 3500, run: openAiCompatible('Meta-Llama-3.1-8B-Instruct') },
    { name: 'Mistral 🔥 (Plan C)', client: mistralClient, timeout: 3500, run: openAiCompatible('mistral-small-latest') },
    { name: 'OpenRouter 🃏 (Plan D)', client: openRouterClient, timeout: 3500, run: openAiCompatible('openrouter/free') },
    {
      name: 'Gemini Premium 🛡️ (Escudo Final)',
      client: geminiGenAI,
      timeout: 4500,
      run: async (client: any) => {
        const model = client.getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction: systemPromptText,
          generationConfig: { temperature: 0.45, maxOutputTokens: 280 }
        });
        const result = await model.generateContent(textoCliente);
        return result.response.text();
      }
    }
  ];

  const providers = providerConfigs
    .filter(p => p.client)
    .map(p => ({ name: p.name, timeout: p.timeout, execute: () => p.run(p.client) }));

  let lastError: unknown;
  for (const provider of providers) {
    try {
      const reply = await withTimeout(provider.execute(), provider.timeout, provider.name);
      if (!reply || !reply.trim()) throw new Error(`${provider.name} devolvió respuesta vacía`);

      console.log(`✅ [WEBHOOK] Respondido exitosamente con: ${provider.name}`);
      return reply;
    } catch (error) {
      console.warn(`🔴 ERROR EXACTO DE ${provider.name}:`, error);
      console.warn(`⚠️ [WEBHOOK] ${provider.name} falló. Activando relevo...`);
      await sendProviderAlert(provider.name, error);
      lastError = error;
    }
  }

  console.error('🔴 CRÍTICO: Todos los motores de la cascada fallaron en el Webhook.', lastError);
  return "⚠️ Estoy recibiendo demasiados mensajes en este momento. Por favor, escríbeme en un par de minutos.";
}

// ==========================================
// 📱 CONEXIÓN CON META (WHATSAPP)
// ==========================================
export async function enviarMensajePorWhatsApp(destinoTelefono: string, mensaje: string, phoneId: string, dynamicToken: string): Promise<string | null> {
  if (!dynamicToken || !phoneId) throw new Error('Credenciales de WhatsApp no configuradas para esta tienda.');

  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

  const payload: any = {
    messaging_product: 'whatsapp',
    to: destinoTelefono,
    type: 'text',
    text: { body: mensaje }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${dynamicToken}` },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Error API WhatsApp: ${JSON.stringify(data)}`);
    }

    console.log(`✅ Mensaje enviado exitosamente a ${destinoTelefono}`);
    return data.messages?.[0]?.id || null;
  } catch (error) {
    console.error('❌ Error enviando a Meta:', error);
    return null;
  }
}

// ==========================================
// 📡 ACTUALIZACIÓN DE ESTATUS (DOBLE CHECK AZUL)
// ==========================================
export async function handleStatusUpdate(value: MetaWebhookValue): Promise<void> {
  for (const statusObj of value.statuses || []) {
    const metaMessageId = statusObj.id;
    const currentStatus = statusObj.status;

    try {
      await prisma.message.update({
        where: { metaMessageId: metaMessageId },
        data: { status: currentStatus }
      });
    } catch (e) {
      // Ignoramos si el mensaje no existe en la DB
    }
  }
}

// ==========================================
// 🚨 HUMAN HANDOFF INTELIGENTE & DINÁMICO
// ==========================================
async function handleHumanHandoff(params: {
  userPhone: string;
  userName: string;
  phoneIdDestino: string;
  dynamicToken: string;
  tiendaRecord: TiendaWithProductos | null;
  conversationId: string | null;
}): Promise<void> {
  const { userPhone, userName, phoneIdDestino, dynamicToken, tiendaRecord, conversationId } = params;

  console.log('🚨 SOLICITUD DE HUMANO DETECTADA. Apagando IA...');

  if (tiendaRecord && tiendaRecord.id) {
    await prisma.tienda.update({
      where: { id: tiendaRecord.id },
      data: { isAiActive: false }
    });
  }

  const msgCliente = "Comprendo perfectamente. Te voy a transferir con uno de nuestros asesores humanos. Por favor, dame un momento.";
  await enviarMensajePorWhatsApp(userPhone, msgCliente, phoneIdDestino, dynamicToken);

  // 🚀 DINÁMICO: Usamos el celular guardado por el admin en su onboarding (o un fallback)
  const numeroAdmin = tiendaRecord?.telefonoAdmin || "573116778098";
  const linkPanel = "https://upway.business/dashboard/inbox";
  const msgAdmin = `🚨 *ALERTA UPWAY*\n\nEl cliente ${userName || userPhone} requiere asistencia humana.\nLa IA se ha pausado automáticamente.\n\nAtiende el chat aquí:\n${linkPanel}`;

  await enviarMensajePorWhatsApp(numeroAdmin, msgAdmin, phoneIdDestino, dynamicToken);

  if (conversationId) {
    await prisma.message.create({
      data: {
        conversationId,
        metaMessageId: "handoff_" + Date.now(),
        senderRole: 'AI',
        content: msgCliente,
        status: 'sent'
      }
    });
  }
}

// ==========================================
// 💬 PROCESAMIENTO DE MENSAJES ENTRANTES (TEXTO Y AUDIO)
// ==========================================
export async function handleIncomingMessage(value: MetaWebhookValue): Promise<void> {
  try {
    const mensajeEntrante = value.messages?.[0];
    if (!mensajeEntrante) return;
    const userPhone = mensajeEntrante.from;
    const phoneIdDestino = value.metadata?.phone_number_id || "";
    const msgIdEntrante = mensajeEntrante.id;
    const userName = value.contacts?.[0]?.profile?.name || 'Cliente';
    const messageType = mensajeEntrante.type; // 'text' o 'audio'

    let tiendaRecord: TiendaWithProductos | null = null;
    let dynamicToken = process.env.WHATSAPP_TOKEN || "";
    let conversationId: string | null = null;

    // 🚀 Búsqueda de Tienda y Token
    if (phoneIdDestino !== UPWAY_PHONE_ID) {
      tiendaRecord = await prisma.tienda.findFirst({
        where: { metaPhoneNumberId: phoneIdDestino },
        include: { productos: true }
      });

      if (!tiendaRecord) {
        console.warn(`⚠️ Mensaje ignorado: No hay tienda vinculada al número ${phoneIdDestino}`);
        return;
      }
      dynamicToken = tiendaRecord.metaAccessToken || "";
    }

    // ====================================================
    // 🎙️ PASO CLAVE: EXTRACCIÓN DE TEXTO O TRANSCRIBIR AUDIO
    // ====================================================
    let textoCliente = '';

    if (messageType === 'text') {
      textoCliente = mensajeEntrante.text?.body ?? '';
    } else if (messageType === 'audio') {
      const mediaId = mensajeEntrante.audio?.id;
      if (mediaId && dynamicToken) {
        try {
          console.log(`🎤 Nota de voz detectada en WhatsApp. Transcribiendo con Groq Whisper...`);
          textoCliente = await transcribirAudioWhatsApp(mediaId, dynamicToken);
          console.log(`✅ Audio transcrito con éxito: "${textoCliente}"`);
        } catch (audioErr) {
          console.error('❌ Error transcribiendo audio de WhatsApp:', audioErr);
          textoCliente = "Hola, intenté enviarte una nota de voz pero no logré procesarla bien. ¿Podrías escribirme tu consulta?";
        }
      } else {
        textoCliente = "Recibí tu nota de voz, pero faltan credenciales de audio.";
      }
    } else {
      // Si envían imágenes, documentos o stickers
      textoCliente = `[El cliente envió un archivo multimedia de tipo: ${messageType}]`;
    }

    if (!textoCliente.trim()) return;

    // Si es tienda de cliente real, guardamos en CRM
    if (phoneIdDestino !== UPWAY_PHONE_ID && tiendaRecord) {
      const conversation = await prisma.conversation.upsert({
        where: {
          tiendaId_clientPhone: { tiendaId: tiendaRecord.id, clientPhone: userPhone }
        },
        update: { updatedAt: new Date(), clientName: userName },
        create: {
          tiendaId: tiendaRecord.id,
          clientPhone: userPhone,
          clientName: userName
        }
      });

      conversationId = conversation.id;

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          metaMessageId: msgIdEntrante,
          senderRole: 'USER',
          content: textoCliente,
          status: 'delivered'
        }
      });

      // 🛑 BOTÓN DE PAUSA: Si IA está inactiva, silenciamos bot
      if (!tiendaRecord.isAiActive) {
        console.log(`🛑 [MODO HUMANO ACTIVO] Mensaje de ${userPhone} guardado en Inbox. IA silenciada.`);
        return;
      }
    }

    // 🤖 GENERACIÓN DE IA
    const respuesta = await generarRespuesta(textoCliente, phoneIdDestino, tiendaRecord);

    if (respuesta.includes('[TRANSFERIR_HUMANO]')) {
      await handleHumanHandoff({ userPhone, userName, phoneIdDestino, dynamicToken, tiendaRecord, conversationId });
      return;
    }

    // 📤 ENVÍO A META
    const outMessageId = await enviarMensajePorWhatsApp(userPhone, respuesta, phoneIdDestino, dynamicToken);

    if (conversationId && outMessageId) {
      await prisma.message.create({
        data: {
          conversationId: conversationId,
          metaMessageId: outMessageId,
          senderRole: 'AI',
          content: respuesta,
          status: 'sent'
        }
      });
    }

  } catch (error) {
    console.error('Fallo general en la respuesta del bot.', error);
  }
}
