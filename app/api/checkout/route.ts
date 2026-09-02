import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { resolveAccessFromPromoCode } from '@/lib/billing/access';

// 💰 Precios oficiales definidos en el SERVIDOR (nunca confiar en el precio del cliente)
const PLANES: Record<string, { precio: number; descripcion: string }> = {
  emprendedor: { precio: 149900, descripcion: 'Plan Emprendedor Upway - Bot de WhatsApp (texto y catálogo básico)' },
  negocio: { precio: 299900, descripcion: 'Plan Negocio Upway - IA multimodal, notas de voz, imágenes y RAG de inventario' },
  pro: { precio: 499900, descripcion: 'Plan PRO Upway - Alto volumen y reportes avanzados' },
};

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
      const response = NextResponse.json({
        success: true,
        mode: 'promo',
        accessState: accessCode.state,
        payment_url: null,
        message: `${accessCode.label}: ${accessCode.description}`,
      });

      response.cookies.set('upway_billing_state', accessCode.state, {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });

      return response;
    }

    const apiKey = process.env.BOLD_API_KEY;
    if (!apiKey) {
      const response = NextResponse.json({
        success: true,
        mode: 'demo',
        accessState: 'trial',
        payment_url: null,
        message: 'Bold está suspendido durante pruebas. El acceso queda habilitado en modo demo para validación operativa.',
      });

      response.cookies.set('upway_billing_state', 'trial', {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });

      return response;
    }

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
    const paymentResponse = NextResponse.json({
      success: true,
      mode: 'payment',
      accessState: 'pending_payment',
      payment_url: data.payload?.url ?? null,
      message: 'Pendiente de autorización de pago.',
    });

    paymentResponse.cookies.set('upway_billing_state', 'pending_payment', {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    return paymentResponse;
  } catch (error: unknown) {
    console.error('Error en el endpoint /api/checkout:', error);
    return NextResponse.json({ error: 'Sistemas de pago temporalmente no disponibles.' }, { status: 500 });
  }
}