import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDrain } = vi.hoisted(() => ({ mockDrain: vi.fn() }));

vi.mock('@/lib/health/identity/handoff-drain', () => ({ runHandoffDrain: mockDrain }));

type Scheduler = typeof import('./handoff-scheduler');

// El scheduler escribe al log al armar; silenciamos para no ensuciar la salida.
vi.spyOn(console, 'log').mockImplementation(() => {});

describe('resolveHandoffSchedulerMode', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  async function mode(env: Parameters<Scheduler['resolveHandoffSchedulerMode']>[0]) {
    const mod: Scheduler = await import('./handoff-scheduler');
    return mod.resolveHandoffSchedulerMode(env);
  }

  it('arma solo en producción (no en dev ni en test)', async () => {
    expect(await mode({ NODE_ENV: 'development' })).toBe('off');
    expect(await mode({ NODE_ENV: 'test' })).toBe('off');
    expect(await mode({ NODE_ENV: undefined })).toBe('off');
    expect(await mode({ NODE_ENV: 'production' })).toBe('on');
  });

  it('no arma durante `next build` (workers de página)', async () => {
    expect(
      await mode({ NODE_ENV: 'production', NEXT_PHASE: 'phase-production-build' }),
    ).toBe('off');
  });

  it('no arma en runtime edge (Prisma es de Node)', async () => {
    expect(await mode({ NODE_ENV: 'production', NEXT_RUNTIME: 'edge' })).toBe('off');
  });
});

describe('startHandoffScheduler', () => {
  beforeEach(() => {
    vi.resetModules();
    mockDrain.mockReset();
    mockDrain.mockResolvedValue({ scanned: 0, delivered: 0, retried: 0, failed: 0 });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function load(): Promise<Scheduler> {
    return await import('./handoff-scheduler');
  }

  it('devuelve false en entornos no-productivos y nunca llama al drenaje', async () => {
    const s = await load();
    expect(s.startHandoffScheduler({ NODE_ENV: 'test' })).toBe(false);
    await vi.advanceTimersByTimeAsync(
      s.HANDOFF_SCHEDULER_INITIAL_DELAY_MS + 2 * s.HANDOFF_SCHEDULER_INTERVAL_MS,
    );
    expect(mockDrain).not.toHaveBeenCalled();
  });

  it('arma una vez: primera corrida a los 60s y después cada 5 min; segunda llamada no duplica', async () => {
    const s = await load();
    expect(s.startHandoffScheduler({ NODE_ENV: 'production' })).toBe(true);
    expect(s.startHandoffScheduler({ NODE_ENV: 'production' })).toBe(true); // idempotente
    expect(mockDrain).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(s.HANDOFF_SCHEDULER_INITIAL_DELAY_MS);
    expect(mockDrain).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(s.HANDOFF_SCHEDULER_INTERVAL_MS);
    expect(mockDrain).toHaveBeenCalledTimes(2);
  });

  it('guardia de solape: una corrida larga no acumula pilas', async () => {
    const s = await load();
    let liberar!: () => void;
    mockDrain.mockImplementationOnce(
      () => new Promise<void>((resolver) => { liberar = resolver; }),
    );
    s.startHandoffScheduler({ NODE_ENV: 'production' });

    await vi.advanceTimersByTimeAsync(s.HANDOFF_SCHEDULER_INITIAL_DELAY_MS);
    expect(mockDrain).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(s.HANDOFF_SCHEDULER_INTERVAL_MS); // sigue pendiente
    expect(mockDrain).toHaveBeenCalledTimes(1);

    liberar();
    await vi.advanceTimersByTimeAsync(s.HANDOFF_SCHEDULER_INTERVAL_MS);
    expect(mockDrain).toHaveBeenCalledTimes(2);
  });

  it('un error del drenaje no mata el timer', async () => {
    const s = await load();
    mockDrain.mockRejectedValueOnce(new Error('db caida'));
    const spyError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      s.startHandoffScheduler({ NODE_ENV: 'production' });
      await vi.advanceTimersByTimeAsync(s.HANDOFF_SCHEDULER_INITIAL_DELAY_MS);
      expect(spyError).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(s.HANDOFF_SCHEDULER_INTERVAL_MS);
      expect(mockDrain).toHaveBeenCalledTimes(2);
    } finally {
      spyError.mockRestore();
    }
  });
});
