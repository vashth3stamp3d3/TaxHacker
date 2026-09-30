import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer"
import { getCurrentUser } from "@/lib/auth"
import { formatMoney } from "@/models/accounting"
import { getCustomer, getCustomerInvoice, getInvoiceLines } from "@/models/commerce"
import { ensureActiveOrganization } from "@/models/organizations"
import { NextRequest } from "next/server"

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 20, marginBottom: 8 },
  muted: { color: "#555", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, paddingBottom: 4, marginTop: 16 },
  tableRow: { flexDirection: "row", paddingVertical: 4 },
  colDesc: { flex: 3 },
  colNum: { flex: 1, textAlign: "right" },
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const invoice = await getCustomerInvoice(organization.id, id)
  if (!invoice) {
    return new Response("Invoice not found", { status: 404 })
  }
  const [customer, lines] = await Promise.all([
    invoice.customerId ? getCustomer(organization.id, invoice.customerId) : Promise.resolve(null),
    getInvoiceLines(invoice.id),
  ])

  const pdf = await renderToBuffer(
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Invoice {invoice.invoiceNumber}</Text>
        <Text style={styles.muted}>
          {organization.legalName || organization.name}
          {organization.gstHstRegistrationNumber ? ` · GST ${organization.gstHstRegistrationNumber}` : ""}
        </Text>
        <Text>Bill to: {customer?.name || "Walk-in customer"}</Text>
        <Text>Status: {invoice.status}</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colNum}>Qty</Text>
          <Text style={styles.colNum}>Amount</Text>
        </View>
        {(lines.length ? lines : [{ id: "header", description: "Print shop sale", quantity: 1, total: invoice.subtotal }]).map(
          (line) => (
            <View key={line.id} style={styles.tableRow}>
              <Text style={styles.colDesc}>{line.description}</Text>
              <Text style={styles.colNum}>{"quantity" in line ? String(line.quantity) : "1"}</Text>
              <Text style={styles.colNum}>{formatMoney(line.total)}</Text>
            </View>
          )
        )}
        <View style={{ marginTop: 16 }}>
          <View style={styles.row}>
            <Text>Subtotal</Text>
            <Text>{formatMoney(invoice.subtotal)}</Text>
          </View>
          <View style={styles.row}>
            <Text>GST</Text>
            <Text>{formatMoney(invoice.taxTotal)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Total</Text>
            <Text>{formatMoney(invoice.total)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
    },
  })
}
