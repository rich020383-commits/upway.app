import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai'; // 🔵 EL TITULAR
import Groq from 'groq-sdk'; // 🥷 EL RELEVO
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
  rol: 'usuario' | 'asistente';
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
  const palabrasClave = mensajeLimpio.split(' ').filter(p => p.length > 3);
  
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
      historial = [], 
      tienda_id = '1172769935927318' 
    } = body as { 
      promptMaestro?: string; 
      mensajeUsuario: string; 
      historial: MensajeHistorial[]; 
      tienda_id?: string; 
    };

    if (!mensajeUsuario) {
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

    const productosRelevantes = buscarEnInventarioLocal(mensajeUsuario, inventarioCompleto);
    
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
    // INTENTO A: EL TITULAR (GEMINI FREE)
    // ==========================================
    try {
       const gemini = getGenAI();
       if (!gemini) throw new Error('Falta GEMINI_FREE_API_KEY en variables de entorno');
       
       console.log("🚀 Intentando con Gemini Free...");
       
       // Usamos 1.5-flash que es rapidísimo y tiene una cuota gratuita generosa
       const model = gemini.getGenerativeModel({ 
         model: 'gemini-1.5-flash',
         systemInstruction: systemPromptText
       });

       const historialGemini = historial.map(msg => ({
         role: msg.rol === 'usuario' ? 'user' : 'model',
         parts: [{ text: msg.texto }],
       }));

       const chat = model.startChat({ history: historialGemini });
       const result = await chat.sendMessage(mensajeUsuario);
       respuestaIA = result.response.text();
       
       console.log("✅ Respondido con Gemini Free");

    } catch (errorGemini) {
       console.warn("⚠️ Gemini Free falló o llegó al límite. Activando relevo Groq...", errorGemini);
       
       // ==========================================
       // INTENTO B: EL RELEVO NINJA (GROQ / LLAMA 3)
       // ==========================================
       try {
          const groqClient = getGroq();
          if (!groqClient) throw new Error('Falta GROQ_API_KEY en variables de entorno');

          const mensajesGroq = [
            { role: 'system', content: systemPromptText },
            ...historial.map(msg => ({
              role: msg.rol === 'usuario' ? 'user' : 'assistant',
              content: msg.texto
            })),
            { role: 'user', content: mensajeUsuario }
          ];

          const chatCompletion = await groqClient.chat.completions.create({
            messages: mensajesGroq as any,
            model: "llama3-8b-8192", 
            temperature: 0.3, 
          });

          respuestaIA = chatCompletion.choices[0]?.message?.content || "Error en la generación.";
          console.log("✅ Groq salvó el mensaje");

       } catch (errorGroq) {
          console.error("🔴 Ambas APIs fallaron:", errorGroq);
          respuestaIA = "⚠️ Error crítico: Ambos motores de IA están caídos o las API Keys son inválidas.";
       }
    }

    return NextResponse.json({ respuesta: respuestaIA });

  } catch (error) {
    console.error('Error en el simulador:', error);
    return NextResponse.json({ error: 'Fallo al procesar la simulación' }, { status: 500 });
  }
}