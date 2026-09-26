-- Autorización de clonación de voz (Ley 1581: la voz es dato biométrico sensible).
-- Guarda la EVIDENCIA (hashes + metadatos), nunca el audio: Upway no custodia la voz.
CREATE TABLE "VoiceCloneAuthorization" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "consentingName" TEXT NOT NULL,
    "consentingDocument" TEXT,
    "purpose" TEXT NOT NULL,
    "scriptVersion" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,
    "authorizationSha256" TEXT,
    "sampleSha256" TEXT,
    "sampleSeconds" INTEGER,
    "voiceCloneId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceCloneAuthorization_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VoiceCloneAuthorization_organizationId_grantedAt_idx" ON "VoiceCloneAuthorization"("organizationId", "grantedAt");
CREATE INDEX "VoiceCloneAuthorization_tiendaId_grantedAt_idx" ON "VoiceCloneAuthorization"("tiendaId", "grantedAt");
CREATE INDEX "VoiceCloneAuthorization_voiceCloneId_idx" ON "VoiceCloneAuthorization"("voiceCloneId");
CREATE INDEX "VoiceCloneAuthorization_consentingDocument_idx" ON "VoiceCloneAuthorization"("consentingDocument");

ALTER TABLE "VoiceCloneAuthorization" ADD CONSTRAINT "VoiceCloneAuthorization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceCloneAuthorization" ADD CONSTRAINT "VoiceCloneAuthorization_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceCloneAuthorization" ADD CONSTRAINT "VoiceCloneAuthorization_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;