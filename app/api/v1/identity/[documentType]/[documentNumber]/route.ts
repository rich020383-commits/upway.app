import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bearerFromHeader, hashApiKey, looksLikeApiKey } from '@/lib/health/identity/apiKeys';
import { isValidDocumentTypeCode, normalizeDocumentNumber } from '@/lib/health/identity/catalogs';
import { isoDateOnlyFromUtc, verifyIdentityRecordHash } from '@/lib/health/identity/persistence';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * GET /api/v1/identity/{documentType}/{documentNumber}
 *
 * Lectura maquina-a-maquina del registro conforme (Patron 1 de
 * REPORTES/NOTA-INTEGRACION-SALUD-2026-09.md). El HIS/HCE del cliente consulta
 * por la clave de match del MPI: documentType + documentNumber.
 *
 * Auth: `Authorization: Bearer upw_live_...` (servidor-a-servidor).
 * Alcance: la llave pertenece a UNA organizacion; nunca se cruza a otra.
 *
 * No crea ni modifica nada: si el HIS debe crear o actualizar su paciente, lo
 * decide el HIS. Upway solo entrega el dato certificado.
 *
 * Respuesta:
 *   200 { conforming, identity, report, evidenceRef }
 *   401 llave ausente, invalida o revocada
 *   400 tipo de documento fuera de catalogo o numero invalido
 *   404 no hay registro certificado para esa clave de match
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentType: string; documentNumber: string }> }
) {
  const { documentType, documentNumber } = await params;

  const providedKey = bearerFromHeader(request.headers.get('authorization'));
  if (!looksLikeApiKey(providedKey)) {
    return NextResponse.json(
      { error: 'Llave de API requerida (Authorization: Bearer upw_live_...).' },
      { status: 401 }
    );
  }

  const apiClient = (prisma as any).apiClient;
  const client = await apiClient.findUnique({
    where: { keyHash: hashApiKey(providedKey as string) },
    select: { id: true, organizationId: true, name: true, isActive: true, revokedAt: true },
  });

  if (!client || !client.isActive || client.revokedAt) {
    return NextResponse.json({ error: 'Llave de API invalida o revocada.' }, { status: 401 });
  }

  // El tipo de documento es catalogo cerrado: mismo contrato que la captura.
  if (!isValidDocumentTypeCode(documentType)) {
    return NextResponse.json(
      { error: 'Tipo de documento fuera del catalogo (Res. 866 de 2021).' },
      { status: 400 }
    );
  }

  const normalizedNumber = normalizeDocumentNumber(documentNumber);
  if (!normalizedNumber) {
    return NextResponse.json({ error: 'Numero de documento invalido.' }, { status: 400 });
  }

  const identity = await prisma.patientIdentity.findUnique({
    where: {
      organizationId_documentType_documentNumber: {
        organizationId: client.organizationId,
        documentType,
        documentNumber: normalizedNumber,
      },
    },
  });

  // Marca de uso (best-effort): soporte y deteccion de llaves muertas.
  // No debe bloquear la respuesta.
  apiClient
    .update({ where: { id: client.id }, data: { lastUsedAt: new Date() } })
    .catch(() => null);

  if (!identity) {
    return NextResponse.json(
      { conforming: false, identity: null, report: null, evidenceRef: null },
      { status: 404 }
    );
  }

  // Prueba de integridad: el hash se recalcula desde la fila almacenada. Si no
  // coincide, el registro fue alterado fuera del flujo de captura conforme y no
  // se entrega como conforme.
  const integrityVerified = verifyIdentityRecordHash(
    {
      documentType: identity.documentType,
      documentNumber: identity.documentNumber,
      givenNames: identity.givenNames,
      familyNames: identity.familyNames,
      birthDate: identity.birthDate,
      sexCode: identity.sexCode,
      municipalityCode: identity.municipalityCode,
      departmentCode: identity.departmentCode,
      phoneE164: identity.phoneE164,
      email: identity.email,
    },
    identity.recordHash
  );

  // Registro de entrega (best-effort): cada lectura exitosa del HIS deja
  // evidencia en IdentityHandoff para el tablero de conformidad. La clave de
  // idempotencia evita duplicar la fila si el HIS reintenta. No bloquea la
  // respuesta: la entrega es evidencia, no prerrequisito.
  prisma.identityHandoff
    .upsert({
      where: { idempotencyKey: `v1:${client.id}:${identity.id}` },
      create: {
        identityId: identity.id,
        targetSystem: client.name,
        status: 'DELIVERED',
        idempotencyKey: `v1:${client.id}:${identity.id}`,
        attempts: 1,
        deliveredAt: new Date(),
      },
      update: {
        status: 'DELIVERED',
        attempts: { increment: 1 },
        lastError: null,
        deliveredAt: new Date(),
      },
    })
    .catch(() => null);

  return NextResponse.json({
    conforming: identity.conforming && integrityVerified,
    identity: {
      documentType: identity.documentType,
      documentNumber: identity.documentNumber,
      givenNames: identity.givenNames,
      familyNames: identity.familyNames,
      birthDate: isoDateOnlyFromUtc(identity.birthDate),
      sexCode: identity.sexCode,
      municipalityCode: identity.municipalityCode,
      departmentCode: identity.departmentCode,
      phoneE164: identity.phoneE164,
      email: identity.email,
    },
    report: {
      completenessPct: identity.completenessPct,
      issues: identity.issuesJson ?? null,
      integrityVerified,
      confirmedAt: identity.confirmedAt,
      certifiedAt: identity.createdAt,
      retentionMode: identity.retentionMode,
    },
    evidenceRef: identity.id,
  });
}
