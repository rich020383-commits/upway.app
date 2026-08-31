import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOwnedTienda } from '@/lib/session';
import { deleteProduct, listProducts, updateProduct } from '@/lib/app-state';

export async function GET(req: NextRequest) {
  // 🛡️ Solo el dueño ve el inventario de su tienda
  const { tienda, error } = await getOwnedTienda(req, prisma);
  if (error) return error;

  const productos = await listProducts(tienda.id);
  return NextResponse.json({ inventario: productos });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.precio !== undefined && (!Number.isFinite(Number(body.precio)) || Number(body.precio) < 0)) {
      return NextResponse.json({ error: 'Precio inválido' }, { status: 400 });
    }

    // 🛡️ Ownership garantizado: el producto debe pertenecer a una tienda del usuario
    const { tienda, error } = await getOwnedTienda(req, prisma);
    if (error) return error;

    const updated = await updateProduct(tienda.id, id, {
      nombre: typeof body.nombre === 'string' ? body.nombre : undefined,
      categoria: typeof body.categoria === 'string' ? body.categoria : undefined,
      precio: body.precio !== undefined ? Number(body.precio) : undefined,
      disponible: typeof body.disponible === 'boolean' ? body.disponible : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Producto no encontrado para esta tienda.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, producto: updated });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo actualizar el producto.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 🛡️ Ownership garantizado
    const { tienda, error } = await getOwnedTienda(req, prisma);
    if (error) return error;

    const deleted = await deleteProduct(tienda.id, id);
    if (!deleted) {
      return NextResponse.json({ error: 'Producto no encontrado para esta tienda.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo eliminar el producto.' }, { status: 500 });
  }
}
