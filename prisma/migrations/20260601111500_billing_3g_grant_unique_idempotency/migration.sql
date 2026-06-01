-- BILLING-3G additive idempotency hardening.
-- PostgreSQL allows multiple NULL values in a unique index, so this only
-- prevents duplicate billing-order-backed grants for the same entitlement.
CREATE UNIQUE INDEX "BillingEntitlementGrant_billingOrderId_entitlementKey_key"
ON "BillingEntitlementGrant"("billingOrderId", "entitlementKey");
