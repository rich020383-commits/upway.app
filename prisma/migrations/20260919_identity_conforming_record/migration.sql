-- CreateEnum
CREATE TYPE "IdentityRetentionMode" AS ENUM ('TRANSIENT', 'CUSTODY');

-- CreateEnum
CREATE TYPE "IdentityChannel" AS ENUM ('VOICE', 'WHATSAPP', 'DASHBOARD');

-- CreateEnum
CREATE TYPE "IdentityHandoffStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "PatientIdentity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clinicId" TEXT,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "givenNames" TEXT[],
    "familyNames" TEXT[],
    "birthDate" DATE NOT NULL,
    "sexCode" TEXT NOT NULL,
    "municipalityCode" TEXT NOT NULL,
    "departmentCode" TEXT NOT NULL,
    "phoneE164" TEXT,
    "email" TEXT,
    "conforming" BOOLEAN NOT NULL DEFAULT false,
    "completenessPct" INTEGER NOT NULL DEFAULT 0,
    "issuesJson" JSONB,
    "recordHash" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "retentionMode" "IdentityRetentionMode" NOT NULL DEFAULT 'TRANSIENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityConfirmation" (
    "id" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "channel" "IdentityChannel" NOT NULL DEFAULT 'VOICE',
    "method" TEXT NOT NULL DEFAULT 'DIGIT_BY_DIGIT_READBACK',
    "scriptText" TEXT NOT NULL,
    "patientReply" TEXT,
    "callId" TEXT,
    "conversationId" TEXT,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityHandoff" (
    "id" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "targetSystem" TEXT NOT NULL,
    "targetRef" TEXT,
    "status" "IdentityHandoffStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentityHandoff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PatientIdentity_organizationId_documentNumber_idx" ON "PatientIdentity"("organizationId", "documentNumber");

-- CreateIndex
CREATE INDEX "PatientIdentity_clinicId_createdAt_idx" ON "PatientIdentity"("clinicId", "createdAt");

-- CreateIndex
CREATE INDEX "PatientIdentity_conforming_createdAt_idx" ON "PatientIdentity"("conforming", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PatientIdentity_organizationId_documentType_documentNumber_key" ON "PatientIdentity"("organizationId", "documentType", "documentNumber");

-- CreateIndex
CREATE INDEX "IdentityConfirmation_identityId_confirmedAt_idx" ON "IdentityConfirmation"("identityId", "confirmedAt");

-- CreateIndex
CREATE INDEX "IdentityConfirmation_callId_idx" ON "IdentityConfirmation"("callId");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityHandoff_idempotencyKey_key" ON "IdentityHandoff"("idempotencyKey");

-- CreateIndex
CREATE INDEX "IdentityHandoff_identityId_status_idx" ON "IdentityHandoff"("identityId", "status");

-- CreateIndex
CREATE INDEX "IdentityHandoff_status_createdAt_idx" ON "IdentityHandoff"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "PatientIdentity" ADD CONSTRAINT "PatientIdentity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientIdentity" ADD CONSTRAINT "PatientIdentity_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityConfirmation" ADD CONSTRAINT "IdentityConfirmation_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "PatientIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityHandoff" ADD CONSTRAINT "IdentityHandoff_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "PatientIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

