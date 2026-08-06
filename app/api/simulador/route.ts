import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as GenerativeAI from '@google/generative-ai';
import { listProducts } from '@/lib/app-state';

// --- INICIALIZACIÓN DE LOS 4 NIVELES (SaaS) --- //
const cerebrasClient = process.env.CEREBRAS_API_KEY 
  ? new OpenAI({ apiKey: process.env.CEREBRAS_API_KEY, baseURL: 'https://api.cerebras.ai/v1' }) 
  : null;

const groqClient = process.env.GROQ_API_KEY 
  ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' }) 
  : null;

const mistralClient = process.env.MISTRAL_API_KEY 
  ? new OpenAI({ apiKey: process.env.MISTRAL_API_KEY, baseURL: 'https://api.mistral.ai/v1' }) 
  : null;

const kimiApiKey = process.env.KIMI_API_KEY;
const kimiApiUrl = process.env.KIMI_API_URL || 'https://api.moonshot.ai/v1';
const kimiModelName = process.env.KIMI_MODEL || 'moonshot-v1-8k';
const kimiClient = kimiApiKey
  ? new OpenAI({ apiKey: kimiApiKey, baseURL: kimiApiUrl })
  : null;

// 🛡️ Aquí usamos el audio de Groq con respaldo de Kimi/Moonshot si Groq falla.
async function transcribirAudioUsuario(audioUsuario: string) {
  const base64Data = audioUsuario.split(',')[1] || audioUsuario;
  const buffer = Buffer.from(base64Data, 'base64');

  const attemptGroq = async () => {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) throw new Error('Falta GROQ_API_KEY');

    const blob = new Blob([buffer], { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', blob, 'nota_de_voz.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'es');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqApiKey}` },
      body: formData
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error?.message || 'Error en transcripción Groq Whisper');
    }

    return String(data.text || '');
  };

  const attemptKimi = async () => {
    if (!kimiClient) throw new Error('Kimi no configurado');
    const audioBlob = new Blob([buffer], { type: 'audio/webm' });
    const result = await kimiClient.audio.transcriptions.create({
      file: audioBlob,
      model: 'whisper-1',
      language: 'es'
    });
    return String(result.text || '');
  };

  let lastError: unknown;

  try {
    const texto = await attemptGroq();
    if (!texto.trim()) throw new Error('Transcripción Groq devolvió texto vacío');
    return texto;
  } catch (groqError) {
    console.warn('⚠️ Groq Whisper falló. Intentando respaldo Kimi/Moonshot...');
    console.warn(groqError);
    lastError = groqError;
  }

  try {
    const texto = await attemptKimi();
    if (!texto.trim()) throw new Error('Transcripción Kimi devolvió texto vacío');
    return texto;
  } catch (kimiError) {
    console.warn('⚠️ Kimi/Moonshot falló en la transcripción de audio.');
    console.warn(kimiError);
    lastError = kimiError;
  }

  throw new Error(`Transcripción de audio falló: ${lastError}`);
}

// 🛡️ AQUÍ SOLO USAMOS LA VERSIÓN FLASH PARA CLIENTES
const geminiFlashApiKey = process.env.GEMINI_FLASH_API_KEY;
const geminiGenAI = geminiFlashApiKey ? new GenerativeAI.GoogleGenerativeAI(geminiFlashApiKey) : null;

// --- LÓGICA RAG (INVENTARIO) --- //
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
  // > 2 letras para no ignorar "pan", "ajo", "ron"
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

    // ==========================================
    // 🎧 1. TRANSCRIPCIÓN DE AUDIO VÍA GROQ (WHISPER)
    // ==========================================
    if (audioUsuario) {
      console.log("🎤 Audio detectado en agente de cliente, procesando con Whisper V3 (Groq)...");
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

    // ==========================================
    // 📦 2. EXTRACCIÓN NINJA (RAG - INVENTARIO)
    // ==========================================
    let inventarioCompleto: InventoryItem[] = [];
    try {
      inventarioCompleto = await listProducts(tienda_id);
    } catch (dbError) {
      console.error("Error al obtener inventario de la DB:", dbError);
    }
    
    // Inyectamos datos de prueba limpios si está vacío
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

    const systemPromptText = `Comportate ESTRICTAMENTE según estas instrucciones de tu jefe: 
    ${promptMaestro}
    
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

    // ==========================================
    // 🚀 3. EL CASCADEO DE 5 NIVELES (CEREBRAS -> GROQ -> KIMI K3 -> GEMINI FLASH -> MISTRAL)
    // ==========================================
    const providers = [
      {
        name: 'Cerebras AI ⚡',
        enabled: !!cerebrasClient,
        execute: async () => {
          const completion = await cerebrasClient!.chat.completions.create({
            model: 'gpt-oss-120b',
            messages: formattedMessages,
            temperature: 0.3,
          });
          return completion.choices[0]?.message?.content || '';
        }
      },
      {
        name: 'Groq 🚀',
        enabled: !!groqClient,
        execute: async () => {
          const completion = await groqClient!.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: formattedMessages,
            temperature: 0.3,
          });
          return completion.choices[0]?.message?.content || '';
        }
      },
      {
        name: 'Kimi K3 ✨',
        enabled: !!kimiClient,
        execute: async () => {
          const completion = await kimiClient!.chat.completions.create({
            model: kimiModelName,
            messages: formattedMessages,
            temperature: 0.3,
          });
          return completion.choices[0]?.message?.content || '';
        }
      },
      {
        name: 'Gemini Flash 🛡️',
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
      },
      {
        name: 'Mistral 🔥',
        enabled: !!mistralClient,
        execute: async () => {
          const completion = await mistralClient!.chat.completions.create({
            model: 'ministral-3b-2512',
            messages: formattedMessages,
            temperature: 0.3,
          });
          return completion.choices[0]?.message?.content || '';
        }
      }
    ];

    let lastError: unknown;
    for (const provider of providers) {
      if (!provider.enabled) continue;
      try {
        const reply = await provider.execute();
        if (!reply || !reply.trim()) {
          throw new Error(`${provider.name} devolvió respuesta vacía`);
        }
        botReply = reply;
        usedProvider = provider.name;
        break;
      } catch (providerError) {
        console.warn(`⚠️ ${provider.name} falló. Activando relevo siguiente...`);
        console.warn(providerError);
        lastError = providerError;
      }
    }

    if (!usedProvider) {
      console.error('🔴 CRÍTICO: Todos los motores fallaron.', lastError);
      botReply = "⚠️ Error crítico: Los sistemas de IA están experimentando alta demanda. Intenta en un momento.";
      usedProvider = 'Ninguno (Fallo en Cascada)';
    }

    return NextResponse.json({ respuesta: botReply, provider: usedProvider });

  } catch (error) {
    console.error('Error en el simulador:', error);
    return NextResponse.json({ error: 'Fallo al procesar la simulación' }, { status: 500 });
  }
}
