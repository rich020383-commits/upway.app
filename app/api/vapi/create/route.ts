import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ==========================================
// 1. CONFIGURACIÓN ESTÁNDAR EMPRESARIAL (TIER 1)
// ==========================================
// Utilizamos ElevenLabs como motor principal de aprovisionamiento automatizado 
// debido a su estabilidad comprobada en la API de Vapi.
const VOICE_MAPPING: Record<string, any> = {
  femenina_estrella: { 
    provider: '11labs', 
    voiceId: 'cgSgspJ2msm6clMCkdW9', // Laura (Estándar Producción Español)
    model: 'eleven_multilingual_v2' 
  },
  femenina_calida: { 
    provider: '11labs', 
    voiceId: 'xrExE9yKIg1WjnnlVkGX', // Matilda
    model: 'eleven_multilingual_v2' 
  },
  masculino_serio: { 
    provider: '11labs', 
    voiceId: 'ErXwobaYiN019PkySvjV', 
    model: 'eleven_multilingual_v2' 
  },
  masculino_joven: { 
    provider: '11labs', 
    voiceId: 'pNInz6obbfDQGcgMyIGC', 
    model: 'eleven_multilingual_v2' 
  }
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tienda_id, nombre, promptMaestro, vozSeleccionada } = body;

    // 1. VALIDACIÓN ESTRICTA
    if (!tienda_id || !promptMaestro || !vozSeleccionada) {
      return NextResponse.json(
        { error: 'Faltan parámetros obligatorios para la creación del agente.' }, 
        { status: 400 }
      );
    }

    console.log(`🎙️ [Upway Vapi Service] Solicitud de creación para Tienda/Meta ID: ${tienda_id}`);

    // 2. BÚSQUEDA EXACTA EN BASE DE DATOS (SIN CREACIÓN FANTASMA)
    const tienda = await prisma.tienda.findFirst({
      where: {
        OR: [
          { id: tienda_id },
          { metaPhoneNumberId: tienda_id },
          { telefono: tienda_id }
        ]
      }
    });

    if (!tienda) {
      console.error(`❌ [Upway Vapi Service] Tienda no encontrada para el ID: ${tienda_id}`);
      return NextResponse.json(
        { error: 'Entidad de negocio no encontrada. Verifique la vinculación de la cuenta.' }, 
        { status: 404 }
      );
    }

    // 3. COMUNICACIÓN CON VAPI
    const voiceConfig = VOICE_MAPPING[vozSeleccionada] || VOICE_MAPPING['femenina_estrella']; 
    const vapiKey = process.env.VAPI_PRIVATE_API_KEY;
    
    if (!vapiKey) throw new Error('Credenciales de Vapi no configuradas en el entorno.');

    const vapiPayload = {
      name: nombre || `Agente - ${tienda.nombre}`,
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
      console.error('❌ [Upway Vapi Service] Error del proveedor de voz:', vapiData);
      throw new Error(vapiData.message || 'Fallo en la comunicación con la API de voz.');
    }

    const nuevoAssistantId = vapiData.id;
    console.log(`✅ [Upway Vapi Service] Agente corporativo creado. ID: ${nuevoAssistantId}`);

    // 4. ACTUALIZACIÓN TRANSACCIONAL
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
      mensaje: `Agente vinculado exitosamente a: ${tienda.nombre}`
    });

  } catch (error) {
    console.error('❌ [Upway Vapi Service] Error crítico:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}