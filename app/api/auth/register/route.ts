import { NextResponse } from 'next/server';
import { PrismaClient, VerticalType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const segmentToVertical: Record<string, VerticalType> = {
  health: 'HEALTH',
  salud: 'HEALTH',
  clinica: 'HEALTH',
  clinicas: 'HEALTH',
  inmobiliaria: 'BUSINESS',
  inmobiliarias: 'BUSINESS',
  retail: 'BUSINESS',
  tienda: 'BUSINESS',
  tiendas: 'BUSINESS',
  supermercado: 'BUSINESS',
  supermercados: 'BUSINESS',
  drogueria: 'BUSINESS',
  droguerias: 'BUSINESS',
  general: 'BUSINESS',
};

function normalizeSegment(rawSegment?: string) {
  if (!rawSegment) return 'BUSINESS';
  const normalized = rawSegment.toLowerCase();
  return segmentToVertical[normalized] ?? 'BUSINESS';
}

export async function POST(req: Request) {
  try {
    const { name, email, password, segment, businessName, clinicName } = await req.json();

    if (!name || !email || !password || !businessName) {
      return NextResponse.json({ error: 'Faltan datos obligatorios: nombre, negocio y contraseña.' }, { status: 400 });
    }

    const vertical = normalizeSegment(segment);
    const organizationName = String(businessName).trim();
    const clinicLabel = String(clinicName || (vertical === 'HEALTH' ? 'Clínica principal' : 'Negocio principal')).trim();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Ya existe una cuenta con este correo.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const organization = await prisma.organization.create({
      data: {
        name: organizationName,
        slug: `workspace-${newUser.id}`,
        vertical,
        ownerId: newUser.id,
        verticals: [vertical],
      },
    });

    const clinic = await prisma.clinic.create({
      data: {
        organizationId: organization.id,
        name: clinicLabel,
        specialty: vertical === 'HEALTH' ? 'Atención médica general' : 'Operación comercial',
        timezone: 'UTC',
        vertical,
        status: 'active',
      },
    });

    if (vertical === 'HEALTH') {
      await prisma.healthOnboardingSession.create({
        data: {
          clinicId: clinic.id,
          vertical,
          currentStep: 'clinic-setup',
          status: 'DRAFT',
          progressPercent: 10,
          notes: 'Onboarding clínico inicial creado al registrar la cuenta.',
        },
      });
    }

    await prisma.tienda.create({
      data: {
        id: newUser.id,
        userId: newUser.id,
        nombre: `Workspace de ${newUser.name}`,
      },
    });

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      vertical,
      organizationId: organization.id,
      clinicId: clinic.id,
    });
  } catch (error) {
    console.error('Register error', error);
    return NextResponse.json({ error: 'No se pudo crear la cuenta en la base de datos.' }, { status: 500 });
  }
}