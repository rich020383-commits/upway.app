import { BillingAccessState, BillingAccessType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const normalizeState = (state?: string | null) => {
  const value = String(state ?? 'trial').trim().toLowerCase();

  switch (value) {
    case 'active':
      return 'ACTIVE';
    case 'pending_payment':
    case 'pending-payment':
      return 'PENDING_PAYMENT';
    case 'paused':
      return 'PAUSED';
    case 'suspended':
      return 'SUSPENDED';
    case 'cancelled':
    case 'canceled':
      return 'CANCELLED';
    default:
      return 'TRIAL';
  }
};

const normalizeType = (type?: string | null) => {
  const value = String(type ?? 'trial').trim().toLowerCase();

  switch (value) {
    case 'invite':
      return 'INVITE';
    case 'gift':
      return 'GIFT';
    default:
      return 'TRIAL';
  }
};

const isAdmin = (sessionUser: { email?: string | null }) => {
  if (!sessionUser.email) return false;
  const email = sessionUser.email.toLowerCase();

  return ADMIN_EMAILS.includes(email) || email === 'revisor_meta@upway.business';
};

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !isAdmin(sessionUser)) {
    return NextResponse.json({ error: 'Acceso no autorizado.' }, { status: 401 });
  }

  const codes = await prisma.billingAccessCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({
    codes: codes.map((code) => ({
      ...code,
      expiresAt: code.expiresAt ? new Date(code.expiresAt).toISOString() : null,
      createdAt: new Date(code.createdAt).toISOString(),
      updatedAt: new Date(code.updatedAt).toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !isAdmin(sessionUser)) {
    return NextResponse.json({ error: 'Acceso no autorizado.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? '').trim().toUpperCase();
  const label = String(body.label ?? '').trim();
  const description = String(body.description ?? '').trim();
  const allowedRole = String(body.allowedRole ?? 'owner').trim();
  const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

  if (!code || !label) {
    return NextResponse.json(
      { error: 'Faltan datos obligatorios: código y nombre visible.' },
      { status: 400 },
    );
  }

  const payload = {
    code,
    label,
    description: description || 'Acceso gestionado desde el panel de administración.',
    state: normalizeState(body.state) as BillingAccessState,
    type: normalizeType(body.type) as BillingAccessType,
    allowedRole: allowedRole || 'owner',
    isActive,
    expiresAt: expiresAt && !isNaN(expiresAt.getTime()) ? expiresAt : null,
    createdByUserId: sessionUser.id,
  };

  const existingCode = await prisma.billingAccessCode.findUnique({
    where: { code },
  });

  const record = existingCode
    ? await prisma.billingAccessCode.update({
        where: { code },
        data: payload,
      })
    : await prisma.billingAccessCode.create({
        data: payload,
      });

  return NextResponse.json({
    success: true,
    record: {
      ...record,
      expiresAt: record.expiresAt ? new Date(record.expiresAt).toISOString() : null,
      createdAt: new Date(record.createdAt).toISOString(),
      updatedAt: new Date(record.updatedAt).toISOString(),
    },
  });
}
