import { prisma } from '@/lib/prisma';
import type { HealthOnboardingStatus, VerticalOnboardingStatus } from '@prisma/client';

/**
 * Permisos de voz por estado del caso.
 *
 * Antes de este gate, `/api/voice/clones` y `/api/voice/agents` solo pedían
 * sesión: no miraban ni el estado del onboarding ni el pago. Eso dejaba abierta
 * una vía real — un lead en PENDING_REVIEW podía clonar una voz y encender un
 * asistente, con el costo por clon del proveedor y guardando la biometría de
 * una voz, sin haber aprobado nada.
 *
 * La política es deliberada, no un candado por costumbre:
 *
 *   · Navegar el catálogo y REPRODUCIR voces siguen abiertos en revisión. Es el
 *     "jugar con la voz" que el cliente necesita para ver el producto, y no
 *     cuesta una biometría: solo cuota de TTS, y ya hay rate limit por usuario.
 *   · CLONAR, APROVISIONAR y LLAMAR se abren al aprobar el caso. Son
 *     precisamente lo que se está vendiendo y lo que cuesta plata.
 *
 * El gate es de APROBADO, no de ACTIVE a propósito: en el flujo white-glove de
 * Health el equipo aprueba el caso y EN EL MISMO MOMENTO (llamada de
 * validación) seProvisiona la voz; exigir ACTIVE dejaría al cliente sin voz
 * justo en el paso donde se la estás configuring.
 */
export type VoiceAccess = {
  /** Ver el catálogo de voces. */
  canBrowse: boolean;
  /** Reproducir una muestra de audio de una voz del catálogo. */
  canPreview: boolean;
  /** Crear una voz propia (desde muestra o por diseño). */
  canClone: boolean;
  /** Crear/actualizar el asistente y asignarle número. */
  canProvision: boolean;
  /** Hacer una llamada de prueba real. */
  canCall: boolean;
};

/** Lo que se puede hacer con el caso todavía en revisión. */
const REVIEW: VoiceAccess = {
  canBrowse: true,
  canPreview: true,
  canClone: false,
  canProvision: false,
  canCall: false,
};

/** Lo que se puede hacer con el caso aprobado. */
const APPROVED: VoiceAccess = {
  canBrowse: true,
  canPreview: true,
  canClone: true,
  canProvision: true,
  canCall: true,
};

const HEALTH_APPROVED: HealthOnboardingStatus[] = ['APPROVED', 'ACTIVE'];
const VERTICAL_APPROVED: VerticalOnboardingStatus[] = ['APPROVED', 'ACTIVE'];

/** Qué operación se está intentando, para el mensaje y el registro. */
export type VoiceCapability = 'clone' | 'provision' | 'call';

const CAPABILITY_LABEL: Record<VoiceCapability, string> = {
  clone: 'crear tu propia voz',
  provision: 'encender el asistente',
  call: 'hacer una llamada de prueba',
};

/** Une la operación pedida con su permiso: son dos vocabularios distintos. */
const CAPABILITY_ACCESS: Record<VoiceCapability, keyof VoiceAccess> = {
  clone: 'canClone',
  provision: 'canProvision',
  call: 'canCall',
};

export const NO_CASE_MESSAGE =
  'Tu operación todavía no tiene un caso aprobado. Puedes escuchar las voces del catálogo, pero la activación se abre cuando Upway apruebe tu plan.';

export const PENDING_CASE_MESSAGE =
  'Tu caso está en revisión del equipo de Upway. Puedes escuchar las voces del catálogo; el resto se abre al aprobar tu plan.';

export type VoiceAccessResult = {
  access: VoiceAccess;
  /** 'approved' | 'review' | 'none': por qué se concede o se quita el permiso. */
  state: 'approved' | 'review' | 'none';
  /** Vertical (center/inmobiliaria) o Health, si se pudo determinar. */
  segment: string | null;
};

/**
 * Resuelve el estado de voz de un usuario leyendo los DOS embudos, porque un
 * mismo cliente puede haber pasado por cualquiera de los dos: el caso de Health
 * vive en HealthOnboardingSession y el de Center/Inmobiliaria en
 * VerticalOnboardingSession. Basta con que uno de los dos esté aprobado.
 *
 * Ante un fallo de base de datos NO se abre el candado: se degrada a `review`,
 * que es el estado por defecto de todos modos.
 */
export async function resolveVoiceAccess(userId: string): Promise<VoiceAccessResult> {
  try {
    const tienda = await prisma.tienda.findFirst({
      where: { userId },
      select: { clinicId: true },
    });

    const healthWhere = {
      status: { in: HEALTH_APPROVED },
      OR: [
        { ownerUserId: userId },
        ...(tienda?.clinicId ? [{ clinicId: tienda.clinicId }] : []),
      ],
    };

    const [health, vertical] = await Promise.all([
      prisma.healthOnboardingSession.findFirst({ where: healthWhere, select: { id: true } }),
      prisma.verticalOnboardingSession.findFirst({
        where: { userId, status: { in: VERTICAL_APPROVED } },
        select: { segment: true },
      }),
    ]);

    if (health) return { access: APPROVED, state: 'approved', segment: null };
    if (vertical) return { access: APPROVED, state: 'approved', segment: vertical.segment };

    // Sin caso aprobado: se mira si al menos hay uno en revisión, para poder
    // distinguir "todavía no empezaste" de "ya lo enviaste y lo estamos viendo".
    const pendiente = await prisma.verticalOnboardingSession.findFirst({
      where: { userId },
      select: { segment: true },
    });
    const pendienteHealth = await prisma.healthOnboardingSession.findFirst({
      where: { OR: [{ ownerUserId: userId }, ...(tienda?.clinicId ? [{ clinicId: tienda.clinicId }] : [])] },
      select: { id: true },
    });

    if (pendiente || pendienteHealth) {
      return { access: REVIEW, state: 'review', segment: pendiente?.segment ?? null };
    }
    return { access: REVIEW, state: 'none', segment: null };
  } catch (error) {
    console.error('[voice-access] no se pudo resolver el estado; se degrada a revisión', error);
    return { access: REVIEW, state: 'review', segment: null };
  }
}

/**
 * Gate para usar en las rutas. Devuelve el 403 con un mensaje honesto y accionable
 * en vez de un error genérico, o `null` si la operación está permitida.
 */
export async function voiceCapabilityDenied(
  userId: string,
  capability: VoiceCapability
): Promise<{ error: string; status: 403 } | null> {
  const { access, state } = await resolveVoiceAccess(userId);
  if (access[CAPABILITY_ACCESS[capability]]) return null;
  return {
    error: `${state === 'none' ? NO_CASE_MESSAGE : PENDING_CASE_MESSAGE} (No se puede ${CAPABILITY_LABEL[capability]}.`,
    status: 403,
  };
}
