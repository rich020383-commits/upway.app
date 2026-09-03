import { NextResponse } from 'next/server';
import { PrismaClient, VerticalType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.').max(100),
  email: z.string().trim().toLowerCase().email('Correo electrónico inválido.').max(255),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(72),
  segment: z.string().optional(),
  businessName: z.string().trim().min(1, 'El nombre del negocio es obligatorio.').max(200),
  clinicName: z.string().optional(),
});

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
    const parsed = registerSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Datos inválidos.' },
        { status: 400 }
      );
    }

    const { name, email, password, segment, businessName, clinicName } = parsed.data;

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

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug: `workspace-${newUser.id}`,
          vertical,
          ownerId: newUser.id,
          verticals: [vertical],
        },
      });

      const clinic = await tx.clinic.create({
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
        await tx.healthOnboardingSession.create({
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

      await tx.tienda.create({
        data: {
          id: newUser.id,
          userId: newUser.id,
          nombre: `Workspace de ${newUser.name}`,
        },
      });

      return { newUser, organization, clinic };
    });

    const { newUser, organization, clinic } = result;

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