-- HITO AUTH-1: password recovery requests.
-- Stores only hashed reset tokens; production migration requires explicit approval.

CREATE TABLE "PasswordResetRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "emailNormalized" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "tokenHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "deliveryMode" TEXT NOT NULL DEFAULT 'manual',
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "requestedIpHash" TEXT,
    "userAgentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordResetRequest_tokenHash_key" ON "PasswordResetRequest"("tokenHash");
CREATE INDEX "PasswordResetRequest_userId_idx" ON "PasswordResetRequest"("userId");
CREATE INDEX "PasswordResetRequest_emailHash_idx" ON "PasswordResetRequest"("emailHash");
CREATE INDEX "PasswordResetRequest_status_idx" ON "PasswordResetRequest"("status");
CREATE INDEX "PasswordResetRequest_expiresAt_idx" ON "PasswordResetRequest"("expiresAt");

ALTER TABLE "PasswordResetRequest"
ADD CONSTRAINT "PasswordResetRequest_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
