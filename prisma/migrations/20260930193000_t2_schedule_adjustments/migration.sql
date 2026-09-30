-- CreateTable
CREATE TABLE "t2_schedule_adjustments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "tax_year" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t2_schedule_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t2_schedule_adjustments_organization_id_tax_year_idx" ON "t2_schedule_adjustments"("organization_id", "tax_year");

-- CreateIndex
CREATE UNIQUE INDEX "t2_schedule_adjustments_organization_id_tax_year_code_key" ON "t2_schedule_adjustments"("organization_id", "tax_year", "code");
