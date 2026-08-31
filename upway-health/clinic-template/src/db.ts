import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const globalAny = global as unknown as { prisma?: PrismaClient };
export const prisma = globalAny.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalAny.prisma = prisma;

export const WHATSAPP = {
  token: process.env.WHATSAPP_TOKEN!,
  phoneId: process.env.WHATSAPP_PHONE_ID!,
};

/** Envía un mensaje de WhatsApp desde esta clínica (su propio token). */
export async function sendWhatsApp(to: string, body: string) {
  await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP.phoneId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WHATSAPP.token}` },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
  });
}

/** Descarga y persiste un media (imagen de cédula/orden) en el volumen local del piso. */
export async function downloadMedia(mediaId: string, pacienteId: string): Promise<string> {
  const meta = await (await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${WHATSAPP.token}` },
  })).json();
  const bin = await (await fetch(meta.url, { headers: { Authorization: `Bearer ${WHATSAPP.token}` } })).arrayBuffer();
  const path = `/app/documentos/${pacienteId}/${crypto.randomUUID()}.jpg`;
  await import('fs').then((fs) => fs.promises.mkdir(`${path.slice(0, path.lastIndexOf('/'))}`, { recursive: true }));
  await import('fs').then((fs) => fs.promises.writeFile(path, Buffer.from(bin)));
  return path;
}
