import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 💎 LLAVE PREMIUM EXCLUSIVA PARA SOPHIE
const geminiApiKey = process.env.GEMINI_PREMIUM_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

const kimiApiKey = process.env.KIMI_API_KEY;
const kimiApiUrl = process.env.KIMI_API_URL || 'https://api.moonshot.ai/v1';
const kimiModelName = process.env.KIMI_MODEL || 'moonshot-v1-8k';
const kimiClient = kimiApiKey ? new OpenAI({ apiKey: kimiApiKey, baseURL: kimiApiUrl }) : null;

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
    role: m.role === 'bot' ? 'model' : 'user',
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

// 🔥 PROMPT DEFINITIVO PARA SOPHIE V2 / UPWAY / AGENDAS OPERATIVAS Y ONBOARDING
const AGENTE_SUPREMO_PROMPT = `Rol: Eres Sophie v2, agente comercial y operativo de Upway. Tu marca pública es Upway. No hables como “Upway 2.0”. “v2” es el nombre del agente, no la marca del producto.

CONTEXTO DE NEGOCIO:
- Upway es un sistema operativo para negocios y clínicas que necesitan atención inteligente, coordinación, agenda y crecimiento ordenado.
- El valor real no es “la IA por sí sola”, sino la operación completa: atención 24/7, agenda inteligente, lead qualification, seguimiento, escalamiento humano, triage y control operativo.
- En Health hablamos de clínicas, consultorios, IPS y centros médicos que necesitan velocidad, rigor y sensibilidad médica.
- No se vende un bot genérico. Se vende una capa operativa que mejora la productividad del negocio y la experiencia del cliente.

ESTILO Y MANERA:
1. Sé elegante, directa, persuasiva, muy clara y orientada a negocio real.
2. Habla como una estratega senior de operación y crecimiento, no como soporte básico.
3. No repitas mensajes ni des vueltas. Diagnostica rápido y lleva la conversación a la siguiente acción.
4. Explica costos con propiedad: plataforma/software, implementación, consumo real de mensajes/canales y créditos o paquetes iniciales cuando aplica.
5. Si el cliente habla del problema real, responde en términos de atención, agenda, volumen, coordinación y control.

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

    const generateWithGemini = async () => {
      if (!genAI) throw new Error('Falta GEMINI_PREMIUM_API_KEY en el .env');
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: AGENTE_SUPREMO_PROMPT,
        generationConfig: {
          temperature: 0.45,
          maxOutputTokens: 500, // Subí un poco el límite para que los prompts generados no se corten
        }
      });
      const result = await model.generateContent({ contents });
      return result.response.text();
    };

    const generateWithKimiFallback = async () => {
      if (!kimiClient) throw new Error('Falta KIMI_API_KEY para fallback de Sophie');
      const mappedMessages: Array<{ role: 'user' | 'assistant'; content: string }> = contents.map((c) => ({
        role: c.role === 'model' ? 'assistant' : 'user',
        content: c.parts.map((p) => ('text' in p ? p.text : '')).join(' ').trim() || ' '
      }));

      const fallbackMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: AGENTE_SUPREMO_PROMPT },
        ...mappedMessages
      ];
      const completion = await kimiClient.chat.completions.create({
        model: kimiModelName,
        messages: fallbackMessages,
        temperature: 0.45,
        max_tokens: 500,
      });
      return completion.choices[0]?.message?.content || '';
    };

    let botReply = '';
    let chosenProvider = 'Gemini Premium 💎';
    try {
      botReply = await generateWithGemini();
    } catch (primaryError) {
      console.warn('⚠️ Gemini Premium falló en Sophie. Intentando fallback con Kimi...', primaryError);
      try {
        botReply = await generateWithKimiFallback();
        chosenProvider = 'Kimi K3 ✨ (fallback)';
      } catch (fallbackError) {
        console.error('❌ Fallback de Kimi también falló:', fallbackError);
        botReply = '⚠️ Estoy teniendo problemas técnicos en este momento. Por favor, inténtalo de nuevo en unos minutos.';
        chosenProvider = 'Ninguno (error)';
      }
    }

    console.log(`✅ Sophie respondió con éxito con ${chosenProvider}`);
    return NextResponse.json({ reply: botReply, provider: chosenProvider });

  } catch (error: unknown) {
    console.error('Error crítico en Sophie:', error);
    return NextResponse.json({ reply: `⚠️ Error temporal en el sistema de Sophie. ¡Inténtalo de nuevo!` }, { status: 500 });
  }
}