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

    // ==========================================
    // 1. BUSCADOR Y CREADOR INTELIGENTE DE TIENDAS
    // ==========================================
    let tienda = null;
    
    // Primero, intentamos buscarla
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

    // Segundo intento: agarrar cualquier tienda existente
    if (!tienda) {
      tienda = await prisma.tienda.findFirst();
    }

    // TERCER INTENTO DE RESCATE (Para cuando la BD está vacía por el bypass de Meta)
    if (!tienda) {
      console.log('⚠️ BD Vacía detectada. Creando Tienda de Prueba temporal y Usuario anónimo...');
      
      // Necesitamos un usuario fantasma para poder crear la tienda
      const usuarioFantasma = await prisma.user.create({
        data: {
          name: "Usuario Revisor",
          email: `revisor_${Date.now()}@upway.test`,
        }
      });

      // Ahora creamos la tienda fantasma y le asignamos el ID de Meta que estás usando
      tienda = await prisma.tienda.create({
        data: {
          userId: usuarioFantasma.id,
          nombre: "Tienda Revisor Meta",
          metaPhoneNumberId: tienda_id || '1172769935927318',
        }
      });
    }

    // ==========================================
    // 2. CREACIÓN EN VAPI
    // ==========================================
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

    // ==========================================
    // 3. VINCULACIÓN FINAL
    // ==========================================
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