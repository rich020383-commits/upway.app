/**
 * Formulario del onboarding guardado como JSON en `HealthOnboardingSession.notes`.
 *
 * Vive aqui (y no adentro de `app/api/health/activate`) porque la resolucion de
 * capacidad por tenant tambien necesita leer `planId` desde ahi:
 * ver `lib/voice/concurrency.ts`. Es JSON opaco: lo unico que garantiza es
 * devolver un objeto, nunca lanzar.
 */
export function parseSessionForm(notes: string | null | undefined): Record<string, unknown> {
  if (!notes) return {};
  try {
    const parsed = JSON.parse(notes);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
