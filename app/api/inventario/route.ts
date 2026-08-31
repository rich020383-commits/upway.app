import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOwnedTienda } from '@/lib/session';
import { createProduct, listProducts } from '@/lib/app-state';

export async function GET(req: NextRequest) {
  // 🛡️ Solo el dueño ve el inventario de su tienda
  const { tienda, error } = await getOwnedTienda(req, prisma);
  if (error) return error;

  const productos = await listProducts(tienda.id);
  return NextResponse.json({ inventario: productos });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.nombre || typeof body.nombre !== 'string' || body.nombre.length > 200) {
      return NextResponse.json({ error: 'Nombre de producto inválido' }, { status: 400 });
    }
    const precio = Number(body.precio ?? 0);
    if (!Number.isFinite(precio) || precio < 0) {
      return NextResponse.json({ error: 'Precio inválido' }, { status: 400 });
    }

    // 🛡️ El tiendaId SIEMPRE se resuelve desde la sesión del dueño
    const { tienda, error } = await getOwnedTienda(req, prisma, body.tienda_id ?? null);
    if (error) return error;

    const producto = await createProduct({
      tiendaId: tienda.id,
      nombre: body.nombre,
      categoria: typeof body.categoria === 'string' ? body.categoria : 'General',
      precio,
      disponible: body.disponible !== false,
    });
    return NextResponse.json({ ok: true, producto });
  } catch {
    return NextResponse.json({ error: 'No se pudo guardar el producto.' }, { status: 500 });
  }
}
