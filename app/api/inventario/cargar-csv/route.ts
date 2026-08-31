import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOwnedTienda } from '@/lib/session';
import { importProductsFromRows } from '@/lib/app-state';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const archivo = formData.get('archivo');

    if (!(archivo instanceof File) || !archivo.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Sube un archivo CSV válido.' }, { status: 400 });
    }

    if (archivo.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo no debe superar 5 MB.' }, { status: 400 });
    }

    // 🛡️ El tiendaId SIEMPRE se resuelve desde la sesión del dueño
    const { tienda, error } = await getOwnedTienda(req, prisma);
    if (error) return error;

    const text = await archivo.text();
    const rows = text
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.split(',')).filter((parts) => parts.some(Boolean));

    // Límite razonable de filas por importación
    if (rows.length > 1000) {
      return NextResponse.json({ error: 'Máximo 1000 filas por importación.' }, { status: 400 });
    }

    const productos = await importProductsFromRows(
      rows.map(([nombre, categoria, precio, disponible]) => ({
        nombre: nombre?.trim() ?? '',
        categoria: categoria?.trim() ?? 'General',
        precio: Number(precio ?? 0),
        disponible: disponible?.toLowerCase() !== 'false',
      })),
      tienda.id
    );

    return NextResponse.json({ ok: true, productos });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo procesar el archivo.' }, { status: 500 });
  }
}
