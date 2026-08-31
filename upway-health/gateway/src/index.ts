/**
 * UPWAY HEALTH — GATEWAY CENTRAL (Single entrypoint)
 * Rol: verificar webhooks de Meta, resolver la clínica destino por phone_number_id
 * y enrutar al "piso" correspondiente. Si el piso está saturado, el mensaje entra
 * a la SALA DE ESPERA (BullMQ sobre Redis) y se entrega cuando haya capacidad.
 * El Gateway NUNCA toca datos médicos: solo { phoneId -> internalUrl }.
 */
import express from 'express';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import axios from 'axios';
import crypto from 'crypto';

const app = express();
// raw body para validar firma HMAC de Meta
app.use(express.raw({ type: 'application/json', limit: '2mb' }));

const redis = new Redis({ host: process.env.REDIS_HOST || 'redis', port: 6379 });
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN!;
const META_APP_SECRET = process.env.META_APP_SECRET!;
const MAX_CONCURRENT = Number(process.env.CLINIC_MAX_CONCURRENT || 20);

const waitingRoom = new Queue('wa-delivery', {
  connection: redis,
  defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 3000 }, removeOnComplete: 500 },
});

// ============ Registro de clínicas (Multi-Instancia) ============
// Alta de piso:  redis set clinic:phone:{PHONE_NUMBER_ID} '{"slug":"clinica-x","internalUrl":"http://clinic-clinica-x:3001"}'
async function resolveClinic(phoneId: string) {
  const raw = await redis.get(`clinic:phone:${phoneId}`);
  return raw ? (JSON.parse(raw) as { slug: string; internalUrl: string }) : null;
}

// ============ Seguridad: firma HMAC de Meta ============
function verifyMetaSignature(raw: Buffer, header: string | null): boolean {
  if (!header?.startsWith('sha256=')) return false;
  const expected = crypto.createHmac('sha256', META_APP_SECRET).update(raw).digest('hex');
  const a = Buffer.from(header.slice(7));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ============ Webhook de WhatsApp ============
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === META_VERIFY_TOKEN) {
    return res.status(200).send(req.query['hub.challenge']);
  }
  res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  // Responder 200 a Meta de inmediato; la entrega es asíncrona.
  res.sendStatus(200);

  try {
    if (!verifyMetaSignature(req.body as Buffer, req.headers['x-hub-signature-256'] as string)) {
      console.warn('[GATEWAY] firma inválida, request descartado');
      return;
    }

    const body = JSON.parse(req.body.toString('utf8'));
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        if (!value?.messages?.length) continue;

        const phoneId = value.metadata?.phone_number_id;
        const clinic = phoneId ? await resolveClinic(phoneId) : null;
        if (!clinic) {
          console.warn(`[GATEWAY] mensaje huérfano: sin clínica para phoneId=${phoneId}`);
          continue;
        }

        // Control de picos: contador de entregas activas por clínica (TTL 120s)
        const active = await redis.incr(`clinic:busy:${clinic.slug}`);
        await redis.expire(`clinic:busy:${clinic.slug}`, 120);

        if (active > MAX_CONCURRENT) {
          // SALA DE ESPERA: no se pierde el mensaje, entra a la cola del piso
          await waitingRoom.add('deliver', { clinic, value }, { jobId: `wa-${value.messages[0].id}` });
          console.log(`[GATEWAY] ${clinic.slug} saturada (${active}). Mensaje en sala de espera.`);
        } else {
          deliver(clinic, value).catch(async (err: any) => {
            console.error(`[GATEWAY] fallo entrega inmediata a ${clinic.slug}, encolando`, err.message);
            await waitingRoom.add('deliver', { clinic, value }, { jobId: `wa-${value.messages[0].id}` });
          });
        }
      }
    }
  } catch (err) {
    console.error('[GATEWAY] error procesando webhook', err);
  }
});

async function deliver(clinic: { slug: string; internalUrl: string }, value: unknown) {
  await axios.post(`${clinic.internalUrl}/whatsapp/incoming`, value, { timeout: 8000 });
  await redis.decr(`clinic:busy:${clinic.slug}`);
}

// ============ Consumidor de la sala de espera ============
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function drainWaitingRoom() {
  for (; ;) {
    try {
      const jobs = await waitingRoom.getJobs(['waiting', 'delayed'], 0, 9);
      if (jobs.length === 0) {
        await sleep(2000);
        continue;
      }
      for (const job of jobs) {
        const { clinic, value } = job.data;
        const active = Number((await redis.get(`clinic:busy:${clinic.slug}`)) || 0);
        if (active < MAX_CONCURRENT) {
          await deliver(clinic, value);
          await job.remove();
        }
      }
    } catch {
      await sleep(5000);
    }
  }
}

// ============ API de administración del Gateway (protegida por token) ============
app.post('/admin/clinics', express.json(), async (req, res) => {
  if (req.headers['x-admin-token'] !== process.env.ADMIN_TOKEN) return res.sendStatus(401);
  const { slug, internalUrl, phoneIds } = req.body;
  for (const pid of phoneIds) {
    await redis.set(`clinic:phone:${pid}`, JSON.stringify({ slug, internalUrl }));
  }
  await redis.sadd('clinics', slug);
  res.json({ ok: true, slug, phoneIds });
});

app.get('/health', async (_req, res) => {
  res.json({ ok: true, clinics: await redis.smembers('clinics'), waiting: await waitingRoom.getWaitingCount() });
});

drainWaitingRoom();
app.listen(process.env.PORT || 8080, () => console.log('[GATEWAY] arriba en :8080'));
