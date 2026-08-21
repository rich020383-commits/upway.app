import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as GenerativeAI from '@google/generative-ai';
import { listProducts } from '@/lib/app-state';
import { google } from 'googleapis';

// ==========================================
// 📅 CONFIGURACIÓN DE GOOGLE CALENDAR
// ==========================================
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
}

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

async function crearEventoCalendario(asunto: string, fechaInicio: string, fechaFin: string) {
  try {
    const event = {
      summary: asunto,
      start: { dateTime: fechaInicio, timeZone: 'America/Bogota' }, 
      end: { dateTime: fechaFin, timeZone: 'America/Bogota' },
    };
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
    return response.data.htmlLink; 
  } catch (error) {
    console.error("Error agendando en Calendar:", error);
    throw new Error("No pude conectar con el calendario.");
  }
}

// ==========================================
// 🧠 INICIALIZACIÓN DE MOTORES DE CASCADA (SaaS Upway)
// ==========================================
const groqClient = process.env.GROQ_API_KEY 
  ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' }) 
  : null;

const mistralClient = process.env.MISTRAL_API_KEY 
  ? new OpenAI({ apiKey: process.env.MISTRAL_API_KEY, baseURL: 'https://api.mistral.ai/v1' }) 
  : null;

const openRouterClient = process.env.OPENROUTER_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: 'https://openrouter.ai/api/v1' }) 
  : null;

// El escudo final: Tu Gemini Premium con saldo precargado
const geminiPremiumApiKey = process.env.GEMINI_PREMIUM_API_KEY;
const geminiGenAI = geminiPremiumApiKey ? new GenerativeAI.GoogleGenerativeAI(geminiPremiumApiKey) : null;

const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;
const AUDIO_TRANSCRIPTION_TIMEOUT_MS = 5000;
const PROVIDER_TIMEOUT_MS = 8000; 

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
  const message = `⚠️ Relevo activado en Simulador: ${provider} falló. ${String(error)}`;
  await sendMonitorAlert(message);
};

// ==========================================
// 🎤 TRANSCRIPCIÓN DE AUDIO (Whisper V3 - Groq)
// ==========================================
async function transcribirAudioUsuario(audioUsuario: string) {
  const base64Data = audioUsuario.split(',')[1] || audioUsuario;
  const buffer = Buffer.from(base64Data, 'base64');

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) throw new Error('Falta GROQ_API_KEY');

  const blob = new Blob([buffer], { type: 'audio/webm' });
  const formData = new FormData();
  formData.append('file', blob, 'nota_de_voz.webm');
  formData.append('model', 'whisper-large-v3');
  formData.append('language', 'es');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUDIO_TRANSCRIPTION_TIMEOUT_MS);
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqApiKey}` },
      body: formData,
      signal: controller.signal
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error?.message || 'Error en transcripción Groq Whisper');
    }

    const texto = String(data.text || '');
    if (!texto.trim()) throw new Error('Transcripción Groq devolvió texto vacío');
    return texto;
  } catch (error) {
    if ((error as { name?: string })?.name === 'AbortError') {
      throw new Error('Groq Whisper agotó el timeout de transcripción');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

const formatProviderError = (error: unknown) => {
  const anyError = error as { status?: number; message?: string; code?: string };
  const status = anyError?.status;
  const message = anyError?.message || String(error);
  return status ? `HTTP ${status} — ${message}` : message;
};

const isBillingOrAuthError = (error: unknown) => {
  const status = (error as { status?: number })?.status;
  return status === 401 || status === 402 || status === 403;
};

// ==========================================
// 📦 LÓGICA RAG (INVENTARIO)
// ==========================================
const limpiarTexto = (txt: string) => 
  txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

type InventoryItem = {
  nombre: string;
  categoria?: string;
  precio?: number;
  [key: string]: unknown;
};

type HistoryMessage = {
  rol?: string;
  texto?: string;
  content?: string;
  [key: string]: unknown;
};

type ChatMessage = {
  role: 'system' | 'assistant' | 'user';
  content: string;
};

function buscarEnInventarioLocal(mensaje: string, todosLosProductos: InventoryItem[]) {
  const mensajeLimpio = limpiarTexto(mensaje);
  const palabrasClave = mensajeLimpio.split(' ').filter(p => p.length > 2);
  
  if (palabrasClave.length === 0) return []; 
  
  return todosLosProductos.filter(prod => {
    const nombreLimpio = limpiarTexto(prod.nombre);
    const categoriaLimpia = prod.categoria ? limpiarTexto(prod.categoria) : "";

    return palabrasClave.some(palabra => 
      nombreLimpio.includes(palabra) || 
      categoriaLimpia.includes(palabra)
    );
  });
}

// ==========================================
// 🚀 ENDPOINT PRINCIPAL (POST)
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      promptMaestro = 'Eres un asistente cordial.', 
      mensajeUsuario, 
      audioUsuario, 
      historial = [] as HistoryMessage[], 
      tienda_id = '1172769935927318' 
    } = body;

    let textoProcesado = mensajeUsuario || '';
    let botReply = '';
    let usedProvider = '';

    // 1. TRANSCRIPCIÓN
    if (audioUsuario) {
      console.log("🎤 Audio detectado, procesando con Whisper V3...");
      try {
        textoProcesado = await transcribirAudioUsuario(audioUsuario);
        console.log(`✅ Transcripción exitosa: "${textoProcesado}"`);
      } catch (errorAudio) {
        console.error("🔴 Error en transcripción de audio:", errorAudio);
        return NextResponse.json({ respuesta: 'Lo siento, no logré escuchar bien tu nota de voz. ¿Podrías escribirlo?' });
      }
    }

    if (!textoProcesado) {
       return NextResponse.json({ error: 'Se requiere texto o audio para procesar' }, { status: 400 });
    }

    // 2. RAG INVENTARIO
    let inventarioCompleto: InventoryItem[] = [];
    try {
      inventarioCompleto = await listProducts(tienda_id);
    } catch (dbError) {
      console.error("Error al obtener inventario de la DB:", dbError);
    }
    
    if (!inventarioCompleto || inventarioCompleto.length === 0) {
      inventarioCompleto = [
        { nombre: "Zapatos Nike de Prueba", categoria: "Calzado", precio: 250000 },
        { nombre: "Camiseta Polo de Prueba", categoria: "Ropa", precio: 60000 },
        { nombre: "Gorra Deportiva de Prueba", categoria: "Accesorios", precio: 35000 }
      ];
    }

    const productosRelevantes = buscarEnInventarioLocal(textoProcesado, inventarioCompleto);
    
    let contextoInventario = "No se encontraron coincidencias directas en el inventario con lo que pregunta el cliente.";
    if (productosRelevantes.length > 0) {
       contextoInventario = `PRODUCTOS ENCONTRADOS RELEVANTES A LA CONSULTA ACTUAL:\n${productosRelevantes.map(p => `- ${p.nombre} (Categoría: ${p.categoria || 'N/A'}) - Precio: $${p.precio}`).join('\n')}`;
    }

    const fechaActual = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });

    const systemPromptText = `Comportate ESTRICTAMENTE según estas instrucciones de tu jefe: 
    ${promptMaestro}
    
    INFORMACIÓN VITAL PARA TI (SOPHIE):
    - Hoy es: ${fechaActual} (Hora de Colombia). Usa esta fecha actual para calcular los días.
    - REGLA DE ORO ESTRICTA: Cuando el usuario te pida agendar una reunión y te dé los detalles (Asunto, Fecha y Hora), ESTÁS OBLIGADA a utilizar la herramienta 'agendar_reunion'. NUNCA generes texto simulando que programaste la cita. DEBES ejecutar la herramienta.
    
    === BASE DE DATOS (SISTEMA RAG) ===
    ${contextoInventario}
    
    Regla RAG: Si el cliente pregunta por un producto y aparece en la Base de Datos arriba, ofrécelo. Si no aparece, dile elegantemente que no hay stock actual de ese artículo.`;

    const formattedMessages: ChatMessage[] = [
      { role: 'system', content: systemPromptText },
      ...historial.map((msg: HistoryMessage) => ({
        role: (msg.rol === 'ia' || msg.rol === 'asistente' || msg.rol === 'bot') ? 'assistant' : 'user',
        content: String(msg.texto || msg.content || '')
      })),
      { role: 'user', content: textoProcesado }
    ];

    const herramientas_ia = [{
      type: "function" as const,
      function: {
        name: "agendar_reunion",
        description: "Usa esta herramienta SOLO cuando el usuario te pida explícitamente agendar o programar una reunión, cita o evento.",
        parameters: {
          type: "object",
          properties: {
            asunto: { type: "string", description: "El tema o título de la reunión" },
            fechaInicio: { type: "string", description: "Fecha y hora exacta de inicio en formato ISO 8601 (ej. '2026-08-20T10:00:00-05:00')" },
            fechaFin: { type: "string", description: "Fecha y hora exacta de finalización en formato ISO 8601 (sumar 1 hora a la de inicio)" }
          },
          required: ["asunto", "fechaInicio", "fechaFin"]
        }
      }
    }];

    // 3. LA CASCADA ACTUALIZADA
    const providers = [
      {
        name: 'Groq 🚀',
        enabled: !!groqClient,
        execute: async () => {
          const completion = await groqClient!.chat.completions.create({
            model: 'openai/gpt-oss-120b', // Modelo actualizado recomendado por Groq
            messages: formattedMessages,
            temperature: 0.3,
            tools: herramientas_ia,
            tool_choice: "auto"
          });
          const message = completion.choices[0]?.message;
          const textoRespuesta = message?.content || '';

          if (message?.tool_calls && message.tool_calls.length > 0) {
            console.log("🛠️ ¡Sophie usó Calendar con Groq de forma nativa!");
            const args = JSON.parse((message.tool_calls[0] as any).function.arguments);
            const inicio = args.fechaInicio || args.fecha_inicio;
            const fin = args.fechaFin || args.fecha_fin;
            await crearEventoCalendario(args.asunto, inicio, fin);
            return `¡Listo! Acabo de agendar tu cita "${args.asunto}". Todo quedó confirmado en la agenda.`;
          }

          if (textoRespuesta.includes('agendar_reunion') && textoRespuesta.includes('{')) {
            try {
              const jsonMatch = textoRespuesta.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                let args = parsed;
                if (parsed.tool_calls) args = parsed.tool_calls[0].args || (parsed.tool_calls[0].function && parsed.tool_calls[0].function.arguments);
                if (typeof args === 'string') args = JSON.parse(args);
                const inicio = args.fechaInicio || args.fecha_inicio;
                const fin = args.fechaFin || args.fecha_fin;
                await crearEventoCalendario(args.asunto, inicio, fin);
                return `¡Listo! Logré agendar tu cita "${args.asunto}". Todo confirmado.`;
              }
            } catch (e) {
              console.log("Fallo al forzar el JSON de Groq:", e);
            }
          }
          return textoRespuesta;
        }
      },
      {
        name: 'Mistral 🔥',
        enabled: !!mistralClient,
        execute: async () => {
          const completion = await mistralClient!.chat.completions.create({
            model: 'ministral-3b-2512',
            messages: formattedMessages,
            temperature: 0.3,
            tools: herramientas_ia,
            tool_choice: "auto"
          });
          const message = completion.choices[0]?.message;
          const textoRespuesta = message?.content || '';

          if (message?.tool_calls && message.tool_calls.length > 0) {
            console.log("🛠️ ¡Sophie usó Calendar con Mistral de forma nativa!");
            const args = JSON.parse((message.tool_calls[0] as any).function.arguments);
            const inicio = args.fechaInicio || args.fecha_inicio;
            const fin = args.fechaFin || args.fecha_fin;
            await crearEventoCalendario(args.asunto, inicio, fin);
            return `¡Listo! Acabo de agendar tu cita "${args.asunto}". Todo quedó confirmado en la agenda.`;
          }

          if (textoRespuesta.includes('agendar_reunion') && textoRespuesta.includes('{')) {
            try {
              const jsonMatch = textoRespuesta.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                let args = parsed;
                if (parsed.tool_calls) args = parsed.tool_calls[0].args || (parsed.tool_calls[0].function && parsed.tool_calls[0].function.arguments);
                if (typeof args === 'string') args = JSON.parse(args);
                const inicio = args.fechaInicio || args.fecha_inicio;
                const fin = args.fechaFin || args.fecha_fin;
                await crearEventoCalendario(args.asunto, inicio, fin);
                return `¡Listo! Logré agendar tu cita "${args.asunto}". Todo confirmado.`;
              }
            } catch (e) {
              console.log("Fallo al forzar el JSON de Mistral:", e);
            }
          }
          return textoRespuesta;
        }
      },
      {
        name: 'OpenRouter 🃏 (Free Tier)',
        enabled: !!openRouterClient,
        execute: async () => {
          const completion = await openRouterClient!.chat.completions.create({
            model: 'openrouter/free',
            messages: formattedMessages,
            temperature: 0.3,
            tools: herramientas_ia,
            tool_choice: "auto"
          });
          const message = completion.choices[0]?.message;
          const textoRespuesta = message?.content || '';

          if (message?.tool_calls && message.tool_calls.length > 0) {
            console.log("🛠️ ¡Sophie usó Calendar con OpenRouter de forma nativa!");
            const args = JSON.parse((message.tool_calls[0] as any).function.arguments);
            const inicio = args.fechaInicio || args.fecha_inicio;
            const fin = args.fechaFin || args.fecha_fin;
            await crearEventoCalendario(args.asunto, inicio, fin);
            return `¡Listo! Acabo de agendar tu cita "${args.asunto}". Todo quedó confirmado en la agenda.`;
          }

          if (textoRespuesta.includes('agendar_reunion') && textoRespuesta.includes('{')) {
            try {
              const jsonMatch = textoRespuesta.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                let args = parsed;
                if (parsed.tool_calls) args = parsed.tool_calls[0].args || (parsed.tool_calls[0].function && parsed.tool_calls[0].function.arguments);
                if (typeof args === 'string') args = JSON.parse(args);
                const inicio = args.fechaInicio || args.fecha_inicio;
                const fin = args.fechaFin || args.fecha_fin;
                await crearEventoCalendario(args.asunto, inicio, fin);
                return `¡Listo! Logré agendar tu cita "${args.asunto}". Todo confirmado.`;
              }
            } catch (e) {
              console.log("Fallo al forzar el JSON de OpenRouter:", e);
            }
          }
          return textoRespuesta;
        }
      },
      {
        name: 'Gemini Premium 🛡️ (Escudo Final)',
        enabled: !!geminiGenAI,
        execute: async () => {
          const geminiModel = geminiGenAI!.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: systemPromptText
          });
          const contents = formattedMessages
            .filter(m => m.role !== 'system')
            .map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }]
            }));

          const result = await geminiModel.generateContent({ contents });
          return result.response.text();
        }
      }
    ];

    let lastError: unknown;
    for (const provider of providers) {
      if (!provider.enabled) continue;
      try {
        const reply = await withTimeout(provider.execute(), PROVIDER_TIMEOUT_MS, provider.name);
        if (!reply || !reply.trim()) {
          throw new Error(`${provider.name} devolvió respuesta vacía`);
        }
        botReply = reply;
        usedProvider = provider.name;
        break;
      } catch (providerError) {
        const errorMessage = formatProviderError(providerError);
        if (isBillingOrAuthError(providerError)) {
          console.warn(`⚠️ ${provider.name} no disponible por error de facturación: ${errorMessage}. Relevo siguiente...`);
        } else {
          console.warn(`⚠️ ${provider.name} falló. Activando relevo... ${errorMessage}`);
        }
        await sendProviderAlert(provider.name, providerError);
        lastError = providerError;
      }
    }

    if (!usedProvider) {
      console.error('🔴 CRÍTICO: Todos los motores de la cascada fallaron.', lastError);
      botReply = "⚠️ Error crítico: Los sistemas de IA están experimentando alta demanda. Intenta en un momento.";
      usedProvider = 'Ninguno (Fallo en Cascada)';
    }

    return NextResponse.json({ respuesta: botReply, provider: usedProvider });

  } catch (error) {
    console.error('Error en el simulador:', error);
    return NextResponse.json({ error: 'Fallo al procesar la simulación' }, { status: 500 });
  }
}