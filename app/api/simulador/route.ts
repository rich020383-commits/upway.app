import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai'; // 🔵 EL TITULAR (Mantenido por si decides reactivarlo en el futuro)
import Groq from 'groq-sdk'; // 🥷 EL RELEVO (Ahora será nuestro Titular y Relevo)
import { listProducts } from '@/lib/app-state'; // IMPORTACIÓN DEL ESTADO DE LA APLICACIÓN

// ==========================================
// INTERFACES DE TYPESCRIPT
// ==========================================
interface Producto {
  nombre: string;
  categoria?: string;
  precio: number;
}

interface MensajeHistorial {
  rol: 'usuario' | 'asistente' | 'ia'; // Añadido 'ia' por compatibilidad con el front
  texto: string;
}

// ==========================================
// INSTANCIACIÓN GLOBAL DE CLIENTES IA
// ==========================================
// Evita crear nuevas instancias en cada petición
let genAI: GoogleGenerativeAI | null = null;
let groq: Groq | null = null;

const getGenAI = () => {
  if (!genAI) {
    const geminiApiKey = process.env.GEMINI_FREE_API_KEY;
    if (geminiApiKey) {
      genAI = new GoogleGenerativeAI(geminiApiKey);
    }
  }
  return genAI;
};

const getGroq = () => {
  if (!groq) {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
      groq = new Groq({ apiKey: groqApiKey });
    }
  }
  return groq;
};

// ==========================================
// EL MOTOR RAG: Búsqueda súper ligera en memoria
// ==========================================
// Función para limpiar texto (quitar acentos y pasar a minúsculas)
const limpiarTexto = (txt: string) => 
  txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function buscarEnInventarioLocal(mensaje: string, todosLosProductos: Producto[]): Producto[] {
  const mensajeLimpio = limpiarTexto(mensaje);
  // 🔥 CORRECCIÓN: > 2 letras para que encuentre "pan", "ajo", "ron"
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      promptMaestro = 'Eres un asistente cordial.', 
      mensajeUsuario, 
      audioUsuario, // 🔥 NUEVO: Recibimos audio en Base64
      historial = [], 
      tienda_id = '1172769935927318' 
    } = body as { 
      promptMaestro?: string; 
      mensajeUsuario?: string; 
      audioUsuario?: string;
      historial: MensajeHistorial[]; 
      tienda_id?: string; 
    };

    let textoProcesado = mensajeUsuario || '';

    // ==========================================
    // 🎧 CEREBRO AUDITIVO: Transcripción Whisper V3 (Groq)
    // ==========================================
    if (audioUsuario) {
      console.log("🎤 Audio detectado, procesando con Whisper V3...");
      try {
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) throw new Error('Falta GROQ_API_KEY en variables de entorno');

        // Limpiar el encabezado Base64 de webm
        const base64Data = audioUsuario.split(',')[1] || audioUsuario;
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: 'audio/webm' });

        const formData = new FormData();
        formData.append('file', blob, 'nota_de_voz.webm');
        formData.append('model', 'whisper-large-v3');
        formData.append('language', 'es'); // Forzamos español

        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`
          },
          body: formData
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        textoProcesado = data.text;
        console.log(`✅ Transcripción exitosa: "${textoProcesado}"`);
        
      } catch (errorAudio) {
        console.error("🔴 Error al transcribir audio:", errorAudio);
        return NextResponse.json({ respuesta: 'Lo siento, no logré escuchar bien tu nota de voz. ¿Podrías escribirlo o enviarlo de nuevo?' });
      }
    }

    if (!textoProcesado) {
       return NextResponse.json({ error: 'Mensaje de usuario requerido' }, { status: 400 });
    }

    // 1. EXTRACCIÓN NINJA (RAG)
    let inventarioCompleto: Producto[];
    try {
      inventarioCompleto = await listProducts(tienda_id);
    } catch (dbError) {
      console.error("Error al obtener inventario de la DB:", dbError);
      inventarioCompleto = []; // Fallback a array vacío si falla la DB
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

    const systemPromptText = `ESTÁS EN MODO SIMULADOR DE PRUEBAS INTERNO. 
    Comportate ESTRICTAMENTE según estas instrucciones de tu jefe: 
    ${promptMaestro}
    
    === BASE DE DATOS (SISTEMA RAG) ===
    ${contextoInventario}
    
    Regla RAG: Si el cliente pregunta por un producto y aparece en la Base de Datos arriba, ofrécelo. Si no aparece, dile elegantemente que no hay stock actual de ese artículo.`;

    let respuestaIA = "";

    // ==========================================
    // CEREBRO DE TEXTO: TITULAR (Llama 3) Y RELEVO (Mixtral)
    // Desactivamos Gemini por problemas de bloqueo
    // ==========================================
    try {
       const groqClient = getGroq();
       if (!groqClient) throw new Error('Falta GROQ_API_KEY en variables de entorno');

       console.log("🚀 Generando respuesta con Llama 3 (Titular)...");

       const mensajesGroq = [
         { role: 'system', content: systemPromptText },
         ...historial.map(msg => ({
           role: msg.rol === 'usuario' ? 'user' : 'assistant',
           content: msg.texto
         })),
         { role: 'user', content: textoProcesado } // Pasamos el texto (o la transcripción)
       ];

       const chatCompletion = await groqClient.chat.completions.create({
         messages: mensajesGroq as any,
         model: "llama-3.1-8b-instant", 
         temperature: 0.3, 
       });

       respuestaIA = chatCompletion.choices[0]?.message?.content || "Error en la generación.";
       console.log("✅ Respondido con Llama 3");

    } catch (errorLlama) {
       console.warn("⚠️ Llama 3 falló o está saturado. Activando relevo Mixtral...", errorLlama);
       
       try {
          const groqClient = getGroq();
          if (!groqClient) throw new Error('Falta GROQ_API_KEY');

          const mensajesGroq = [
            { role: 'system', content: systemPromptText },
            ...historial.map(msg => ({
              role: msg.rol === 'usuario' ? 'user' : 'assistant',
              content: msg.texto
            })),
            { role: 'user', content: textoProcesado }
          ];

          const chatCompletionFallback = await groqClient.chat.completions.create({
            messages: mensajesGroq as any,
            model: "mixtral-8x7b-32768", // 🔥 EL RELEVO DE EMERGENCIA
            temperature: 0.3, 
          });

          respuestaIA = chatCompletionFallback.choices[0]?.message?.content || "Error en la generación.";
          console.log("✅ Mixtral salvó la respuesta");

       } catch (errorMixtral) {
          console.error("🔴 Ambos motores de Groq fallaron:", errorMixtral);
          respuestaIA = "⚠️ Error crítico: Ambos motores de IA están caídos o las API Keys son inválidas.";
       }
    }

    return NextResponse.json({ respuesta: respuestaIA });

  } catch (error) {
    console.error('Error en el simulador:', error);
    return NextResponse.json({ error: 'Fallo al procesar la simulación' }, { status: 500 });
  }
}