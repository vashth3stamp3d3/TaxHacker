-- AlterTable
ALTER TABLE "ledger_balance_snapshots" ADD COLUMN IF NOT EXISTS "year" INTEGER;

UPDATE "ledger_balance_snapshots" SET "year" = 2025 WHERE "year" IS NULL;

ALTER TABLE "ledger_balance_snapshots" ALTER COLUMN "year" SET NOT NULL;

DROP INDEX IF EXISTS "ledger_balance_snapshots_organization_id_kind_key";
DROP INDEX IF EXISTS "ledger_balance_snapshots_organization_id_kind_idx";

CREATE UNIQUE INDEX IF NOT EXISTS "ledger_balance_snapshots_organization_id_year_kind_key"
  ON "ledger_balance_snapshots"("organization_id", "year", "kind");
CREATE INDEX IF NOT EXISTS "ledger_balance_snapshots_organization_id_year_kind_idx"
  ON "ledger_balance_snapshots"("organization_id", "year", "kind");
