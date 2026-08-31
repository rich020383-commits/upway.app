import { prisma } from '@/lib/prisma';
import type { Prisma, Producto as ProductoModel } from '@prisma/client';

/**
 * Capa de acceso a datos de INVENTARIO sobre Prisma/Neon.
 * Reemplaza el estado en memoria (los datos ya no se pierden al reiniciar).
 *
 * Multi-tenant: todas las operaciones reciben `tiendaId`, y los endpoints
 * que llaman aquí deben garantizar ownership vía `getOwnedTienda` (lib/session.ts).
 */

export type AppProduct = {
  id: string;
  tiendaId: string;
  nombre: string;
  categoria: string;
  precio: number;
  disponible: boolean;
  creadoEn: string;
};

function toAppProduct(p: ProductoModel): AppProduct {
  return {
    id: p.id,
    tiendaId: p.tiendaId,
    nombre: p.nombre,
    categoria: (p as { categoria?: string | null }).categoria ?? 'General',
    precio: p.precio,
    disponible: true,
    creadoEn: new Date().toISOString(),
  };
}

/** Lista los productos de una tienda (ordenados por creación). */
export async function listProducts(tiendaId: string): Promise<AppProduct[]> {
  const productos = await prisma.producto.findMany({
    where: { tiendaId },
  });
  return productos.map(toAppProduct);
}

/** Crea un producto. `tiendaId` debe venir validado con getOwnedTienda. */
export async function createProduct(input: {
  tiendaId: string;
  nombre: string;
  categoria: string;
  precio: number;
  disponible?: boolean;
}): Promise<AppProduct> {
  const p = await prisma.producto.create({
    data: {
      tiendaId: input.tiendaId,
      nombre: input.nombre,
      descripcion: input.categoria || 'General',
      precio: input.precio,
      stock: input.disponible === false ? 0 : 1,
    },
  });
  return toAppProduct(p);
}

/** Actualiza un producto verificando que pertenece a la tienda indicada. */
export async function updateProduct(
  tiendaId: string,
  id: string,
  input: Partial<{ nombre: string; categoria: string; precio: number; disponible: boolean }>
): Promise<AppProduct | null> {
  const data: Prisma.ProductoUpdateInput = {};
  if (input.nombre !== undefined) data.nombre = input.nombre;
  if (input.categoria !== undefined) data.descripcion = input.categoria;
  if (input.precio !== undefined) data.precio = input.precio;
  if (input.disponible !== undefined) data.stock = input.disponible ? 1 : 0;

  try {
    const p = await prisma.producto.update({
      where: { id },
      data,
    });
    if (p.tiendaId !== tiendaId) return null; // ownership
    return toAppProduct(p);
  } catch {
    return null; // P2025: no existe
  }
}

/** Elimina un producto verificando ownership. Devuelve false si no existía o no es de la tienda. */
export async function deleteProduct(tiendaId: string, id: string): Promise<boolean> {
  const existing = await prisma.producto.findUnique({ where: { id } });
  if (!existing || existing.tiendaId !== tiendaId) return false;
  await prisma.producto.delete({ where: { id } });
  return true;
}

/** Importación en lote desde CSV (ya con tiendaId validado por el endpoint). */
export async function importProductsFromRows(
  rows: Array<{ nombre: string; categoria: string; precio: number; disponible: boolean }>,
  tiendaId: string
): Promise<AppProduct[]> {
  const created: AppProduct[] = [];
  for (const row of rows) {
    if (!row.nombre) continue;
    created.push(
      await createProduct({
        tiendaId,
        nombre: row.nombre,
        categoria: row.categoria || 'General',
        precio: Number(row.precio) || 0,
        disponible: row.disponible,
      })
    );
  }
  return created;
}
