import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type MetaTokenExchangeResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    fbtrace_id?: string;
  };
};

async function exchangeCodeForToken(code: string, redirectUri: string) {
  const appId = process.env.META_APP_ID || process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('Faltan las variables META_APP_ID o META_APP_SECRET para intercambiar el código de Meta.');
  }

  // 🚀 ACTUALIZADO: Subimos a la v26.0 para alinear con el Webhook híbrido
  const tokenUrl = new URL('https://graph.facebook.com/v26.0/oauth/access_token');
  tokenUrl.searchParams.set('client_id', appId);
  tokenUrl.searchParams.set('client_secret', appSecret);
  tokenUrl.searchParams.set('code', code);
  tokenUrl.searchParams.set('redirect_uri', redirectUri);

  const response = await fetch(tokenUrl.toString(), { method: 'GET' });
  const data = (await response.json()) as MetaTokenExchangeResponse;

  if (!response.ok || !data.access_token) {
    const errorMessage = data.error?.message || 'No se pudo intercambiar el código de autorización de Meta.';
    throw new Error(errorMessage);
  }

  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      metaAccessToken,
      metaCode,
      metaPhoneNumberId = 'ID_DEL_NUMERO',
      metaWabaId = 'ID_DEL_WABA',
      metaUsername, // 🚀 NUEVO: Recibimos el nombre de usuario (BSUID) desde el frontend
      redirectUri,
      tienda_id: tiendaIdFromBody,
    } = body;

    const code = metaCode || metaAccessToken;
    const redirect = redirectUri || process.env.NEXT_PUBLIC_APP_URL || 'https://upway.business';
    const tiendaId = tiendaIdFromBody || 'tienda_revisor_001';

    if (!code) {
      return NextResponse.json(
        { error: 'Falta el código o token de acceso de Meta.' },
        { status: 400 }
      );
    }

    console.log(`Procesando callback de Meta para la tienda: ${tiendaId}`);

    let accessToken = code;

    if (metaAccessToken && metaAccessToken.startsWith('EA')) {
      accessToken = metaAccessToken;
    } else {
      accessToken = await exchangeCodeForToken(code, redirect);
    }

    if (metaPhoneNumberId && metaPhoneNumberId !== 'ID_DEL_NUMERO') {
      try {
        const pinDeRegistro = '123456';

        // 🚀 ACTUALIZADO: Subimos a la v26.0 para el registro oficial de la línea
        const registroMeta = await fetch(`https://graph.facebook.com/v26.0/${metaPhoneNumberId}/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            pin: pinDeRegistro,
          }),
        });

        if (!registroMeta.ok) {
          const errorMeta = await registroMeta.json().catch(() => null);
          console.warn('⚠️ Aviso de Meta (no crítico):', errorMeta);
        } else {
          console.log('✅ Línea de WhatsApp registrada oficialmente en Meta.');
        }
      } catch (error) {
        console.error('Error menor al intentar registrar la línea en Graph API:', error);
      }
    }

    const tienda = await prisma.tienda.findUnique({ where: { id: tiendaId } });
    if (!tienda) {
      return NextResponse.json(
        { error: `No existe la tienda ${tiendaId} en la base de datos.` },
        { status: 404 }
      );
    }

    // 🚀 ACTUALIZADO: Inyectamos el metaUsername en Prisma
    await prisma.tienda.update({
      where: { id: tiendaId },
      data: {
        metaPhoneNumberId,
        metaWabaId,
        metaAccessToken: accessToken,
        ...(metaUsername && { metaUsername }), // Solo se actualiza si el frontend lo envió
        isWhatsAppActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Línea de WhatsApp activada y conectada exitosamente',
      tiendaId,
    });
  } catch (error) {
    console.error('Error crítico guardando credenciales de Meta:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fallo interno del servidor al procesar el callback' },
      { status: 500 }
    );
  }
}