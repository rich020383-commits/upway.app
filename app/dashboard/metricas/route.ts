import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    // 1. Capturamos el ID de la tienda desde la URL
    const { searchParams } = new URL(req.url);
    const tiendaId = searchParams.get('tiendaId');

    if (!tiendaId) {
      return NextResponse.json({ error: 'Falta el ID de la tienda' }, { status: 400 });
    }

    // 2. PACIENTES PERFILADOS: Contamos todos los leads de esta tienda
    const totalLeads = await prisma.lead.count({
      where: { tiendaId: tiendaId }
    });

    // 3. CITAS AGENDADAS: Contamos los leads que llegaron al estado final
    const citasAgendadas = await prisma.lead.count({
      where: { 
        tiendaId: tiendaId,
        estado: 'Cita_Agendada' 
      }
    });

    // 4. TIEMPO AHORRADO REAL: Sumamos los minutos de todas las llamadas en LlamadaLog
    const sumatoriaLlamadas = await prisma.llamadaLog.aggregate({
      where: { tiendaId: tiendaId },
      _sum: {
        durationMinutes: true
      }
    });
    
    const minutosTotales = sumatoriaLlamadas._sum.durationMinutes || 0;
    // Si quieres mostrar horas, lo divides. Si prefieres mostrar minutos porque al inicio son pocos, lo dejas así.
    // Vamos a pasarlo a un formato de horas con un decimal (ej: 1.5 horas)
    const horasAhorradas = (minutosTotales / 60).toFixed(1);

    // 5. RESOLUCIÓN AUTÓNOMA: Porcentaje de llamadas completadas con éxito
    const llamadasTotales = await prisma.llamadaLog.count({
      where: { tiendaId: tiendaId }
    });
    
    const llamadasCompletadas = await prisma.llamadaLog.count({
      where: { 
        tiendaId: tiendaId,
        status: 'completed' // O el estado que envíe Vapi cuando todo sale bien
      }
    });

    let resolucion = 0;
    if (llamadasTotales > 0) {
      resolucion = Math.round((llamadasCompletadas / llamadasTotales) * 100);
    } else if (totalLeads > 0) {
      // Si no hay logs de llamadas aún pero sí hay leads por chat, asumimos 100%
      resolucion = 100; 
    }

    // 6. Enviamos la realidad al Dashboard
    return NextResponse.json({
      leads: totalLeads,
      citas: citasAgendadas,
      horasAhorradas: parseFloat(horasAhorradas),
      resolucion: resolucion
    });

  } catch (error) {
    console.error('❌ Error obteniendo métricas reales:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}