-- AlterTable
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "entity_type" TEXT NOT NULL DEFAULT 'canadian_corporation';

-- CreateTable
CREATE TABLE IF NOT EXISTS "ledger_balance_snapshots" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "source_file" TEXT NOT NULL,
    "as_of" TIMESTAMP(3) NOT NULL,
    "lines" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_balance_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ledger_balance_snapshots_organization_id_kind_key" ON "ledger_balance_snapshots"("organization_id", "kind");
CREATE INDEX IF NOT EXISTS "ledger_balance_snapshots_organization_id_kind_idx" ON "ledger_balance_snapshots"("organization_id", "kind");
