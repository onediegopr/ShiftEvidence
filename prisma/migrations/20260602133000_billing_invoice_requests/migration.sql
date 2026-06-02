CREATE TYPE "BillingInvoiceRequestStatus" AS ENUM ('pending', 'invoice_sent', 'payment_received', 'cancelled', 'rejected');

CREATE TYPE "BillingInvoiceRequestProvider" AS ENUM ('wise', 'bank_transfer');

CREATE TABLE "BillingInvoiceRequest" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "planSlug" TEXT NOT NULL,
  "planName" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "cadence" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "country" TEXT,
  "taxId" TEXT,
  "purchaseOrder" TEXT,
  "notes" TEXT,
  "userId" TEXT,
  "workspaceId" TEXT,
  "assessmentId" TEXT,
  "status" "BillingInvoiceRequestStatus" NOT NULL DEFAULT 'pending',
  "provider" "BillingInvoiceRequestProvider" NOT NULL DEFAULT 'wise',
  "internalNotes" TEXT,
  "invoiceSentAt" TIMESTAMP(3),
  "paymentReceivedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BillingInvoiceRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BillingInvoiceRequest_status_idx" ON "BillingInvoiceRequest"("status");
CREATE INDEX "BillingInvoiceRequest_provider_idx" ON "BillingInvoiceRequest"("provider");
CREATE INDEX "BillingInvoiceRequest_planSlug_idx" ON "BillingInvoiceRequest"("planSlug");
CREATE INDEX "BillingInvoiceRequest_customerEmail_idx" ON "BillingInvoiceRequest"("customerEmail");
CREATE INDEX "BillingInvoiceRequest_userId_idx" ON "BillingInvoiceRequest"("userId");
CREATE INDEX "BillingInvoiceRequest_workspaceId_idx" ON "BillingInvoiceRequest"("workspaceId");
CREATE INDEX "BillingInvoiceRequest_assessmentId_idx" ON "BillingInvoiceRequest"("assessmentId");
CREATE INDEX "BillingInvoiceRequest_createdAt_idx" ON "BillingInvoiceRequest"("createdAt");

ALTER TABLE "BillingInvoiceRequest" ADD CONSTRAINT "BillingInvoiceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingInvoiceRequest" ADD CONSTRAINT "BillingInvoiceRequest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingInvoiceRequest" ADD CONSTRAINT "BillingInvoiceRequest_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;