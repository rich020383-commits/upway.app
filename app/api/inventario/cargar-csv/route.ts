import { NextResponse } from 'next/server';
import { importProductsFromRows } from '@/lib/app-state';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const archivo = formData.get('archivo');
    const tiendaId = (formData.get('tienda_id') as string) ?? '1172769935927318';

    if (!(archivo instanceof File) || !archivo.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Sube un archivo CSV válido.' }, { status: 400 });
    }

    const text = await archivo.text();
    const rows = text
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.split(',')).filter((parts) => parts.some(Boolean));

    const productos = await importProductsFromRows(
      rows.map(([nombre, categoria, precio, disponible]) => ({
        nombre: nombre?.trim() ?? '',
        categoria: categoria?.trim() ?? 'General',
        precio: Number(precio ?? 0),
        disponible: disponible?.toLowerCase() !== 'false',
      })),
      tiendaId
    );

    return NextResponse.json({ ok: true, productos });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo procesar el archivo.' }, { status: 500 });
  }
}
