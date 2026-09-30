-- AlterTable
ALTER TABLE "files" ADD COLUMN "organization_id" UUID;

-- AlterTable
ALTER TABLE "transactions"
ADD COLUMN "organization_id" UUID,
ADD COLUMN "posts_to_ledger" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "destination_type" TEXT,
ADD COLUMN "source_file_id" UUID,
ADD COLUMN "vendor_bill_id" UUID,
ADD COLUMN "customer_invoice_id" UUID,
ADD COLUMN "goods_receipt_id" UUID;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "owner_display_name" TEXT;

-- AlterTable
ALTER TABLE "tax_remittances" ADD COLUMN "journal_entry_id" UUID;

-- AlterTable
ALTER TABLE "journal_entries" ADD COLUMN "reversed_entry_id" UUID;

-- AlterTable
ALTER TABLE "items" ADD COLUMN "inventory_account_code" TEXT;

-- AlterTable
ALTER TABLE "print_jobs"
ADD COLUMN "customer_invoice_id" UUID,
ADD COLUMN "wip_journal_entry_id" UUID,
ADD COLUMN "cogs_journal_entry_id" UUID;

-- AlterTable
ALTER TABLE "goods_receipts"
ADD COLUMN "journal_entry_id" UUID,
ADD COLUMN "source_file_id" UUID;

-- AlterTable
ALTER TABLE "vendor_bills"
ADD COLUMN "purchase_order_id" UUID,
ADD COLUMN "goods_receipt_id" UUID,
ADD COLUMN "source_file_id" UUID;

-- AlterTable
ALTER TABLE "vendor_payments" ADD COLUMN "vendor_bill_id" UUID;

-- AlterTable
ALTER TABLE "customer_invoices" ADD COLUMN "source_file_id" UUID;

-- AlterTable
ALTER TABLE "customer_payments" ADD COLUMN "invoice_id" UUID;

-- CreateIndex
CREATE INDEX "files_organization_id_idx" ON "files"("organization_id");
CREATE INDEX "files_user_id_is_reviewed_idx" ON "files"("user_id", "is_reviewed");
CREATE INDEX "transactions_organization_id_idx" ON "transactions"("organization_id");
CREATE UNIQUE INDEX "transactions_source_file_id_key" ON "transactions"("source_file_id");
CREATE INDEX "tax_remittances_filing_period_id_idx" ON "tax_remittances"("filing_period_id");
CREATE UNIQUE INDEX "goods_receipts_source_file_id_key" ON "goods_receipts"("source_file_id");
CREATE UNIQUE INDEX "vendor_bills_source_file_id_key" ON "vendor_bills"("source_file_id");
CREATE UNIQUE INDEX "customer_invoices_source_file_id_key" ON "customer_invoices"("source_file_id");

-- Backfill organization ids from the user's first active membership
UPDATE "files" AS f
SET "organization_id" = (
  SELECT om."organization_id"
  FROM "organization_members" om
  WHERE om."user_id" = f."user_id" AND om."is_active" = true
  ORDER BY om."created_at" ASC
  LIMIT 1
)
WHERE f."organization_id" IS NULL;

UPDATE "transactions" AS t
SET "organization_id" = (
  SELECT om."organization_id"
  FROM "organization_members" om
  WHERE om."user_id" = t."user_id" AND om."is_active" = true
  ORDER BY om."created_at" ASC
  LIMIT 1
)
WHERE t."organization_id" IS NULL;

-- CreateTable
CREATE TABLE "document_attachments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "transaction_id" UUID,
    "customer_invoice_id" UUID,
    "vendor_bill_id" UUID,
    "quote_id" UUID,
    "sales_order_id" UUID,
    "print_job_id" UUID,
    "purchase_order_id" UUID,
    "goods_receipt_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "document_attachments_organization_id_idx" ON "document_attachments"("organization_id");
CREATE INDEX "document_attachments_file_id_idx" ON "document_attachments"("file_id");
CREATE INDEX "document_attachments_transaction_id_idx" ON "document_attachments"("transaction_id");
CREATE INDEX "document_attachments_customer_invoice_id_idx" ON "document_attachments"("customer_invoice_id");
CREATE INDEX "document_attachments_vendor_bill_id_idx" ON "document_attachments"("vendor_bill_id");

-- CreateTable
CREATE TABLE "tax_advisor_threads" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Tax advisor',
    "entity_type" TEXT,
    "entity_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_advisor_threads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tax_advisor_threads_organization_id_updated_at_idx" ON "tax_advisor_threads"("organization_id", "updated_at");
CREATE INDEX "tax_advisor_threads_user_id_idx" ON "tax_advisor_threads"("user_id");

-- CreateTable
CREATE TABLE "tax_advisor_messages" (
    "id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sources" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_advisor_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tax_advisor_messages_thread_id_idx" ON "tax_advisor_messages"("thread_id");

ALTER TABLE "tax_advisor_messages"
ADD CONSTRAINT "tax_advisor_messages_thread_id_fkey"
FOREIGN KEY ("thread_id") REFERENCES "tax_advisor_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
