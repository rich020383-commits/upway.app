import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: Request) {
  // Placeholder for logout logic.
  // Si tu app usa NextAuth u otro mecanismo, aquí puedes limpiar cookies o destruir la sesión.
  return NextResponse.json({ ok: true });
}
