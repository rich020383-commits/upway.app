import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk'; // 🥷 IMPORTAMOS EL MOTOR DE RESERVA
import { listProducts } from '@/lib/app-state';

// ==========================================
// EL MOTOR RAG: Búsqueda súper ligera en memoria
// ==========================================
function buscarEnInventarioLocal(mensaje: string, todosLosProductos: any[]) {
  const palabrasClave = mensaje.toLowerCase().split(' ').filter((p: string) => p.length > 3);
  if (palabrasClave.length === 0) return []; 
  
  return todosLosProductos.filter(prod => 
    palabrasClave.some((palabra: string) => 
      prod.nombre.toLowerCase().includes(palabra) || 
      (prod.categoria && prod.categoria.toLowerCase().includes(palabra))
    )
  );
}

export async function POST(req: Request) {
  try {
    // 🛡️ Agregamos un fallback "historial = []" por seguridad
    const { promptMaestro, mensajeUsuario, historial = [], tienda_id = '1172769935927318' } = await req.json();

    // 1. EXTRACCIÓN NINJA (RAG): Declaramos la variable como any[] para que TypeScript no moleste con el formato
    let inventarioCompleto: any[] = await listProducts(tienda_id);
    
    // 🪄 MAGIA DE VENTAS: Si la tienda es nueva y no tiene inventario, inyectamos datos de prueba limpios
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
       contextoInventario = `PRODUCTOS ENCONTRADOS RELEVANTES A LA CONSULTA ACTUAL:\n${productosRelevantes.map(p => `- ${p.nombre} (Categoría: ${p.categoria}) - Precio: $${p.precio}`).join('\n')}`;
    }

    // El manual de instrucciones que leerá cualquiera de las 2 IAs
    const systemPromptText = `ESTÁS EN MODO SIMULADOR DE PRUEBAS INTERNO. 
    Comportate ESTRICTAMENTE según estas instrucciones de tu jefe: 
    ${promptMaestro || 'Eres un asistente cordial.'}
    
    === BASE DE DATOS (SISTEMA RAG) ===
    ${contextoInventario}
    
    Regla RAG: Si el cliente pregunta por un producto y aparece en la Base de Datos arriba, ofrécelo. Si no aparece, dile elegantemente que no hay stock actual de ese artículo.`;

    let respuestaIA = "";

    // ==========================================
    // INTENTO A: EL TITULAR (GEMINI)
    // ==========================================
    try {
       const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
       if (!apiKey) throw new Error('Falta la API Key de Gemini');
       
       const genAI = new GoogleGenerativeAI(apiKey);
       const model = genAI.getGenerativeModel({ 
         model: 'gemini-2.5-flash',
         systemInstruction: systemPromptText
       });

       const historialGemini = historial.map((msg: any) => ({
         role: msg.rol === 'usuario' ? 'user' : 'model',
         parts: [{ text: msg.texto }],
       }));

       const chat = model.startChat({ history: historialGemini });
       const result = await chat.sendMessage(mensajeUsuario);
       respuestaIA = result.response.text();
       
       console.log("Simulador: Respondido con Gemini 🟢");

    } catch (errorGemini) {
       console.warn("Simulador: Gemini falló o superó cuota. Activando relevo Groq... 🟡");
       
       // ==========================================
       // INTENTO B: EL SUPLENTE NINJA (GROQ / LLAMA 3)
       // ==========================================
       try {
          const groqApiKey = process.env.GROQ_API_KEY;
          if (!groqApiKey) throw new Error('Falta GROQ_API_KEY en las variables de entorno');

          const groq = new Groq({ apiKey: groqApiKey });
          
          // Formateamos el historial para Groq (usa el estándar 'user' y 'assistant')
          const mensajesGroq = [
            { role: 'system', content: systemPromptText },
            ...historial.map((msg: any) => ({
              role: msg.rol === 'usuario' ? 'user' : 'assistant',
              content: msg.texto
            })),
            { role: 'user', content: mensajeUsuario }
          ];

          // Invocamos a Llama 3 (El modelo más veloz y económico)
          const chatCompletion = await groq.chat.completions.create({
            messages: mensajesGroq as any,
            model: "llama3-8b-8192", // 8 Billones de parámetros, perfecto para e-commerce
            temperature: 0.3, // Menos temperatura = menos inventos, más precisión en precios
          });

          respuestaIA = chatCompletion.choices[0]?.message?.content || "Error en la generación.";
          console.log("Simulador: Respondido con Groq (Llama 3) 🟢");

       } catch (errorGroq) {
          console.error("Ambas IA fallaron 🔴", errorGroq);
          respuestaIA = "⚠️ Error crítico: Ambos motores de IA están caídos o mal configurados. Verifica tus API Keys.";
       }
    }

    return NextResponse.json({ respuesta: respuestaIA });

  } catch (error) {
    console.error('Error en el simulador:', error);
    return NextResponse.json({ error: 'Fallo al procesar la simulación' }, { status: 500 });
  }
}