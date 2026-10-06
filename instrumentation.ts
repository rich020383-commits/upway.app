/**
 * Punto de entrada que Next.js ejecuta una vez al iniciar cada instancia del
 * servidor (doc: node_modules/next/dist/docs/.../instrumentation.md).
 *
 * Aquí solo se arma el scheduler interno del drenaje de entregas push de
 * identidad conforme (cada 5 min en producción). Los gates (Node runtime,
 * fuera de `next build`, solo `NODE_ENV=production`) viven en
 * `resolveHandoffSchedulerMode` para poder testearlos sin arrancar timers.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { startHandoffScheduler } = await import('./lib/health/identity/handoff-scheduler');
  startHandoffScheduler();
}
