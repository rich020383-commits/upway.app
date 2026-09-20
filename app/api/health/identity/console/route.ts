import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getHealthSession } from '@/lib/session';
import { enforceHealthAccess } from '@/lib/health/access';
import { withTenantScope } from '@/lib/health/tenant';
import { verifyIdentityRecordHash } from '@/lib/health/identity/persistence';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Consola de certificacion de identidad conforme (/health/identity).
 * - Guard: sesion + permisos health (modulo `production`) + tenant scope.
 * - GET: KPIs del SLA + ultimas identidades certificadas con evidencia.
 *
 * Esta consola es la evidencia del modulo Identidad Conforme:
 *   % conforme, % confirmado por el paciente, entregas al HIS, e integridad
 *   del registro (hash sha256 recalculado contra la fila almacenada).
 */

type PatientIdentityRow = {
  id: string;
  documentType: string;
  documentNumber: string;
  givenNames: string[];
  familyNames: string[];
  birthDate: Date;
  sexCode: string;
  municipalityCode: string;
  departmentCode: string;
  phoneE164: string | null;
  email: string | null;
  conforming: boolean;
  completenessPct: number;
  issuesJson: unknown;
  recordHash: string;
  confirmedAt: Date | null;
  retentionMode: string;
  createdAt: Date;
  clinicId: string | null;
  confirmations: { id: string; method: string; confirmedAt: Date; channel: string }[];
  handoffs: { id: string; targetSystem: string; status: string; deliveredAt: Date | null }[];
};

export async function GET(request: NextRequest) {
  const { context, error } = await getHealthSession(request);
  if (error) return error;

  const { role, organizationId, clinicId } = context;

  try {
    enforceHealthAccess({ role, module: 'production', organizationId, clinicId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Access denied' },
      { status: 403 }
    );
  }

  const where = clinicId ? { organizationId, clinicId } : { organizationId };

  try {
    const rows = (await prisma.patientIdentity.findMany({
      where,
      include: {
        confirmations: { orderBy: { confirmedAt: 'desc' }, take: 1 },
        handoffs: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })) as unknown as PatientIdentityRow[];

    // Integridad: se recalcula el hash de cada fila contra lo almacenado.
    // Un false aqui significa que el registro fue alterado fuera del flujo conforme.
    const withIntegrity = rows.map((row) => ({
      id: row.id,
      documentType: row.documentType,
      documentNumber: row.documentNumber,
      fullName: [...row.givenNames, ...row.familyNames].join(' '),
      birthDate: row.birthDate.toISOString().slice(0, 10),
      sexCode: row.sexCode,
      municipalityCode: row.municipalityCode,
      departmentCode: row.departmentCode,
      phoneE164: row.phoneE164,
      conforming: row.conforming,
      completenessPct: row.completenessPct,
      confirmedAt: row.confirmedAt?.toISOString() ?? null,
      lastConfirmation: row.confirmations[0]
        ? { method: row.confirmations[0].method, confirmedAt: row.confirmations[0].confirmedAt.toISOString() }
        : null,
      handoff: row.handoffs[0]
        ? { targetSystem: row.handoffs[0].targetSystem, status: row.handoffs[0].status }
        : null,
      integrityOk: verifyIdentityRecordHash(
        {
          documentType: row.documentType,
          documentNumber: row.documentNumber,
          givenNames: row.givenNames,
          familyNames: row.familyNames,
          birthDate: row.birthDate,
          sexCode: row.sexCode,
          municipalityCode: row.municipalityCode,
          departmentCode: row.departmentCode,
          phoneE164: row.phoneE164,
          email: row.email,
        },
        row.recordHash
      ),
      createdAt: row.createdAt.toISOString(),
    }));

    const total = withIntegrity.length;
    const conforming = withIntegrity.filter((r) => r.conforming).length;
    const confirmed = withIntegrity.filter((r) => r.confirmedAt).length;
    const tampered = withIntegrity.filter((r) => !r.integrityOk).length;
    const delivered = withIntegrity.filter((r) => r.handoff?.status === 'DELIVERED').length;
    const avgCompleteness =
      total > 0 ? Math.round(withIntegrity.reduce((acc, r) => acc + r.completenessPct, 0) / total) : 0;

    const payload = {
      ok: true,
      kpis: {
        total,
        conformingPct: total > 0 ? Math.round((conforming / total) * 100) : 0,
        confirmedPct: total > 0 ? Math.round((confirmed / total) * 100) : 0,
        delivered,
        tampered,
        avgCompletenessPct: avgCompleteness,
      },
      records: withIntegrity.slice(0, 50),
    };

    return NextResponse.json(
      withTenantScope(payload, { organizationId, clinicId })
    );
  } catch (err) {
    console.error('Error cargando consola de identidad:', err);
    return NextResponse.json(
      { error: 'No se pudo cargar la consola de certificacion' },
      { status: 500 }
    );
  }
}
