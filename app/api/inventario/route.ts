import { NextResponse } from 'next/server';
import { createProduct, listProducts } from '@/lib/app-state';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tiendaId = searchParams.get('tiendaId') ?? '1172769935927318';
  const productos = await listProducts(tiendaId);
  return NextResponse.json({ inventario: productos });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const producto = await createProduct({
      tiendaId: body.tienda_id ?? '1172769935927318',
      nombre: body.nombre,
      categoria: body.categoria ?? 'General',
      precio: Number(body.precio ?? 0),
      disponible: body.disponible ?? true,
    });
    return NextResponse.json({ ok: true, producto });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo guardar el producto.' }, { status: 500 });
  }
}
