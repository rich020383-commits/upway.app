import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    const { 
      userId, 
      nombreNegocio, 
      nombreAgente, 
      promptMaestro, 
      modulosSeleccionados, 
    } = data;

    if (!userId || !nombreNegocio || !nombreAgente) {
      return NextResponse.json(
        { error: 'Faltan datos críticos para crear la infraestructura.' },
        { status: 400 }
      );
    }

    // Traducción de módulos del carrito a la base de datos
    const hasWhatsApp = modulosSeleccionados.includes('whatsapp');
    const hasVoice = modulosSeleccionados.includes('voz');
    const hasCalendar = modulosSeleccionados.includes('calendario');

    // Inserción en Neon DB
    const nuevaTienda = await prisma.tienda.create({
      data: {
        userId: userId, 
        nombre: nombreNegocio,
        agentName: nombreAgente,
        systemPrompt: promptMaestro,
        isWhatsAppActive: hasWhatsApp,
        isVapiActive: hasVoice,
        googleCalendarId: hasCalendar ? 'primary' : null, 
      }
    });

    return NextResponse.json({ 
      success: true, 
      mensaje: '¡Infraestructura aprovisionada con éxito!',
      tiendaId: nuevaTienda.id 
    });

  } catch (error) {
    console.error('Error crítico aprovisionando tienda:', error);
    return NextResponse.json(
      { error: 'Fallo interno al crear la tienda en la base de datos.' },
      { status: 500 }
    );
  }
}