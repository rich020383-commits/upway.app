import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tiendaId = searchParams.get('tiendaId');

  // Si no sabemos qué tienda quiere conectar el calendario, bloqueamos el proceso.
  if (!tiendaId) {
    return NextResponse.json({ error: "Falta el ID de la tienda" }, { status: 400 });
  }

  // Detectamos si estamos en local o en producción
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${appUrl}/api/integraciones/google/callback` // <--- Hacia dónde volverá Google
  );

  // Pedimos permiso ÚNICAMENTE para manejar eventos del calendario (Principio de mínimo privilegio)
  const scopes = ['https://www.googleapis.com/auth/calendar.events'];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Fundamental para que nos dé el refresh_token
    prompt: 'consent',      // Obliga a que siempre aparezca la pantalla de permisos
    scope: scopes,
    state: tiendaId,        // 💡 El truco maestro: Le mandamos el ID de la tienda a Google para que nos lo devuelva luego
  });

  // Redirigimos al cliente a la pantalla de Google
  return NextResponse.redirect(authUrl);
}