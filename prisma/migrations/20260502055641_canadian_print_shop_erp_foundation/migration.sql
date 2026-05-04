-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "legal_name" TEXT,
    "trade_name" TEXT,
    "province" TEXT NOT NULL DEFAULT 'AB',
    "country" TEXT NOT NULL DEFAULT 'CA',
    "base_currency" TEXT NOT NULL DEFAULT 'CAD',
    "fiscal_year_start_month" INTEGER NOT NULL DEFAULT 1,
    "business_number" TEXT,
    "gst_hst_registration_number" TEXT,
    "gst_remittance_frequency" TEXT NOT NULL DEFAULT 'quarterly',
    "accountant_name" TEXT,
    "accountant_email" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_years" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiscal_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_periods" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "fiscal_year_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounting_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "number_sequences" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "next_number" INTEGER NOT NULL DEFAULT 1,
    "padding" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "number_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_numbers" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "program" TEXT NOT NULL DEFAULT 'GST',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_tax_registrations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "tax_type" TEXT NOT NULL DEFAULT 'GST',
    "registration_number" TEXT,
    "province" TEXT NOT NULL DEFAULT 'AB',
    "rate_basis_points" INTEGER NOT NULL DEFAULT 500,
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sales_tax_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_filing_periods" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "tax_type" TEXT NOT NULL DEFAULT 'GST',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "due_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_filing_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_remittances" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "filing_period_id" UUID,
    "tax_type" TEXT NOT NULL DEFAULT 'GST',
    "collected" INTEGER NOT NULL DEFAULT 0,
    "input_credits" INTEGER NOT NULL DEFAULT 0,
    "adjustments" INTEGER NOT NULL DEFAULT 0,
    "net_tax" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "remitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_remittances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "province_tax_profiles" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'AB',
    "tax_type" TEXT NOT NULL DEFAULT 'GST',
    "rate_basis_points" INTEGER NOT NULL DEFAULT 500,
    "is_default" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "province_tax_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_accounts" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subtype" TEXT,
    "normal_balance" TEXT NOT NULL,
    "parent_id" UUID,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ledger_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "entry_number" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "source_id" UUID,
    "description" TEXT,
    "posted_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'posted',
    "currency_code" TEXT NOT NULL DEFAULT 'CAD',
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_lines" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "journal_entry_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "debit" INTEGER NOT NULL DEFAULT 0,
    "credit" INTEGER NOT NULL DEFAULT 0,
    "memo" TEXT,
    "tax_code_id" UUID,
    "dimension_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_dimensions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'department',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounting_dimensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_codes" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tax_type" TEXT NOT NULL DEFAULT 'GST',
    "rate_basis_points" INTEGER NOT NULL DEFAULT 0,
    "recoverable_basis_points" INTEGER NOT NULL DEFAULT 0,
    "liability_account_id" UUID,
    "receivable_account_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "clearing_account_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "ledger_account_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "institution" TEXT,
    "transit_number" TEXT,
    "account_number_last4" TEXT,
    "currency_code" TEXT NOT NULL DEFAULT 'CAD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "tax_exempt" BOOLEAN NOT NULL DEFAULT false,
    "payment_terms" TEXT NOT NULL DEFAULT 'Net 30',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "gst_number" TEXT,
    "payment_terms" TEXT NOT NULL DEFAULT 'Net 30',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "party_type" TEXT NOT NULL,
    "party_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "party_type" TEXT NOT NULL,
    "party_id" UUID NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Primary',
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'AB',
    "postal_code" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'CA',

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'material',
    "description" TEXT,
    "unit_of_measure" TEXT NOT NULL DEFAULT 'each',
    "standard_cost" INTEGER NOT NULL DEFAULT 0,
    "sales_price" INTEGER NOT NULL DEFAULT 0,
    "preferred_vendor_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skus" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "barcode" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units_of_measure" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "precision" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "units_of_measure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "revenue_account_id" UUID,
    "hourly_rate" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_lists" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "currency_code" TEXT NOT NULL DEFAULT 'CAD',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,

    CONSTRAINT "price_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_specs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "print_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_specs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_lots" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "lot_number" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "movement_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" INTEGER NOT NULL DEFAULT 0,
    "source_type" TEXT,
    "source_id" UUID,
    "memo" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_balances" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "quantity_on_hand" INTEGER NOT NULL DEFAULT 0,
    "average_cost" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_valuation_layers" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "movement_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" INTEGER NOT NULL,
    "remaining_quantity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_valuation_layers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "quote_number" TEXT NOT NULL,
    "customer_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "tax_total" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "valid_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_lines" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "quote_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" INTEGER NOT NULL DEFAULT 0,
    "tax_code_id" UUID,
    "total" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quote_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "order_number" TEXT NOT NULL,
    "customer_id" UUID,
    "quote_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'open',
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "tax_total" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_lines" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "sales_order_id" UUID NOT NULL,
    "item_id" UUID,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sales_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_jobs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "job_number" TEXT NOT NULL,
    "sales_order_id" UUID,
    "customer_id" UUID,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "due_at" TIMESTAMP(3),
    "quoted_total" INTEGER NOT NULL DEFAULT 0,
    "actual_cost" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "print_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_materials" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "print_job_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" INTEGER NOT NULL DEFAULT 0,
    "consumed_at" TIMESTAMP(3),

    CONSTRAINT "job_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_labor" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "print_job_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "rate" INTEGER NOT NULL DEFAULT 0,
    "worked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_labor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_status_events" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "print_job_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "order_number" TEXT NOT NULL,
    "vendor_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "tax_total" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_lines" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "item_id" UUID,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_cost" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipts" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "purchase_order_id" UUID,
    "vendor_id" UUID,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'received',

    CONSTRAINT "goods_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_bills" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "bill_number" TEXT NOT NULL,
    "vendor_id" UUID,
    "journal_entry_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "tax_total" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMP(3),

    CONSTRAINT "vendor_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_payments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "vendor_id" UUID,
    "journal_entry_id" UUID,
    "amount" INTEGER NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memo" TEXT,

    CONSTRAINT "vendor_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_invoices" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "customer_id" UUID,
    "sales_order_id" UUID,
    "journal_entry_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "tax_total" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "item_id" UUID,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" INTEGER NOT NULL DEFAULT 0,
    "tax_code_id" UUID,
    "total" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_payments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "customer_id" UUID,
    "journal_entry_id" UUID,
    "amount" INTEGER NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memo" TEXT,

    CONSTRAINT "customer_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_memos" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "memo_number" TEXT NOT NULL,
    "customer_id" UUID,
    "journal_entry_id" UUID,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_memos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_rules" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_suggestions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "source_type" TEXT,
    "source_id" UUID,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "proposed_data" JSONB,
    "approved_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_classifications" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "file_id" UUID,
    "document_type" TEXT NOT NULL,
    "party_name" TEXT,
    "tax_code" TEXT,
    "account_code" TEXT,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "extracted_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reorder_rules" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "min_quantity" INTEGER NOT NULL DEFAULT 0,
    "reorder_quantity" INTEGER NOT NULL DEFAULT 0,
    "preferred_vendor_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "reorder_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_snapshots" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forecast_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_tasks" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "due_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_runs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "report_type" TEXT NOT NULL,
    "parameters" JSONB,
    "result" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organization_members_user_id_idx" ON "organization_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organization_id_user_id_key" ON "organization_members"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "fiscal_years_organization_id_idx" ON "fiscal_years"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_years_organization_id_name_key" ON "fiscal_years"("organization_id", "name");

-- CreateIndex
CREATE INDEX "accounting_periods_organization_id_idx" ON "accounting_periods"("organization_id");

-- CreateIndex
CREATE INDEX "accounting_periods_fiscal_year_id_idx" ON "accounting_periods"("fiscal_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_periods_organization_id_name_key" ON "accounting_periods"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "number_sequences_organization_id_code_key" ON "number_sequences"("organization_id", "code");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_idx" ON "audit_logs"("organization_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_numbers_organization_id_program_key" ON "business_numbers"("organization_id", "program");

-- CreateIndex
CREATE INDEX "sales_tax_registrations_organization_id_idx" ON "sales_tax_registrations"("organization_id");

-- CreateIndex
CREATE INDEX "tax_filing_periods_organization_id_idx" ON "tax_filing_periods"("organization_id");

-- CreateIndex
CREATE INDEX "tax_remittances_organization_id_idx" ON "tax_remittances"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "province_tax_profiles_organization_id_province_tax_type_key" ON "province_tax_profiles"("organization_id", "province", "tax_type");

-- CreateIndex
CREATE INDEX "ledger_accounts_organization_id_idx" ON "ledger_accounts"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_accounts_organization_id_code_key" ON "ledger_accounts"("organization_id", "code");

-- CreateIndex
CREATE INDEX "journal_entries_organization_id_posted_at_idx" ON "journal_entries"("organization_id", "posted_at");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_organization_id_entry_number_key" ON "journal_entries"("organization_id", "entry_number");

-- CreateIndex
CREATE INDEX "journal_lines_organization_id_idx" ON "journal_lines"("organization_id");

-- CreateIndex
CREATE INDEX "journal_lines_account_id_idx" ON "journal_lines"("account_id");

-- CreateIndex
CREATE INDEX "journal_lines_tax_code_id_idx" ON "journal_lines"("tax_code_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_dimensions_organization_id_code_key" ON "accounting_dimensions"("organization_id", "code");

-- CreateIndex
CREATE INDEX "tax_codes_organization_id_idx" ON "tax_codes"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "tax_codes_organization_id_code_key" ON "tax_codes"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_organization_id_name_key" ON "payment_methods"("organization_id", "name");

-- CreateIndex
CREATE INDEX "bank_accounts_organization_id_idx" ON "bank_accounts"("organization_id");

-- CreateIndex
CREATE INDEX "customers_organization_id_idx" ON "customers"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_organization_id_code_key" ON "customers"("organization_id", "code");

-- CreateIndex
CREATE INDEX "vendors_organization_id_idx" ON "vendors"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_organization_id_code_key" ON "vendors"("organization_id", "code");

-- CreateIndex
CREATE INDEX "contacts_organization_id_party_type_party_id_idx" ON "contacts"("organization_id", "party_type", "party_id");

-- CreateIndex
CREATE INDEX "addresses_organization_id_party_type_party_id_idx" ON "addresses"("organization_id", "party_type", "party_id");

-- CreateIndex
CREATE INDEX "items_organization_id_idx" ON "items"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "items_organization_id_sku_key" ON "items"("organization_id", "sku");

-- CreateIndex
CREATE INDEX "skus_item_id_idx" ON "skus"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "skus_organization_id_code_key" ON "skus"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "units_of_measure_organization_id_code_key" ON "units_of_measure"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "services_organization_id_code_key" ON "services"("organization_id", "code");

-- CreateIndex
CREATE INDEX "price_lists_organization_id_idx" ON "price_lists"("organization_id");

-- CreateIndex
CREATE INDEX "print_specs_organization_id_idx" ON "print_specs"("organization_id");

-- CreateIndex
CREATE INDEX "material_specs_organization_id_idx" ON "material_specs"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_organization_id_code_key" ON "warehouses"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_lots_organization_id_item_id_lot_number_key" ON "inventory_lots"("organization_id", "item_id", "lot_number");

-- CreateIndex
CREATE INDEX "inventory_movements_organization_id_idx" ON "inventory_movements"("organization_id");

-- CreateIndex
CREATE INDEX "inventory_movements_item_id_idx" ON "inventory_movements"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_balances_organization_id_item_id_warehouse_id_key" ON "stock_balances"("organization_id", "item_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "inventory_valuation_layers_organization_id_idx" ON "inventory_valuation_layers"("organization_id");

-- CreateIndex
CREATE INDEX "quotes_organization_id_idx" ON "quotes"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_organization_id_quote_number_key" ON "quotes"("organization_id", "quote_number");

-- CreateIndex
CREATE INDEX "quote_lines_quote_id_idx" ON "quote_lines"("quote_id");

-- CreateIndex
CREATE INDEX "sales_orders_organization_id_idx" ON "sales_orders"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_organization_id_order_number_key" ON "sales_orders"("organization_id", "order_number");

-- CreateIndex
CREATE INDEX "sales_order_lines_sales_order_id_idx" ON "sales_order_lines"("sales_order_id");

-- CreateIndex
CREATE INDEX "print_jobs_organization_id_idx" ON "print_jobs"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "print_jobs_organization_id_job_number_key" ON "print_jobs"("organization_id", "job_number");

-- CreateIndex
CREATE INDEX "job_materials_print_job_id_idx" ON "job_materials"("print_job_id");

-- CreateIndex
CREATE INDEX "job_labor_print_job_id_idx" ON "job_labor"("print_job_id");

-- CreateIndex
CREATE INDEX "job_status_events_print_job_id_idx" ON "job_status_events"("print_job_id");

-- CreateIndex
CREATE INDEX "purchase_orders_organization_id_idx" ON "purchase_orders"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_organization_id_order_number_key" ON "purchase_orders"("organization_id", "order_number");

-- CreateIndex
CREATE INDEX "purchase_order_lines_purchase_order_id_idx" ON "purchase_order_lines"("purchase_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipts_organization_id_receipt_number_key" ON "goods_receipts"("organization_id", "receipt_number");

-- CreateIndex
CREATE INDEX "vendor_bills_organization_id_idx" ON "vendor_bills"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_bills_organization_id_bill_number_key" ON "vendor_bills"("organization_id", "bill_number");

-- CreateIndex
CREATE INDEX "vendor_payments_organization_id_idx" ON "vendor_payments"("organization_id");

-- CreateIndex
CREATE INDEX "customer_invoices_organization_id_idx" ON "customer_invoices"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_invoices_organization_id_invoice_number_key" ON "customer_invoices"("organization_id", "invoice_number");

-- CreateIndex
CREATE INDEX "invoice_lines_invoice_id_idx" ON "invoice_lines"("invoice_id");

-- CreateIndex
CREATE INDEX "customer_payments_organization_id_idx" ON "customer_payments"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "credit_memos_organization_id_memo_number_key" ON "credit_memos"("organization_id", "memo_number");

-- CreateIndex
CREATE INDEX "automation_rules_organization_id_idx" ON "automation_rules"("organization_id");

-- CreateIndex
CREATE INDEX "automation_suggestions_organization_id_status_idx" ON "automation_suggestions"("organization_id", "status");

-- CreateIndex
CREATE INDEX "document_classifications_organization_id_idx" ON "document_classifications"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "reorder_rules_organization_id_item_id_key" ON "reorder_rules"("organization_id", "item_id");

-- CreateIndex
CREATE INDEX "forecast_snapshots_organization_id_type_idx" ON "forecast_snapshots"("organization_id", "type");

-- CreateIndex
CREATE INDEX "notification_tasks_organization_id_status_idx" ON "notification_tasks"("organization_id", "status");

-- CreateIndex
CREATE INDEX "report_runs_organization_id_report_type_idx" ON "report_runs"("organization_id", "report_type");

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
