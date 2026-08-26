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
      telefonoAdmin 
    } = data;

    if (!userId || !nombreNegocio || !nombreAgente) {
      return NextResponse.json(
        { error: 'Faltan datos críticos para crear la infraestructura.' },
        { status: 400 }
      );
    }

    const targetEmail = userId === 'meta-reviewer' ? 'revisor_meta@upway.business' : `${userId}@upway.local`;

    // 🛡️ BARRERA DEFENSIVA INTELIGENTE: Buscamos por ID o por Email para evitar colisiones P2002
    let userExists = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { email: targetEmail }
        ]
      }
    });

    if (!userExists) {
      console.log(`⚠️ [Aprovisionamiento] El usuario con ID "${userId}" o email "${targetEmail}" no existía. Creándolo de emergencia...`);
      try {
        userExists = await prisma.user.create({
          data: {
            id: userId,
            email: targetEmail,
            name: userId === 'meta-reviewer' ? 'Meta Reviewer' : 'Usuario Upway'
          }
        });
      } catch (createError: any) {
        // Red de seguridad extrema por si ocurre una condición de carrera simultánea
        if (createError.code === 'P2002') {
          userExists = await prisma.user.findUnique({
            where: { email: targetEmail }
          });
        } else {
          throw createError;
        }
      }
    }

    // Traducción modular de módulos del carrito a la base de datos
    const hasWhatsApp = Array.isArray(modulosSeleccionados) && modulosSeleccionados.includes('whatsapp');
    const hasVoice = Array.isArray(modulosSeleccionados) && modulosSeleccionados.includes('voz');

    // 🔍 Verificamos si ya existe una tienda para este usuario de manera segura
    let nuevaTienda = await prisma.tienda.findFirst({
      where: { userId: userExists!.id }
    });

    if (nuevaTienda) {
      // Si ya existe, actualizamos sus datos de forma independiente
      nuevaTienda = await prisma.tienda.update({
        where: { id: nuevaTienda.id },
        data: {
          nombre: nombreNegocio,
          agentName: nombreAgente,
          systemPrompt: promptMaestro,
          isWhatsAppActive: hasWhatsApp,
          isVapiActive: hasVoice,
          telefonoAdmin: telefonoAdmin || null,
        }
      });
    } else {
      // Si no existe, la creamos desde cero con los módulos exactos elegidos
      nuevaTienda = await prisma.tienda.create({
        data: {
          userId: userExists!.id, 
          nombre: nombreNegocio,
          agentName: nombreAgente,
          systemPrompt: promptMaestro,
          isWhatsAppActive: hasWhatsApp,
          isVapiActive: hasVoice,
          telefonoAdmin: telefonoAdmin || null,
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      mensaje: '¡Infraestructura aprovisionada con éxito!',
      tiendaId: nuevaTienda.id 
    });

  } catch (error) {
    console.error('❌ Error crítico aprovisionando tienda:', error);
    return NextResponse.json(
      { error: 'Fallo interno al crear la tienda en la base de datos.' },
      { status: 500 }
    );
  }
}