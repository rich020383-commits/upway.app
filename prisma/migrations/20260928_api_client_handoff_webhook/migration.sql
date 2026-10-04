-- AlterTable
ALTER TABLE "ApiClient" ADD COLUMN     "handoffUrl" TEXT;

-- AlterTable
ALTER TABLE "IdentityHandoff" ADD COLUMN     "apiClientId" TEXT,
ADD COLUMN     "nextAttemptAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "IdentityHandoff_status_nextAttemptAt_idx" ON "IdentityHandoff"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "IdentityHandoff_apiClientId_createdAt_idx" ON "IdentityHandoff"("apiClientId", "createdAt");

-- AddForeignKey
ALTER TABLE "IdentityHandoff" ADD CONSTRAINT "IdentityHandoff_apiClientId_fkey" FOREIGN KEY ("apiClientId") REFERENCES "ApiClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
