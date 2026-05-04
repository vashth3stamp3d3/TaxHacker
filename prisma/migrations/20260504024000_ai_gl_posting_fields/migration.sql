-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "accounting_suggestion" JSONB,
ADD COLUMN     "journal_entry_id" UUID,
ADD COLUMN     "payment_method_id" UUID;

-- CreateIndex
CREATE INDEX "transactions_journal_entry_id_idx" ON "transactions"("journal_entry_id");

-- CreateIndex
CREATE INDEX "transactions_payment_method_id_idx" ON "transactions"("payment_method_id");
