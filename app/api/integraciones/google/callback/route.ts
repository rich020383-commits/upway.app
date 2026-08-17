import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Google nos devuelve el "code" (el token temporal) y el "state" (que era nuestro tiendaId)
  const code = searchParams.get('code');
  const tiendaId = searchParams.get('state');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!code || !tiendaId) {
    return NextResponse.redirect(new URL('/dashboard?calendar=error', request.url));
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${appUrl}/api/integraciones/google/callback`
  );

  try {
    // 1. Intercambiamos el código temporal por los tokens reales
    const { tokens } = await oauth2Client.getToken(code);
    
    // 2. Si Google nos dio el refresh_token, lo guardamos en Neon
    if (tokens.refresh_token) {
      await prisma.tienda.update({
        where: { id: tiendaId },
        data: { googleRefreshToken: tokens.refresh_token }
      });
      console.log(`✅ [Upway] Calendario conectado con éxito para la tienda: ${tiendaId}`);
    }

    // 3. Devolvemos al cliente a su panel de control con un mensaje de éxito
    return NextResponse.redirect(new URL('/dashboard?calendar=success', request.url));

  } catch (error) {
    console.error("❌ [Upway] Error al obtener el token de Google:", error);
    return NextResponse.redirect(new URL('/dashboard?calendar=error', request.url));
  }
}