import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ inventario: [] });
}

export async function POST() {
  return NextResponse.json({ ok: true });
}
