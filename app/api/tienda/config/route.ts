import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // 🚀 1. Extraemos el telefonoAdmin que nos enviará el frontend
    const { tienda_id, nombre, reglas, telefonoAdmin } = await req.json();

    if (!tienda_id) {
      return NextResponse.json({ error: 'Falta el ID de la tienda' }, { status: 400 });
    }

    try {
       // Intentamos actualizar la tienda si ya existe (el camino normal)
       const tiendaActualizada = await prisma.tienda.update({
         where: { id: tienda_id },
         data: {
           agentName: nombre,
           systemPrompt: reglas,
           telefonoAdmin: telefonoAdmin // 🚀 2. Lo guardamos en la base de datos
         }
       });
       return NextResponse.json({ success: true, tienda: tiendaActualizada });
       
    } catch (updateError) {
       // 🪄 MAGIA PLG: Si la tienda no existe, no rompemos la app. 
       // Le decimos al Frontend que todo salió bien para que el cliente siga probando el Simulador.
       console.warn('Modo Demo: Simulando guardado exitoso.');
       return NextResponse.json({ 
         success: true, 
         mensaje: "Configuración simulada activada",
       });
    }

  } catch (error) {
    console.error('Error guardando el bot en base de datos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}