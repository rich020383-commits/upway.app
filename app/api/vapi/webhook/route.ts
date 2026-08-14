import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 💰 MARGEN DE GANANCIA DE UPWAY
// Si Vapi te cobra $0.10, Upway le cobra $0.15 a la IPS (50% de ganancia)
const UPWAY_MARKUP_MULTIPLIER = 1.5; 

// ==========================================
// RECEPCIÓN DE EVENTOS VAPI (POST)
// ==========================================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. FILTRO DE EVENTOS
    // Vapi envía muchos eventos (cuando timbra, cuando transcribe). 
    // Solo nos importa el reporte financiero cuando la llamada termina.
    const messageType = body?.message?.type;
    
    if (messageType !== 'end-of-call-report') {
      // Si no es el fin de llamada, devolvemos un 200 OK y no hacemos nada
      return new NextResponse(null, { status: 200 });
    }

    const callData = body.message.call;
    const vapiAssistantId = callData?.assistantId;
    const vapiCallId = callData?.id;

    // 🛡️ BARRERA ANTIBUCLES (Igual que en Meta)
    // Le devolvemos el 200 OK a Vapi de inmediato para que no marque error por timeout
    const response = new NextResponse(null, { status: 200 });

    // Ejecutamos la lógica financiera en segundo plano
    void (async () => {
      try {
        if (!vapiAssistantId || !vapiCallId) return;

        console.log(`🎙️ Procesando fin de llamada Vapi ID: ${vapiCallId}`);

        // 2. MAGIA MULTI-TENANT: Buscar de quién es este asistente
        const tienda = await prisma.tienda.findFirst({
          where: { vapiAssistantId: vapiAssistantId }
        });

        if (!tienda) {
          console.warn(`⚠️ Llamada huérfana. No existe cliente en Upway con el agente: ${vapiAssistantId}`);
          return;
        }

        // 3. MATEMÁTICA FINANCIERA
        const vapiCost = callData?.cost || 0;
        const upwayBilledCost = vapiCost * UPWAY_MARKUP_MULTIPLIER;
        
        // Calcular duración exacta en minutos
        let durationMinutes = 0;
        if (callData?.startedAt && callData?.endedAt) {
          const start = new Date(callData.startedAt).getTime();
          const end = new Date(callData.endedAt).getTime();
          durationMinutes = (end - start) / 60000; // milisegundos a minutos
        }

        const direction = callData?.type || 'unknown'; // 'inbound' (entrante) o 'outbound' (saliente)
        const status = callData?.status || 'completed';

        // 4. GUARDAR EN LA REGISTRADORA (LlamadaLog)
        await prisma.llamadaLog.create({
          data: {
            tiendaId: tienda.id,
            vapiCallId: vapiCallId,
            direction: direction,
            durationMinutes: Number(durationMinutes.toFixed(2)),
            vapiCost: Number(vapiCost),
            upwayBilledCost: Number(upwayBilledCost),
            status: status
          }
        });

        console.log(`✅ Vapi Webhook: Llamada cobrada a ${tienda.nombre} -> Margen: $${upwayBilledCost.toFixed(3)} USD`);

      } catch (error) {
        console.error('❌ Error guardando el log financiero de Vapi:', error);
      }
    })();

    return response;

  } catch (error) {
    console.error('❌ Error crítico en Webhook de Vapi:', error);
    return new NextResponse('Error Interno', { status: 500 });
  }
}