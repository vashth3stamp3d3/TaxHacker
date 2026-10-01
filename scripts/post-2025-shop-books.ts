/**
 * Post every 2025 shop-book batch that is not already on the ledger.
 *
 * Used by the production container after migrate deploy, and by
 * `npm run ledger:2025` against DATABASE_URL.
 *
 *   npx tsx scripts/post-2025-shop-books.ts --dry-run
 *   npx tsx scripts/post-2025-shop-books.ts --skip-existing
 */
import { SHOP_BOOK_BATCHES_2025, SHOP_BOOK_ENTRY_COUNT_2025 } from "@/lib/post-2025-shop-books"
import { main as postAlibaba } from "./import-alibaba-shareholder-invoices"
import { main as postAmazon } from "./import-amazon-shareholder-invoices"
import { main as postDream } from "./import-dream-lease-payments"
import { main as postEnmax } from "./import-enmax-2025-utilities"
import { main as postShopify } from "./import-shopify-2025-sales"
import { main as postTradingView } from "./import-tradingview-2025"
import { main as postMacbook } from "./import-macbook-2025"
import { main as postNeo } from "./import-neo-2025-claims"
import { main as postJerrold } from "./import-jerrold-2025-income"
import { main as postDepreciation } from "./import-2025-depreciation"

export async function main() {
  console.log(`Posting ${SHOP_BOOK_ENTRY_COUNT_2025} shop-book journals (${SHOP_BOOK_BATCHES_2025.map((batch) => batch.id).join(", ")})`)
  await postAlibaba()
  await postAmazon()
  await postDream()
  await postEnmax()
  await postShopify()
  await postTradingView()
  await postMacbook()
  await postNeo()
  await postJerrold()
  await postDepreciation()
}

const isDirectRun = process.argv[1]?.includes("post-2025-shop-books")
if (isDirectRun) {
  main()
    .catch((error) => {
      console.error(error)
      process.exitCode = 1
    })
    .finally(async () => {
      if (!process.argv.includes("--dry-run")) {
        const { prisma } = await import("@/lib/db")
        await prisma.$disconnect().catch(() => undefined)
      }
    })
}
