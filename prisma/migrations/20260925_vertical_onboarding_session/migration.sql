-- Onboarding de las verticales no-clinicas (Inmobiliaria / Center).
-- Antes vivia solo en memoria del navegador: al recargar se perdia el avance y
-- el caso quedaba trazado unicamente por correo. Ahora hay borrador + estado.
CREATE TYPE "VerticalOnboardingStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'PENDING_REVIEW', 'NEEDS_CHANGES', 'APPROVED', 'ACTIVE', 'BLOCKED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "VerticalOnboardingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "clinicId" TEXT,
    "segment" TEXT NOT NULL,
    "status" "VerticalOnboardingStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "answers" TEXT,
    "caseRef" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerticalOnboardingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerticalOnboardingSession_userId_segment_key" ON "VerticalOnboardingSession"("userId", "segment");

-- CreateIndex
CREATE INDEX "VerticalOnboardingSession_segment_status_idx" ON "VerticalOnboardingSession"("segment", "status");

-- AddForeignKey
ALTER TABLE "VerticalOnboardingSession" ADD CONSTRAINT "VerticalOnboardingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
