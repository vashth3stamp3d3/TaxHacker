import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import { ReactElement } from "react"
import {
  AlibabaShareholderInvoice,
  formatCad,
  presentationLines,
  settlementRoundingCents,
} from "./alibaba-shareholder-invoices"

const SHAREHOLDER = "Jerrold Jacobe"
const COMPANY = "Formulated Prints Inc."
const COMPANY_ADDRESS = "4558 14 Street NE\nCalgary, AB T2E 6T7\nCanada"
const BUSINESS_NUMBER = "796765758RC0001"
const PHONE = "(587) 889-3235"

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 36,
    color: "#111111",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: "#111111",
    paddingBottom: 10,
  },
  brand: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    letterSpacing: 0.4,
  },
  brandSub: {
    marginTop: 3,
    color: "#444444",
  },
  invoiceTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    textAlign: "right",
  },
  invoiceNumber: {
    marginTop: 4,
    textAlign: "right",
    fontSize: 11,
  },
  parties: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  party: {
    width: "48%",
  },
  label: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textTransform: "uppercase",
    marginBottom: 3,
    color: "#444444",
  },
  meta: {
    flexDirection: "row",
    marginBottom: 14,
  },
  metaItem: {
    marginRight: 28,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#111111",
    color: "#ffffff",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#dddddd",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  desc: { width: "46%" },
  account: { width: "22%" },
  qty: { width: "8%", textAlign: "right" },
  price: { width: "12%", textAlign: "right" },
  amount: { width: "12%", textAlign: "right" },
  headerText: { fontFamily: "Helvetica-Bold", fontSize: 8 },
  summary: {
    marginTop: 10,
    marginLeft: "auto",
    width: "46%",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#111111",
    marginTop: 4,
    paddingTop: 4,
    fontFamily: "Helvetica-Bold",
  },
  notes: {
    marginTop: 16,
    lineHeight: 1.35,
  },
  noteTitle: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
})

function money(cents: number): string {
  return formatCad(cents)
}

export function ShareholderInvoicePDF({ invoice }: { invoice: AlibabaShareholderInvoice }): ReactElement {
  const lines = presentationLines(invoice)
  const goodsAndCharges = lines.reduce((sum, line) => sum + line.totalCents, 0)
  const rounding = settlementRoundingCents(invoice)

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>{COMPANY.toUpperCase()}</Text>
            <Text style={styles.brandSub}>Shareholder reimbursement invoice</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        <View style={styles.parties}>
          <View style={styles.party}>
            <Text style={styles.label}>From</Text>
            <Text>{SHAREHOLDER}</Text>
            <Text>Shareholder</Text>
            <Text>{PHONE}</Text>
          </View>
          <View style={styles.party}>
            <Text style={styles.label}>Bill to</Text>
            <Text>{COMPANY}</Text>
            <Text>{COMPANY_ADDRESS}</Text>
            <Text>GST/HST {BUSINESS_NUMBER}</Text>
          </View>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Text style={styles.label}>Invoice date</Text>
            <Text>{invoice.paidDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.label}>Order date</Text>
            <Text>{invoice.orderDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.label}>Currency</Text>
            <Text>CAD</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.label}>Settlement</Text>
            <Text>Shareholder loan</Text>
          </View>
        </View>

        <Text style={{ marginBottom: 8 }}>{invoice.label}</Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.desc, styles.headerText]}>Description</Text>
          <Text style={[styles.account, styles.headerText]}>Expense</Text>
          <Text style={[styles.qty, styles.headerText]}>Qty</Text>
          <Text style={[styles.price, styles.headerText]}>Unit</Text>
          <Text style={[styles.amount, styles.headerText]}>Amount</Text>
        </View>
        {lines.map((line, index) => (
          <View key={`${invoice.invoiceNumber}-${index}`} style={styles.row}>
            <Text style={styles.desc}>{line.description}</Text>
            <Text style={styles.account}>
              {line.accountCode} {line.accountName}
            </Text>
            <Text style={styles.qty}>{line.quantity ?? ""}</Text>
            <Text style={styles.price}>{line.unitPriceCents == null ? "" : money(line.unitPriceCents)}</Text>
            <Text style={styles.amount}>{money(line.totalCents)}</Text>
          </View>
        ))}

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text>Subtotal</Text>
            <Text>{money(goodsAndCharges)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>GST (0% — no Canadian GST charged)</Text>
            <Text>{money(0)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Total due to shareholder</Text>
            <Text>{money(invoice.amountPaidCents)}</Text>
          </View>
        </View>

        <View style={styles.notes}>
          <Text style={styles.noteTitle}>Payment</Text>
          <Text>
            Paid personally by {SHAREHOLDER} on {invoice.paidDate} with {invoice.paymentDetail}.
            Book to account 2310 Shareholder Loan - Jerrold. Do not pay this invoice from operating cash.
          </Text>
          <Text style={{ marginTop: 6 }}>
            Source: Alibaba order {invoice.orderNumber}, sold by {invoice.seller}. Contract currency USD{" "}
            {(invoice.usdPaidCents / 100).toFixed(2)} at 1 USD = {invoice.fxRate} CAD. Alibaba amount paid{" "}
            {money(invoice.amountPaidCents)}.
            {invoice.settledPrintCents != null && invoice.settledPrintCents !== invoice.amountPaidCents
              ? ` The receipt also prints ${money(invoice.settledPrintCents)} on the paid-on line. This invoice uses the amount-paid total.`
              : ""}
            {rounding !== 0
              ? ` Printed CAD line amounts are ${money(Math.abs(rounding))} ${rounding < 0 ? "above" : "below"} that total. The difference is the CAD settlement rounding line.`
              : ""}
          </Text>
          <Text style={{ marginTop: 6 }}>
            GST is zero. The Alibaba receipt is not a Canadian tax invoice and no GST was charged, so there is no input
            tax credit on this document. Any GST assessed by CBSA or a customs broker is a separate invoice.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
