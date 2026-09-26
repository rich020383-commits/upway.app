import { prisma } from '@/lib/prisma';
import type { HealthOnboardingStatus, VerticalOnboardingStatus } from '@prisma/client';

/**
 * Estado del caso de onboarding de un cliente, sea cual sea la vertical.
 *
 * Un mismo cliente puede haber pasado por Health o por Center/Inmobiliaria, así
 * que se consultan LOS DOS embudos y basta con que uno esté aprobado. Este es el
 * único lugar donde se decide eso: el gate de voz (lib/voice-access.ts) y el
 * panel de operaciones consumen esta misma respuesta, para que no puedan
 * discrepar sobre si un caso está aprobado.
 *
 * `APPROVED` cuenta como aprobado a propósito. En el flujo white-glove el
 * equipo aprueba el caso y, en esa misma llamada de validación, configura la voz
 * y el número: exigir `ACTIVE` dejaría al cliente sin producto justo en el paso
 * donde se lo estás poniendo en marcha.
 *
 * Ante un fallo de base de datos NO se concede el beneficio: se degrada a
 * `review`, que es el estado restrictivo de todos modos.
 */
export type CaseState = 'approved' | 'review' | 'none';

export type CaseAccess = {
  state: CaseState;
  /** Segmento vertical si el caso viene del wizard de Center/Inmobiliaria. */
  segment: string | null;
};

const HEALTH_APPROVED: HealthOnboardingStatus[] = ['APPROVED', 'ACTIVE'];
const VERTICAL_APPROVED: VerticalOnboardingStatus[] = ['APPROVED', 'ACTIVE'];

export async function resolveCaseState(userId: string): Promise<CaseAccess> {
  try {
    const tienda = await prisma.tienda.findFirst({
      where: { userId },
      select: { clinicId: true },
    });
    const clinica = tienda?.clinicId ? [{ clinicId: tienda.clinicId }] : [];

    const [health, vertical] = await Promise.all([
      prisma.healthOnboardingSession.findFirst({
        where: { status: { in: HEALTH_APPROVED }, OR: [{ ownerUserId: userId }, ...clinica] },
        select: { id: true },
      }),
      prisma.verticalOnboardingSession.findFirst({
        where: { userId, status: { in: VERTICAL_APPROVED } },
        select: { segment: true },
      }),
    ]);

    if (health) return { state: 'approved', segment: null };
    if (vertical) return { state: 'approved', segment: vertical.segment };

    // Sin caso aprobado: se mira si al menos hay uno, para poder distinguir
    // "todavía no empezó" de "ya lo envió y lo estamos revisando".
    const [pendiente, pendienteHealth] = await Promise.all([
      prisma.verticalOnboardingSession.findFirst({ where: { userId }, select: { segment: true } }),
      prisma.healthOnboardingSession.findFirst({
        where: { OR: [{ ownerUserId: userId }, ...clinica] },
        select: { id: true },
      }),
    ]);

    if (pendiente || pendienteHealth) {
      return { state: 'review', segment: pendiente?.segment ?? null };
    }
    return { state: 'none', segment: null };
  } catch (error) {
    console.error('[case-access] no se pudo resolver el estado; se degrada a revisión', error);
    return { state: 'review', segment: null };
  }
}
