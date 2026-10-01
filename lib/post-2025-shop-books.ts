/**
 * Coordinator metadata for posting the 2025 shop books on production boot.
 * Import scripts read --skip-existing so a live redeploy does not rewrite
 * journals that are already on the ledger.
 */
export function shouldSkipExistingJournals() {
  return process.argv.includes("--skip-existing") || process.env.SKIP_EXISTING_JOURNALS === "1"
}

export const SHOP_BOOK_BATCHES_2025 = [
  { id: "alibaba", script: "import-alibaba-shareholder-invoices.ts", entries: 10 },
  { id: "amazon", script: "import-amazon-shareholder-invoices.ts", entries: 8 },
  { id: "dream", script: "import-dream-lease-payments.ts", entries: 23 },
  { id: "enmax", script: "import-enmax-2025-utilities.ts", entries: 12 },
  { id: "shopify", script: "import-shopify-2025-sales.ts", entries: 1 },
  { id: "tradingview", script: "import-tradingview-2025.ts", entries: 1 },
  { id: "macbook", script: "import-macbook-2025.ts", entries: 1 },
  { id: "neo", script: "import-neo-2025-claims.ts", entries: 12 },
  { id: "cca", script: "import-2025-depreciation.ts", entries: 1 },
] as const

export const SHOP_BOOK_ENTRY_COUNT_2025 = SHOP_BOOK_BATCHES_2025.reduce((sum, batch) => sum + batch.entries, 0)
