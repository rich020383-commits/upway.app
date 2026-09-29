import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: { llamadaLog: { aggregate: vi.fn() } },
}));
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn(async () => ({ ok: true })) }));

const { evaluarGastoVoz, avisarGastoVoz, gastoVozDelMes } = await import('./spend-guard');
const { sendEmail } = await import('@/lib/email');

const agregacion = (valor: number) =>
  (prisma.llamadaLog.aggregate as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    _sum: { telnyxCost: valor },
  });

describe('freno de gasto de voz', () => {
  beforeEach(() => vi.clearAllMocks());

  it('suma el costo real del mes en curso', async () => {
    agregacion(12.5);
    expect(await gastoVozDelMes({ tiendaId: 't1' })).toBe(12.5);
  });

  it('deja pasar el consumo normal', async () => {
    // tenant 120, plataforma 300
    (prisma.llamadaLog.aggregate as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ _sum: { telnyxCost: 120 } })
      .mockResolvedValueOnce({ _sum: { telnyxCost: 300 } });
    const r = await evaluarGastoVoz('t1');
    expect(r.state).toBe('ok');
    expect(r.motivo).toBeNull();
  });

  it('avisa sin bloquear cuando el tenant pasa el umbral', async () => {
    (prisma.llamadaLog.aggregate as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ _sum: { telnyxCost: 700 } })
      .mockResolvedValueOnce({ _sum: { telnyxCost: 700 } });
    const r = await evaluarGastoVoz('t1');
    expect(r.state).toBe('advierte');
    expect(r.motivo).toBeNull();
  });

  it('bloquea cuando el tenant cruza el tope de su parte', async () => {
    (prisma.llamadaLog.aggregate as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ _sum: { telnyxCost: 2500 } })
      .mockResolvedValueOnce({ _sum: { telnyxCost: 2500 } });
    const r = await evaluarGastoVoz('t1');
    expect(r.state).toBe('bloquea');
    expect(r.motivo).toMatch(/tope de USD/);
  });

  it('bloquea tambien si el gasto se dispara en toda la plataforma', async () => {
    // Ningun tenant individual pasa, pero la suma global si.
    (prisma.llamadaLog.aggregate as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ _sum: { telnyxCost: 100 } })
      .mockResolvedValueOnce({ _sum: { telnyxCost: 7000 } });
    const r = await evaluarGastoVoz('t1');
    expect(r.state).toBe('bloquea');
    expect(r.motivo).toMatch(/tope global/);
  });

  it('el aviso no se lanza si SMTP falla', async () => {
    (sendEmail as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('smtp'));
    const r = { state: 'advierte', spentUSD: 700, warnUSD: 500, blockUSD: 2000, totalUSD: 700, motivo: null } as const;
    await expect(avisarGastoVoz(r, 'Clínica Norte', 'a@b.co')).resolves.toBeUndefined();
  });

  it('no manda correo cuando todo esta normal', async () => {
    const r = { state: 'ok', spentUSD: 10, warnUSD: 500, blockUSD: 2000, totalUSD: 10, motivo: null } as const;
    await avisarGastoVoz(r, 'Clínica Norte', 'a@b.co');
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
