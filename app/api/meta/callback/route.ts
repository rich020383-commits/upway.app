import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOwnedTienda } from '@/lib/session';

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

  // 🧹 REGRESO A V20.0 (VERSIÓN ESTABLE)
  const tokenUrl = new URL('https://graph.facebook.com/v20.0/oauth/access_token');
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      metaCode,
      metaPhoneNumberId = 'ID_DEL_NUMERO',
      metaWabaId = 'ID_DEL_WABA',
      tienda_id: tiendaIdFromBody,
    } = body;

    // 🛡️ La sesión decide la tienda destino; nunca confiamos en tokens del cliente
    const { tienda, error } = await getOwnedTienda(req, prisma, tiendaIdFromBody);
    if (error) return error;

    const redirect = process.env.NEXT_PUBLIC_APP_URL || 'https://upway.business';

    if (!metaCode) {
      return NextResponse.json(
        { error: 'Falta el código de autorización de Meta.' },
        { status: 400 }
      );
    }

    console.log(`Procesando callback de Meta...`);

    const accessToken = await exchangeCodeForToken(metaCode, redirect);

    if (metaPhoneNumberId && metaPhoneNumberId !== 'ID_DEL_NUMERO') {
      try {
        const pinDeRegistro = '123456';

        const registroMeta = await fetch(`https://graph.facebook.com/v20.0/${metaPhoneNumberId}/register`, {
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

    // 🔥 Buscamos la tienda del usuario autenticado (ya resuelta con ownership)
    const tiendaIdReal = tienda.id;

    // 🧹 LIMPIO: Actualizamos la tienda del dueño autenticado
    await prisma.tienda.update({
      where: { id: tiendaIdReal },
      data: {
        metaPhoneNumberId,
        metaWabaId,
        metaAccessToken: accessToken,
        isWhatsAppActive: true, // 🔥 ESTO ENCIENDE EL VERDE EN TU DASHBOARD
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Línea de WhatsApp activada y conectada exitosamente',
      tiendaId: tiendaIdReal,
    });
  } catch (error) {
    console.error('Error crítico guardando credenciales de Meta:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fallo interno del servidor al procesar el callback' },
      { status: 500 }
    );
  }
}