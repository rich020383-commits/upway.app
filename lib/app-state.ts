import { hashPassword, verifyPassword } from './auth-utils';

export type AppUser = {
  id: string;
  name: string | null;
  email: string | null;
  password?: string | null;
};

export type AppProduct = {
  id: string;
  tiendaId: string;
  nombre: string;
  categoria: string;
  precio: number;
  disponible: boolean;
  creadoEn: string;
};

const TIENDA_ID = '1172769935927318';

const initialUsers: AppUser[] = [
  {
    id: 'demo-upway',
    name: 'Demo Upway',
    email: 'demo@upway.app',
    password: hashPassword('upway123'),
  },
];

const initialProducts: AppProduct[] = [
  {
    id: 'prod-001',
    tiendaId: TIENDA_ID,
    nombre: 'Bot de WhatsApp Premium',
    categoria: 'Software',
    precio: 1490000,
    disponible: true,
    creadoEn: new Date().toISOString(),
  },
  {
    id: 'prod-002',
    tiendaId: TIENDA_ID,
    nombre: 'Gestor de Inventario IA',
    categoria: 'Automatización',
    precio: 980000,
    disponible: true,
    creadoEn: new Date().toISOString(),
  },
];

let users: AppUser[] = [...initialUsers];
let products: AppProduct[] = [...initialProducts];

export async function authenticateUser(email: string, password: string) {
  const user = users.find((entry) => entry.email?.toLowerCase() === email.toLowerCase());
  if (!user?.password) return null;
  return verifyPassword(password, user.password) ? user : null;
}

export async function createUser(input: { name: string; email: string; password: string }) {
  const exists = users.some((entry) => entry.email?.toLowerCase() === input.email.toLowerCase());
  if (exists) return null;

  const newUser: AppUser = {
    id: `user-${Date.now()}`,
    name: input.name,
    email: input.email,
    password: hashPassword(input.password),
  };

  users = [...users, newUser];
  return newUser;
}

export async function findUserByEmail(email: string) {
  return users.find((entry) => entry.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function listProducts(tiendaId = TIENDA_ID) {
  return products.filter((product) => product.tiendaId === tiendaId);
}

export async function createProduct(input: Omit<AppProduct, 'id' | 'creadoEn'>) {
  const newProduct: AppProduct = {
    id: `prod-${Date.now()}`,
    tiendaId: input.tiendaId,
    nombre: input.nombre,
    categoria: input.categoria,
    precio: input.precio,
    disponible: input.disponible,
    creadoEn: new Date().toISOString(),
  };
  products = [newProduct, ...products];
  return newProduct;
}

export async function updateProduct(id: string, input: Partial<AppProduct>) {
  let updated: AppProduct | null = null;
  products = products.map((product) => {
    if (product.id === id) {
      updated = { ...product, ...input };
      return updated;
    }
    return product;
  });
  return updated;
}

export async function deleteProduct(id: string) {
  const before = products.length;
  products = products.filter((product) => product.id !== id);
  return products.length < before;
}

export async function importProductsFromRows(rows: Array<{ nombre: string; categoria: string; precio: number; disponible: boolean }>, tiendaId = TIENDA_ID) {
  const created: AppProduct[] = [];
  for (const row of rows) {
    created.push(
      await createProduct({
        tiendaId,
        nombre: row.nombre,
        categoria: row.categoria || 'General',
        precio: row.precio,
        disponible: row.disponible,
      })
    );
  }
  return created;
}
