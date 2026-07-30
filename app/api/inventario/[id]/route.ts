import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ inventario: [] });
}

export async function POST() {
  return NextResponse.json({ ok: true });
}

export async function PUT() {
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  return NextResponse.json({ ok: true });
}
