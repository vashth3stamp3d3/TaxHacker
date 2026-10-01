/**
 * Write Formulated Prints shareholder reimbursement invoices for the 2025 Alibaba receipts.
 *
 *   npx tsx scripts/generate-alibaba-shareholder-invoices.ts
 */
import { renderToBuffer } from "@react-pdf/renderer"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { createElement } from "react"
import { ALIBABA_SHAREHOLDER_INVOICES, formatCad } from "@/lib/alibaba-shareholder-invoices"
import { ShareholderInvoicePDF } from "@/lib/shareholder-invoice-pdf"

const OUTPUT_DIR = path.join(process.cwd(), "data/formulated-prints/invoices")

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })
  let total = 0
  for (const invoice of ALIBABA_SHAREHOLDER_INVOICES) {
    const buffer = await renderToBuffer(createElement(ShareholderInvoicePDF, { invoice }) as never)
    const filename = `FormulatedPrints_Invoice_${invoice.invoiceNumber}.pdf`
    await writeFile(path.join(OUTPUT_DIR, filename), buffer)
    total += invoice.amountPaidCents
    console.log(`${filename}  ${invoice.paidDate}  ${formatCad(invoice.amountPaidCents)}  ${invoice.label}`)
  }
  console.log(`Wrote ${ALIBABA_SHAREHOLDER_INVOICES.length} invoices, shareholder loan ${formatCad(total)}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
