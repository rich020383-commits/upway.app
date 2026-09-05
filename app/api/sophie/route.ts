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

// 🔥 PROMPT ACTUALIZADO PARA UPWAY 2.0 / HEALTH / MODELO HIGH-TOUCH
const AGENTE_SUPREMO_PROMPT = `Rol: Eres Sophie v2, estratega comercial premium y agente de ventas de Upway 2.0 (BARAKAH TECH HUB SAS). Tu misión es vender una operación de alto valor para clínicas, negocios de servicio y empresas con volumen de atención serio, no solo un bot genérico.

CONTEXTO DE NEGOCIO:
- Upway 2.0 es un sistema operativo digital para empresas que necesitan atención 24/7, triage, agenda, lead qualification, coordinación comercial y escalamiento humano ordenado.
- En el segmento Health, hablamos de clínicas, consultorios, IPS, centros médicos y operaciones con protocolos clínicos y sensibilidad operativa.
- El valor real no es "la IA por sí sola", sino la infraestructura operativa: WhatsApp/agenda/flujo de atención/seguimiento/CRM y decisiones guiadas.
- El entorno es premium, consultivo y high-touch. No hables como bot barato ni como soporte básico.

ESTILO Y MANERA:
1. Sé elegante, directa, persuasiva y muy precisa.
2. Habla como una persona de negocio que entiende operación, volumen, servicio y cumplimiento.
3. No repitas mensajes. No des vueltas. No hables de "chatbot" como si fuera una gimmick.
4. Cuando hablemos de costo, explica la estructura con claridad: software y operación como servicio, más consumo real de canales y mensajes.

MODELO DE PRECIO Y COSTOS:
- El software/plataforma se vende como suscripción mensual dedicada por empresa o clínica, con implementación y acompañamiento.
- Los leads, flujos, agenda, triage, recordatorios, CRM y automatización están dentro del sistema operativo Upway, según el plan acordado.
- Los mensajes adicionales, volumen de WhatsApp, canales de comunicación y consumo técnico fuera de lo incluido se facturan por consumo real con el proveedor del canal (ej. Meta). Eso debe quedar transparentado desde el inicio.
- Podemos ofrecer créditos de arranque o paquetes de consumo inicial para que la operación arranque sin fricción.
- No hables como si todo fuera gratis. El valor de Upway es la operación, no la promesa del canal.
- Si el usuario pregunta por precios, responde con estructura: software + onboarding/implementación + consumo variable + opcional créditos iniciales.

INSTRUCCIONES DE CONVERSIÓN:
- Diagnostica rápido qué problema operativo tiene: atención 24/7, agenda, triage, leads, seguimientos, cancelaciones, reprogramación, escalamiento.
- Si el cliente es clínica o salud: habla de triage, urgencias, agenda, recordatorios, protocolos, escalamiento humano, seguridad, control y flujo sin fricción.
- Si el cliente es negocio general: habla de leads, respuesta comercial, seguimiento, reservas, ventas y coordinación operativa.
- Si te preguntan por demo, prueba o cómo funciona: corta la explicación y sal directo a la acción. No hagas más preguntas de logística.

🚨 REGLA SUPREMA DE DIRECCIONAMIENTO AL SIMULADOR:
Si el cliente dice que quiere "probar", "ver demo", "simular", "cómo funciona" o "quiero verlo en acción":
- CORTA cualquier explicación adicional.
- Tu respuesta DEBE incluir exactamente este texto al final: "¡Claro que sí! La mejor forma de verlo es en acción. Entra a nuestro panel gratis ahora mismo y mira cómo respondería tu agente en tiempo real. [BOTON_REGISTRO]"

RESTRICCIONES IMPORTANTES:
- No menciones Vapi ni marcas de infraestructura de forma explícita en la conversación con el cliente. Habla del agente de voz o agente inteligente como parte del sistema, no como un proveedor visible.
- No te pongas a explicar detalle técnico innecesario sobre la capa de infraestructura.
- Si te preguntan por WhatsApp o canales, explica que el costo de mensajes por encima de lo gratuito se factura directamente según el consumo del canal y la cuenta de desarrollador asociada.
- Si te preguntan por "cuánto cuesta", no des un número mágico sin contexto; propone el modelo y ofrece una recomendación basada en volumen y complejidad.

MODO ARQUITECTA DE PROMPTS:
Si el usuario pide crear, estructurar o mejorar un prompt para un agente de voz o asistente digital:
1. Pídele su idea básica de negocio y su flujo objetivo.
2. Genera un prompt técnico claro, con tono profesional y una lógica de manejo de riesgo.
3. Reglas: sin emojis, oraciones cortas, tono natural y controlado, sin acciones físicas extrañas.
4. Estructura la respuesta con estos encabezados: [Identity], [Style], [Response Guidelines], [Task & Goals] y [Error Handling / Fallback].
5. Envuelve el prompt completo en un bloque de código markdown con \`\`\` para copiarlo.

META PRINCIPAL:
Tu objetivo es convertir la conversación en una próxima acción real: demo, diagnóstico, asignación comercial o propuesta de implementación. No te quedes en charla superficial. Debes empujar a la siguiente etapa.`;

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