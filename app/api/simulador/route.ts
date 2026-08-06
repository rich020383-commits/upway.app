import { NextResponse } from 'next/server';
import Groq from 'groq-sdk'; // 🥷 EL ÚNICO MOTOR: GROQ
import { listProducts } from '@/lib/app-state';

// ==========================================
// INTERFACES DE TYPESCRIPT
// ==========================================
interface Producto {
  nombre: string;
  categoria?: string;
  precio: number;
}

interface MensajeHistorial {
  rol: 'usuario' | 'asistente' | 'ia';
  texto: string;
}

// ==========================================
// INSTANCIACIÓN GLOBAL DE CLIENTE IA
// ==========================================
let groq: Groq | null = null;

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
const limpiarTexto = (txt: string) => 
  txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function buscarEnInventarioLocal(mensaje: string, todosLosProductos: Producto[]): Producto[] {
  const mensajeLimpio = limpiarTexto(mensaje);
  // > 2 letras para no ignorar productos cortos
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
      audioUsuario, // 🎤 EL CAMPO CLAVE PARA EL AUDIO
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
    // 1. CEREBRO AUDITIVO: Transcripción Whisper V3
    // ==========================================
    if (audioUsuario) {
      console.log("🎤 Audio detectado en Base64, procesando con Whisper V3...");
      try {
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) throw new Error('Falta GROQ_API_KEY');

        // Limpiar el encabezado Base64
        const base64Data = audioUsuario.split(',')[1] || audioUsuario;
        const buffer = Buffer.from(base64Data, 'base64');
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
        if (data.error) throw new Error(data.error.message);

        textoProcesado = data.text;
        console.log(`✅ Audio transcrito exitosamente: "${textoProcesado}"`);
        
      } catch (errorAudio) {
        console.error("🔴 Error en transcripción de audio:", errorAudio);
        return NextResponse.json({ respuesta: 'Lo siento, hay mucho ruido en la red y no logré escuchar bien tu nota de voz. ¿Podrías escribirlo?' });
      }
    }

    if (!textoProcesado) {
       return NextResponse.json({ error: 'Se requiere un mensaje de texto o audio' }, { status: 400 });
    }

    // ==========================================
    // 2. EXTRACCIÓN NINJA (RAG)
    // ==========================================
    let inventarioCompleto: Producto[];
    try {
      inventarioCompleto = await listProducts(tienda_id);
    } catch (dbError) {
      console.error("Error al obtener inventario de la DB:", dbError);
      inventarioCompleto = []; 
    }
    
    if (!inventarioCompleto || inventarioCompleto.length === 0) {
      inventarioCompleto = [
        { nombre: "Zapatos Nike de Prueba", categoria: "Calzado", precio: 250000 },
        { nombre: "Camiseta Polo de Prueba", categoria: "Ropa", precio: 60000 },
        { nombre: "Gorra Deportiva de Prueba", categoria: "Accesorios", precio: 35000 }
      ];
    }

    const productosRelevantes = buscarEnInventarioLocal(textoProcesado, inventarioCompleto);
    
    let contextoInventario = "No se encontraron coincidencias directas en el inventario.";
    if (productosRelevantes.length > 0) {
       contextoInventario = `PRODUCTOS ENCONTRADOS:\n${productosRelevantes.map(p => `- ${p.nombre} (Categoría: ${p.categoria || 'N/A'}) - Precio: $${p.precio}`).join('\n')}`;
    }

    const systemPromptText = `ESTÁS EN MODO SIMULADOR DE PRUEBAS INTERNO. 
    Comportate ESTRICTAMENTE según estas instrucciones de tu jefe: 
    ${promptMaestro}
    
    === BASE DE DATOS (SISTEMA RAG) ===
    ${contextoInventario}
    
    Regla RAG: Si el cliente pregunta por un producto y aparece en la Base de Datos arriba, ofrécelo. Si no aparece, dile que no hay stock actual.
    El cliente acaba de decir esto: ${textoProcesado}`;

    let respuestaIA = "";

    // ==========================================
    // 3. CEREBRO DE TEXTO: Llama 3 (Titular) / Mixtral (Relevo)
    // ==========================================
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

    try {
       console.log("🚀 Generando respuesta con Llama 3...");
       const chatCompletion = await groqClient.chat.completions.create({
         messages: mensajesGroq as any,
         model: "llama-3.1-8b-instant", 
         temperature: 0.3, 
       });

       respuestaIA = chatCompletion.choices[0]?.message?.content || "Error en la generación.";
       console.log("✅ Respondido con Llama 3");

    } catch (errorLlama) {
       console.warn("⚠️ Llama 3 falló. Activando relevo Mixtral...", errorLlama);
       
       try {
          const chatCompletionFallback = await groqClient.chat.completions.create({
            messages: mensajesGroq as any,
            model: "mixtral-8x7b-32768", 
            temperature: 0.3, 
          });

          respuestaIA = chatCompletionFallback.choices[0]?.message?.content || "Error en la generación.";
          console.log("✅ Respondido con Mixtral");

       } catch (errorMixtral) {
          console.error("🔴 Ambos motores de Groq fallaron:", errorMixtral);
          respuestaIA = "⚠️ Error crítico: Los motores de IA están experimentando alta demanda.";
       }
    }

    return NextResponse.json({ respuesta: respuestaIA });

  } catch (error) {
    console.error('Error general en el simulador:', error);
    return NextResponse.json({ error: 'Fallo interno del servidor' }, { status: 500 });
  }
}