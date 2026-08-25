import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    const { 
      userId, 
      nombreNegocio, 
      nombreAgente, 
      promptMaestro, 
      modulosSeleccionados,
      telefonoAdmin // 🚀 NUEVO: Atrapamos el número del Human Handoff 
    } = data;

    if (!userId || !nombreNegocio || !nombreAgente) {
      return NextResponse.json(
        { error: 'Faltan datos críticos para crear la infraestructura.' },
        { status: 400 }
      );
    }

    // 🛡️ BARRERA DEFENSIVA: Aseguramos que el usuario EXISTA físicamente en la tabla User de Neon DB
    let userExists = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userExists) {
      console.log(`⚠️ [Aprovisionamiento] El usuario con ID "${userId}" no existía en la BD. Creándolo de emergencia...`);
      userExists = await prisma.user.create({
        data: {
          id: userId,
          email: userId === 'meta-reviewer' ? 'revisor_meta@upway.business' : `${userId}@upway.local`,
          name: userId === 'meta-reviewer' ? 'Meta Reviewer' : 'Usuario Upway'
        }
      });
    }

    // Traducción de módulos del carrito a la base de datos
    const hasWhatsApp = Array.isArray(modulosSeleccionados) && modulosSeleccionados.includes('whatsapp');
    const hasVoice = Array.isArray(modulosSeleccionados) && modulosSeleccionados.includes('voz');
    // 🗑️ Se eliminó la validación del calendario ya que se retiró del modelo.

    // 🔍 Verificamos si ya existe una tienda para este usuario de manera segura
    let nuevaTienda = await prisma.tienda.findFirst({
      where: { userId: userExists.id }
    });

    if (nuevaTienda) {
      // Si ya existe, actualizamos sus datos
      nuevaTienda = await prisma.tienda.update({
        where: { id: nuevaTienda.id },
        data: {
          nombre: nombreNegocio,
          agentName: nombreAgente,
          systemPrompt: promptMaestro,
          isWhatsAppActive: hasWhatsApp,
          isVapiActive: hasVoice,
          telefonoAdmin: telefonoAdmin || null, // 🚀 NUEVO: Lo guardamos en BD
        }
      });
    } else {
      // Si no existe, la creamos desde cero
      nuevaTienda = await prisma.tienda.create({
        data: {
          userId: userExists.id, 
          nombre: nombreNegocio,
          agentName: nombreAgente,
          systemPrompt: promptMaestro,
          isWhatsAppActive: hasWhatsApp,
          isVapiActive: hasVoice,
          telefonoAdmin: telefonoAdmin || null, // 🚀 NUEVO: Lo guardamos en BD
        }
      });
    }

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