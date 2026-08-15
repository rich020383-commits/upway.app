import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const VOICE_MAPPING: Record<string, any> = {
  femenina_estrella: { provider: '11labs', voiceId: 'cgSgspJ2msm6clMCkdW9', model: 'eleven_multilingual_v2' },
  femenina_calida: { provider: '11labs', voiceId: 'xrExE9yKIg1WjnnlVkGX', model: 'eleven_multilingual_v2' },
  femenina_nativa: { provider: 'vapi', voiceId: 'celeste' },
  masculino_serio: { provider: '11labs', voiceId: 'ErXwobaYiN019PkySvjV', model: 'eleven_multilingual_v2' },
  masculino_joven: { provider: '11labs', voiceId: 'pNInz6obbfDQGcgMyIGC', model: 'eleven_multilingual_v2' },
  masculino_nativo: { provider: 'vapi', voiceId: 'jorge' }
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tienda_id, nombre, promptMaestro, vozSeleccionada } = body;

    if (!promptMaestro || !vozSeleccionada) {
      return NextResponse.json({ error: 'Faltan datos obligatorios.' }, { status: 400 });
    }

    console.log(`🎙️ Procesando Agente Vapi para el ID entrante: ${tienda_id}`);

    // 💡 LA SOLUCIÓN MÁGICA CON TU SCHEMA ACTUAL
    // Buscamos si "1172769935927318" coincide con el ID interno, o con el metaPhoneNumberId, o el telefono
    let tienda = null;
    if (tienda_id) {
      tienda = await prisma.tienda.findFirst({
        where: {
          OR: [
            { id: tienda_id },
            { metaPhoneNumberId: tienda_id },
            { telefono: tienda_id }
          ]
        }
      });
    }

    // Respaldo para desarrollo: si no lo encuentra, agarra la primera tienda que exista
    if (!tienda) {
      console.log('⚠️ No se encontró por ID de Meta, usando la primera tienda disponible por defecto.');
      tienda = await prisma.tienda.findFirst();
    }

    if (!tienda) {
      return NextResponse.json({ error: 'No hay ninguna tienda registrada en la base de datos.' }, { status: 404 });
    }

    // 2. CREAR ASISTENTE EN VAPI
    const voiceConfig = VOICE_MAPPING[vozSeleccionada] || VOICE_MAPPING['femenina_estrella'];
    const vapiKey = process.env.VAPI_PRIVATE_API_KEY;
    
    if (!vapiKey) throw new Error('Falta VAPI_PRIVATE_API_KEY en .env');

    const vapiPayload = {
      name: nombre || 'Agente Telefónico Upway',
      voice: voiceConfig,
      model: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: promptMaestro }]
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
      throw new Error(vapiData.message || JSON.stringify(vapiData));
    }

    const nuevoAssistantId = vapiData.id;
    console.log(`✅ Agente creado en Vapi. ID: ${nuevoAssistantId}`);

    // 💡 3. EL TRUCO FINAL: Actualizamos usando el `tienda.id` REAL (el CUID generado por Prisma)
    await prisma.tienda.update({
      where: { id: tienda.id }, 
      data: {
        vapiAssistantId: nuevoAssistantId,
        isVapiActive: true,
      }
    });

    return NextResponse.json({
      success: true,
      assistantId: nuevoAssistantId,
      mensaje: `Agente vinculado a la tienda: ${tienda.nombre}`
    });

  } catch (error) {
    console.error('❌ Error en creacion de Vapi:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}