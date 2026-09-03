import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { resolveAccessFromPromoCode } from '@/lib/billing/access';

// 💰 Precios oficiales definidos en el SERVIDOR (nunca confiar en el precio del cliente)
const PLANES: Record<string, { precio: number; descripcion: string }> = {
  emprendedor: { precio: 149900, descripcion: 'Plan Emprendedor Upway - Bot de WhatsApp (texto y catálogo básico)' },
  negocio: { precio: 299900, descripcion: 'Plan Negocio Upway - IA multimodal, notas de voz, imágenes y RAG de inventario' },
  pro: { precio: 499900, descripcion: 'Plan PRO Upway - Alto volumen y reportes avanzados' },
};

const BILLING_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/** Construye la respuesta de facturación con la cookie upway_billing_state ya configurada. */
function buildBillingResponse(
  accessState: string,
  body: { mode: string; message: string; payment_url?: string | null }
): NextResponse {
  const response = NextResponse.json({
    success: true,
    accessState,
    payment_url: body.payment_url ?? null,
    mode: body.mode,
    message: body.message,
  });

  response.cookies.set('upway_billing_state', accessState, {
    path: '/',
    sameSite: 'lax',
    maxAge: BILLING_COOKIE_MAX_AGE,
  });

  return response;
}

/** Crea el link de pago en Bold para el plan indicado. Lanza si la API falla. */
async function createBoldPaymentLink(planInfo: { precio: number; descripcion: string }): Promise<string | null> {
  const apiKey = process.env.BOLD_API_KEY;
  if (!apiKey) throw new Error('Falta BOLD_API_KEY');

  const payload = {
    amount_type: 'CLOSE',
    amount: {
      currency: 'COP',
      total_amount: planInfo.precio,
    },
    description: planInfo.descripcion,
  };

  const response = await fetch('https://integrations.api.bold.co/online/link/v1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `x-api-key ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Error de Bold:', errorData);
    throw new Error('Fallo al crear el link de pago con Bold');
  }

  const data = await response.json();
  return data.payload?.url ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: 'No hay sesión activa.' }, { status: 401 });
    }

    const { plan, promoCode } = await req.json();

    const planInfo = PLANES[String(plan || '').toLowerCase()];
    if (!planInfo) {
      return NextResponse.json({ error: 'Plan no válido.' }, { status: 400 });
    }

    const accessCode = await resolveAccessFromPromoCode(promoCode);
    if (accessCode.valid) {
      return buildBillingResponse(accessCode.state, {
        mode: 'promo',
        message: `${accessCode.label}: ${accessCode.description}`,
      });
    }

    if (!process.env.BOLD_API_KEY) {
      return buildBillingResponse('trial', {
        mode: 'demo',
        message: 'Bold está suspendido durante pruebas. El acceso queda habilitado en modo demo para validación operativa.',
      });
    }

    const paymentUrl = await createBoldPaymentLink(planInfo);

    return buildBillingResponse('pending_payment', {
      mode: 'payment',
      payment_url: paymentUrl,
      message: 'Pendiente de autorización de pago.',
    });
  } catch (error: unknown) {
    console.error('Error en el endpoint /api/checkout:', error);
    return NextResponse.json({ error: 'Sistemas de pago temporalmente no disponibles.' }, { status: 500 });
  }
}