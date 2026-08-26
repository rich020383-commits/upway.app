import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { tienda_id, nombre, promptMaestro, vozSeleccionada } = await request.json();

    if (!tienda_id || !nombre || !promptMaestro) {
      return NextResponse.json({ error: "Faltan datos para crear el agente." }, { status: 400 });
    }

    // 🎙️ TRADUCTOR DE VOCES MULTI-GÉNERO (ElevenLabs)
    let vapiVoice = {
      provider: "11labs",
      voiceId: "21m00Tcm4TlvDq8ikWAM" // Rachel (Femenina por defecto)
    };

    switch(vozSeleccionada) {
      case "femenina_estrella":
        vapiVoice.voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel
        break;
      case "femenina_calida":
        vapiVoice.voiceId = "XrExE9yKIg1WjnnlVkGX"; // Matilda
        break;
      case "masculino_serio":
        vapiVoice.voiceId = "pNInz6obpgDQGcFmaJcg"; // Adam (Voz masculina corporativa)
        break;
      case "masculino_joven":
        vapiVoice.voiceId = "D38z5RcWu1voky8WS1ja"; // Fin (Masculino casual)
        break;
    }

    // 🔥 LLAMADA A LA API DE VAPI
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: nombre,
        voice: vapiVoice,
        model: {
          provider: "openai",
          model: "gpt-4o-mini", // Puedes cambiarlo si usas otro modelo
          messages: [
            { role: "system", content: promptMaestro }
          ]
        }
      })
    };

    const response = await fetch('https://api.vapi.ai/assistant', options);
    const vapiData = await response.json();

    if (!response.ok) {
      throw new Error(vapiData.message || "Error al crear el asistente en Vapi");
    }

    // 💾 GUARDAR EL ID DEL ASISTENTE EN NEON DB
    await prisma.tienda.update({
      where: { id: tienda_id },
      data: {
        vapiAssistantId: vapiData.id,
        isVapiActive: true
      }
    });

    console.log(`✅ [Vapi] Agente de voz creado exitosamente: ${vapiData.id} (Voz: ${vozSeleccionada})`);

    return NextResponse.json({ assistantId: vapiData.id });

  } catch (error: any) {
    console.error("❌ Error creando agente en Vapi:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}