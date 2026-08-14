import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 1. DICCIONARIO DE VOCES VALIDADO CON VAPI
const VOICE_MAPPING: Record<string, any> = {
  // === VOCES FEMENINAS ===
  femenina_estrella: {
    provider: '11labs',
    voiceId: 'cgSgspJ2msm6clMCkdW9', // Laura (ElevenLabs altamente compatible)
    model: 'eleven_multilingual_v2'
  },
  femenina_calida: {
    provider: '11labs',
    voiceId: 'xrExE9yKIg1WjnnlVkGX', // Matilda
    model: 'eleven_multilingual_v2'
  },
  femenina_nativa: {
    provider: 'vapi',
    voiceId: 'celeste', // Nombre nativo aceptado por Vapi
  },

  // === VOCES MASCULINAS ===
  masculino_serio: {
    provider: '11labs',
    voiceId: 'ErXwobaYiN019PkySvjV', // Antoni
    model: 'eleven_multilingual_v2'
  },
  masculino_joven: {
    provider: '11labs',
    voiceId: 'pNInz6obbfDQGcgMyIGC', // Fin
    model: 'eleven_multilingual_v2'
  },
  masculino_nativo: {
    provider: 'vapi',
    voiceId: 'jorge', // Nombre nativo aceptado por Vapi
  }
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tienda_id, nombre, promptMaestro, vozSeleccionada } = body;

    if (!tienda_id || !promptMaestro || !vozSeleccionada) {
      return NextResponse.json({ error: 'Faltan datos obligatorios.' }, { status: 400 });
    }

    console.log(`🎙️ Creando Agente Vapi para tienda: ${tienda_id}`);

    const voiceConfig = VOICE_MAPPING[vozSeleccionada] || VOICE_MAPPING['femenina_estrella'];
    const vapiKey = process.env.VAPI_PRIVATE_API_KEY;
    
    if (!vapiKey) throw new Error('Falta VAPI_PRIVATE_API_KEY en .env');

    const vapiPayload = {
      name: nombre || 'Agente Telefónico Upway',
      voice: voiceConfig,
      model: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: promptMaestro }
        ]
      }
    };

    const vapiResponse = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vapiPayload)
    });

    const vapiData = await vapiResponse.json();

    if (!vapiResponse.ok) {
      console.error('❌ Error detallado de Vapi:', vapiData);
      throw new Error(vapiData.message || JSON.stringify(vapiData));
    }

    const nuevoAssistantId = vapiData.id;
    console.log(`✅ Agente creado en Vapi. ID: ${nuevoAssistantId}`);

    // Guardado seguro en Prisma
    await prisma.tienda.update({
      where: { id: tienda_id },
      data: {
        vapiAssistantId: nuevoAssistantId,
        isVapiActive: true,
      }
    });

    return NextResponse.json({
      success: true,
      assistantId: nuevoAssistantId
    });

  } catch (error) {
    console.error('❌ Error en creacion de Vapi:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}