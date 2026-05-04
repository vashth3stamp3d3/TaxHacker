import { Field } from "@/prisma/client"

export const fieldsToJsonSchema = (fields: Field[]) => {
  const fieldsWithPrompt = fields.filter((field) => field.llm_prompt)
  const schemaProperties = fieldsWithPrompt.reduce(
    (acc, field) => {
      acc[field.code] = { type: field.type, description: field.llm_prompt || "" }
      return acc
    },
    {} as Record<string, { type: string; description: string }>
  )

  const schema = {
    type: "object",
    properties: {
      ...schemaProperties,
      items: {
        type: "array",
        description:
          "Separate items, products or transactions in the file which have own name and price or sum. Find all items!",
        items: {
          type: "object",
          properties: schemaProperties,
          required: [...Object.keys(schemaProperties)],
          additionalProperties: false,
        },
      },
      accountingLines: {
        type: "array",
        description:
          "Balanced double-entry bookkeeping suggestion in dollars. Use account codes from the supplied chart of accounts. For owner-paid business purchases, debit the expense/inventory/tax accounts and credit the Owing to Owner liability account.",
        items: {
          type: "object",
          properties: {
            accountCode: { type: "string", description: "Ledger account code from the supplied chart of accounts" },
            accountName: { type: "string", description: "Ledger account name" },
            debit: { type: "number", description: "Debit amount in dollars, before conversion to cents" },
            credit: { type: "number", description: "Credit amount in dollars, before conversion to cents" },
            memo: { type: "string", description: "Short accounting memo for this line" },
            taxCode: {
              type: "string",
              description: "GST tax code from the supplied tax codes, or OUT_OF_SCOPE when not Canadian GST",
            },
            confidence: { type: "number", description: "Confidence from 0 to 100" },
          },
          required: ["accountCode", "accountName", "debit", "credit", "memo", "taxCode", "confidence"],
          additionalProperties: false,
        },
      },
      taxTreatment: {
        type: "object",
        description: "Canadian GST and ITC treatment for the document.",
        properties: {
          code: { type: "string", description: "Best matching tax code" },
          summary: { type: "string", description: "Short explanation of GST/ITC treatment" },
          recoverable: { type: "boolean", description: "Whether the tax appears recoverable as an ITC" },
          confidence: { type: "number", description: "Confidence from 0 to 100" },
        },
        required: ["code", "summary", "recoverable", "confidence"],
        additionalProperties: false,
      },
      paymentMethodSuggestion: {
        type: "object",
        description: "Likely payment method based on the document and remembered business rules.",
        properties: {
          name: { type: "string", description: "Suggested payment method name from the supplied payment methods" },
          confidence: { type: "number", description: "Confidence from 0 to 100" },
          reason: { type: "string", description: "Why this payment method was selected" },
        },
        required: ["name", "confidence", "reason"],
        additionalProperties: false,
      },
      accountingReviewNotes: {
        type: "array",
        description:
          "Important review notes such as foreign currency, missing GST, duplicate risk, fixed asset risk, job costing, or owner reimbursement.",
        items: { type: "string" },
      },
      automationSuggestions: {
        type: "array",
        description:
          "Operational automation suggestions such as vendor creation, duplicate warning, inventory receipt, job costing, fixed asset treatment, reimbursement, cash flow, or document routing.",
        items: {
          type: "object",
          properties: {
            type: { type: "string", description: "Suggestion type" },
            title: { type: "string", description: "Short title" },
            description: { type: "string", description: "Suggested action and reason" },
            confidence: { type: "number", description: "Confidence from 0 to 100" },
          },
          required: ["type", "title", "description", "confidence"],
          additionalProperties: false,
        },
      },
    },
    required: [
      ...Object.keys(schemaProperties),
      "items",
      "accountingLines",
      "taxTreatment",
      "paymentMethodSuggestion",
      "accountingReviewNotes",
      "automationSuggestions",
    ],
    additionalProperties: false,
  }

  return schema
}
