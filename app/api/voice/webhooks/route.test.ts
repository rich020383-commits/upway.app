import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tienda: { findFirst: vi.fn(), update: vi.fn() },
    llamadaLog: { upsert: vi.fn() },
  },
}));
// Solo se tapan las consultas de entorno. `decodeClientState` se usa el de
// verdad a propósito: es lógica pura y lo que se quiere probar es que de verdad
// decodifique, no que un mock devuelva lo que le pedimos.
vi.mock('@/lib/telnyx/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/telnyx/client')>()),
  missingTelnyxCallEnv: vi.fn(() => []),
  missingTelnyxVoiceEnv: vi.fn(() => []),
}));

import { prisma } from '@/lib/prisma';
import { POST } from './route';

const mockedLlamadaUpsert = prisma.llamadaLog.upsert as unknown as Mock;
const mockedTiendaFind = prisma.tienda.findFirst as unknown as Mock;

/**
 * Payload REAL de `call.hangup`, copiado de la documentación de Telnyx
 * (developers.telnyx.com/api-reference/callbacks/call-hangup, 25-sep-2026).
 *
 * El detalle que importa: NO tiene `call_duration_secs` ni `direction`. El
 * código los leía igual, así que toda llamada se guardaba con 0 minutos y como
 * 'inbound'. La duración real sale de restar `start_time` de `occurred_at`.
 */
const HANGUP_REAL = {
  data: {
    record_type: 'event',
    event_type: 'call.hangup',
    id: '0ccc7b54-4df3-4bca-a65a-3da1ecc777f0',
    occurred_at: '2018-02-02T22:25:27.521992Z',
    payload: {
      call_control_id: 'v3:MdI91X4lWFEs7IgbBEOT9M4AigoY08M0WWZFISt1Yw2axZ_IiE4pqg',
      connection_id: '7267xxxxxxxxxxxxxx',
      call_leg_id: '428c31b6-7af4-4bcb-b7f5-5013ef9657c1',
      call_session_id: '428c31b6-7af4-4bcb-b7f5-5013ef9657c1',
      client_state: Buffer.from('tienda-1', 'utf8').toString('base64'),
      from: '+573001234567',
      to: '+573009876543',
      start_time: '2018-02-02T22:20:27.521992Z',
      state: 'hangup',
      hangup_cause: 'call_rejected',
      hangup_source: 'caller',
      call_quality_stats: {
        inbound: { jitter_max_variance: '2.74', jitter_packet_count: '0', mos: '4.50', packet_count: '591', skip_packet_count: '9' },
        outbound: { packet_count: '0', skip_packet_count: '0' },
      },
    },
  },
};

function requestWith(body: unknown) {
  return new NextRequest('https://upway.business/api/voice/webhooks', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/voice/webhooks — call.hangup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedLlamadaUpsert.mockResolvedValue({});
    mockedTiendaFind.mockResolvedValue({ id: 'tienda-1' });
  });

  it('calcula la duración con los tiempos reales y la guarda', async () => {
    // start_time 22:20:27 → occurred_at 22:25:27 = 5 minutos exactos.
    await POST(requestWith(HANGUP_REAL));

    expect(mockedLlamadaUpsert).toHaveBeenCalledTimes(1);
    const guardado = mockedLlamadaUpsert.mock.calls[0][0];
    // 5 minutos. Con el bug anterior esto era 0 siempre.
    expect(guardado.create.durationMinutes).toBe(5);
    // Y el costo se deriva de esos minutos, no de 0.
    expect(guardado.create.upwayBilledCost).toBeGreaterThan(0);
  });

  it('deduce outbound cuando client_state es una tienda nuestra', async () => {
    mockedTiendaFind.mockResolvedValue({ id: 'tienda-1' });
    await POST(requestWith(HANGUP_REAL));
    expect(mockedLlamadaUpsert.mock.calls[0][0].create.direction).toBe('outbound');
  });

  it('trata como inbound un client_state que no es tienda nuestra', async () => {
    // Una entrante llega con el client_state de la_numbers application.
    mockedTiendaFind.mockResolvedValue(null);
    const entrante = structuredClone(HANGUP_REAL);
    entrante.data.payload.client_state = Buffer.from('app-de-la-llamadora').toString('base64');
    await POST(requestWith(entrante));
    expect(mockedLlamadaUpsert.mock.calls[0][0].create.direction).toBe('inbound');
  });

  it('decodifica el Base-64 del client_state para sacar el tiendaId', async () => {
    await POST(requestWith(HANGUP_REAL));
    // Si no decodificara, el id guardado sería el Base-64 y no el id de tienda.
    expect(mockedLlamadaUpsert.mock.calls[0][0].create.tiendaId).toBe('tienda-1');
  });

  it('no explota si faltan los tiempos', async () => {
    const sinTiempos = structuredClone(HANGUP_REAL) as { data: { occurred_at?: string } };
    delete sinTiempos.data.occurred_at;
    await POST(requestWith(sinTiempos));
    expect(mockedLlamadaUpsert.mock.calls[0][0].create.durationMinutes).toBe(0);
  });

  it('ignora duraciones absurdas en vez de inflar los costos', async () => {
    const raro = structuredClone(HANGUP_REAL) as { data: { occurred_at: string } };
    // 72h: ninguna llamada real dura eso (Telnyx corta a 1800s), así que son
    // datos corruptos y no deben volverse minutos facturables.
    raro.data.occurred_at = '2018-02-05T22:20:27.521992Z';
    await POST(requestWith(raro));
    expect(mockedLlamadaUpsert.mock.calls[0][0].create.durationMinutes).toBe(0);
  });

  it('responde 200 sin guardar si no hay client_state', async () => {
    const sinEstado = structuredClone(HANGUP_REAL) as { data: { payload: { client_state?: string } } };
    delete sinEstado.data.payload.client_state;
    const res = await POST(requestWith(sinEstado));
    expect(res.status).toBe(200);
    expect(mockedLlamadaUpsert).not.toHaveBeenCalled();
  });
});