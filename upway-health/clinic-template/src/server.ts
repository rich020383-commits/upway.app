/**
 * Servidor del piso clínico: recibe del Gateway, ejecuta el flujo clínico
 * y emite eventos en vivo al dashboard (WebSockets).
 */
import Fastify from 'fastify';
import { prisma } from './db';
import { TriageController } from './controllers/TriageController';

const app = Fastify({ logger: true });

// ============ Entrada única: el Gateway ya validó la firma de Meta ============
app.post('/whatsapp/incoming', async (req, reply) => {
  reply.status(200).send(); // ACK inmediato; el procesamiento es async
  const value: any = (req.body as any)?.changes?.[0]?.value;
  const msg = value?.messages?.[0];
  if (!msg) return;

  const telefono = msg.from;
  const texto = msg.text?.body ?? `[multimedia:${msg.type}]`;
  const nombre = value.contacts?.[0]?.profile?.name ?? 'Paciente';

  // Fire-and-forget: nunca bloqueamos el ACK
  TriageController.procesar({ telefono, nombre, texto, mensajeMetaId: msg.id, tipo: msg.type, mediaId: msg.image?.id })
    .catch((e) => app.log.error({ err: e }, 'fallo triage'));
});

app.get('/health', async () => ({ ok: true, slug: process.env.CLINIC_SLUG }));

app.listen({ port: 3001, host: '0.0.0.0' });