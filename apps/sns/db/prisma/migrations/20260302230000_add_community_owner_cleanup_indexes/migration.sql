CREATE INDEX "Community_ownerWallet_idx" ON "Community"("ownerWallet");

CREATE INDEX "Community_status_deleteAt_idx" ON "Community"("status", "deleteAt");
