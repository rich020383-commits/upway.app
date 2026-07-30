import { NextResponse } from 'next/server';
import { deleteProduct, listProducts, updateProduct } from '@/lib/app-state';

export async function GET(req: Request) {
  const { pathname } = new URL(req.url);
  const tiendaId = pathname.split('/').filter(Boolean).pop() ?? '1172769935927318';
  const productos = await listProducts(tiendaId);
  return NextResponse.json({ inventario: productos });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateProduct(id, body);
    return NextResponse.json({ ok: true, producto: updated });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo actualizar el producto.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const deleted = await deleteProduct(id);
    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo eliminar el producto.' }, { status: 500 });
  }
}
