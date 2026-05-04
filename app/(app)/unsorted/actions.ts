"use server"

import { AnalysisResult, analyzeTransaction } from "@/ai/analyze"
import { AnalyzeAttachment, loadAttachmentsForAI } from "@/ai/attachments"
import { buildLLMPrompt } from "@/ai/prompt"
import { fieldsToJsonSchema } from "@/ai/schema"
import { transactionFormSchema } from "@/forms/transactions"
import { ActionState } from "@/lib/actions"
import { getCurrentUser, isAiBalanceExhausted, isSubscriptionExpired } from "@/lib/auth"
import { prisma } from "@/lib/db"
import {
  AccountingSuggestion,
  getLedgerAccounts,
  getPaymentMethods,
  getTaxCodes,
  postReceiptAnalysisJournalEntry,
} from "@/models/accounting"
import {
  getDirectorySize,
  getTransactionFileUploadPath,
  getUserUploadsDirectory,
  safePathJoin,
  unsortedFilePath,
} from "@/lib/files"
import { DEFAULT_PROMPT_ANALYSE_NEW_FILE } from "@/models/defaults"
import { createFile, deleteFile, getFileById, updateFile } from "@/models/files"
import { ensureActiveOrganization } from "@/models/organizations"
import { createTransaction, TransactionData, updateTransactionFiles, updateTransactionJournalEntry } from "@/models/transactions"
import { updateUser } from "@/models/users"
import { Category, Field, File, Prisma, Project, Transaction } from "@/prisma/client"
import { randomUUID } from "crypto"
import { mkdir, readFile, rename, writeFile } from "fs/promises"
import { revalidatePath } from "next/cache"
import path from "path"
import { errorMessage, logError, logInfo } from "@/lib/logger"

export async function analyzeFileAction(
  file: File,
  settings: Record<string, string>,
  fields: Field[],
  categories: Category[],
  projects: Project[]
): Promise<ActionState<AnalysisResult>> {
  const user = await getCurrentUser()

  if (!file || file.userId !== user.id) {
    return { success: false, error: "File not found or does not belong to the user" }
  }

  if (isAiBalanceExhausted(user)) {
    return {
      success: false,
      error: "You used all of your pre-paid AI scans, please upgrade your account or buy new subscription plan",
    }
  }

  if (isSubscriptionExpired(user)) {
    return {
      success: false,
      error: "Your subscription has expired, please upgrade your account or buy new subscription plan",
    }
  }

  const organization = await ensureActiveOrganization(user)
  const [accounts, taxCodes, paymentMethods] = await Promise.all([
    getLedgerAccounts(organization.id),
    getTaxCodes(organization.id),
    getPaymentMethods(organization.id),
  ])

  let attachments: AnalyzeAttachment[] = []
  try {
    attachments = await loadAttachmentsForAI(user, file)
    logInfo("analysis.attachments.loaded", {
      fileId: file.id,
      filename: file.filename,
      fileMimeType: file.mimetype,
      attachmentCount: attachments.length,
      attachmentTypes: attachments.map((attachment) => attachment.contentType),
    })
  } catch (error) {
    logError("analysis.attachments.error", {
      fileId: file.id,
      filename: file.filename,
      fileMimeType: file.mimetype,
      error: errorMessage(error),
    })
    return { success: false, error: "Failed to retrieve files: " + errorMessage(error) }
  }

  const prompt = `${buildLLMPrompt(
    settings.prompt_analyse_new_file || DEFAULT_PROMPT_ANALYSE_NEW_FILE,
    fields,
    categories,
    projects
  )}

${buildAccountingContext({ accounts, taxCodes, paymentMethods })}`

  const schema = fieldsToJsonSchema(fields)

  const results = await analyzeTransaction(prompt, schema, attachments, file.id, user.id)

  logInfo("analysis.result", {
    fileId: file.id,
    success: results.success,
    hasData: Boolean(results.data),
    error: results.success ? undefined : results.error,
  })

  if (results.data?.tokensUsed && results.data.tokensUsed > 0) {
    await updateUser(user.id, { aiBalance: { decrement: 1 } })
  }

  return results
}

export async function saveFileAsTransactionAction(
  _prevState: ActionState<Transaction> | null,
  formData: FormData
): Promise<ActionState<Transaction>> {
  try {
    const user = await getCurrentUser()
    const validatedForm = transactionFormSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedForm.success) {
      return { success: false, error: validatedForm.error.message }
    }

    // Get the file record
    const fileId = formData.get("fileId") as string
    const file = await getFileById(fileId, user.id)
    if (!file) throw new Error("File not found")

    // Create transaction
    const organization = await ensureActiveOrganization(user)
    const accountingSuggestion = validatedForm.data.accountingSuggestion as AccountingSuggestion | null
    const duplicate = await findLikelyDuplicateTransaction(user.id, validatedForm.data)
    if (duplicate) {
      return {
        success: false,
        error: `Likely duplicate found: ${duplicate.name || duplicate.merchant || "existing transaction"} for the same amount and date. Review existing transactions before posting.`,
      }
    }

    const transaction = await createTransaction(user.id, validatedForm.data)

    let journalEntryId: string | undefined
    if (accountingSuggestion) {
      const journalEntry = await postReceiptAnalysisJournalEntry({
        organizationId: organization.id,
        createdById: user.id,
        transactionId: transaction.id,
        paymentMethodId: validatedForm.data.paymentMethodId,
        description: validatedForm.data.description || validatedForm.data.name || "Analyzed receipt",
        postedAt: validatedForm.data.issuedAt ? new Date(validatedForm.data.issuedAt) : new Date(),
        accountingSuggestion,
        fallbackAmount: validatedForm.data.convertedTotal || validatedForm.data.total || 0,
      })
      journalEntryId = journalEntry.id
      await createAnalysisAutomationSuggestions(organization.id, transaction.id, accountingSuggestion)
    }

    // Move file to processed location
    const userUploadsDirectory = getUserUploadsDirectory(user)
    const originalFileName = path.basename(file.path)
    const newRelativeFilePath = getTransactionFileUploadPath(file.id, originalFileName, transaction)

    // Move file to new location and name
    const oldFullFilePath = safePathJoin(userUploadsDirectory, file.path)
    const newFullFilePath = safePathJoin(userUploadsDirectory, newRelativeFilePath)
    await mkdir(path.dirname(newFullFilePath), { recursive: true })
    await rename(path.resolve(oldFullFilePath), path.resolve(newFullFilePath))

    // Update file record
    await updateFile(file.id, user.id, {
      path: newRelativeFilePath,
      isReviewed: true,
    })

    await updateTransactionFiles(transaction.id, user.id, [file.id])
    if (journalEntryId) {
      await updateTransactionJournalEntry(transaction.id, user.id, journalEntryId)
    }

    revalidatePath("/unsorted")
    revalidatePath("/transactions")
    revalidatePath("/accounting")
    revalidatePath("/accounting/journal-entries")
    revalidatePath("/reports")
    revalidatePath("/taxes/gst")

    return { success: true, data: transaction }
  } catch (error) {
    console.error("Failed to save transaction:", error)
    return { success: false, error: `Failed to save transaction: ${error}` }
  }
}

async function findLikelyDuplicateTransaction(userId: string, data: TransactionData) {
  if (!data.total || !data.issuedAt) return null
  const issuedAt = new Date(data.issuedAt)
  const dayStart = new Date(issuedAt)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(issuedAt)
  dayEnd.setHours(23, 59, 59, 999)
  const identityChecks = [
    data.merchant ? { merchant: { equals: data.merchant, mode: "insensitive" as const } } : null,
    data.name ? { name: { equals: data.name, mode: "insensitive" as const } } : null,
  ].filter((check): check is NonNullable<typeof check> => Boolean(check))
  if (identityChecks.length === 0) return null

  return prisma.transaction.findFirst({
    where: {
      userId,
      total: data.total,
      currencyCode: data.currencyCode || undefined,
      issuedAt: { gte: dayStart, lte: dayEnd },
      OR: identityChecks,
    },
  })
}

async function createAnalysisAutomationSuggestions(
  organizationId: string,
  transactionId: string,
  accountingSuggestion: AccountingSuggestion
) {
  const suggestions = accountingSuggestion.automationSuggestions || []
  await Promise.all(
    suggestions.slice(0, 10).map((suggestion) =>
      prisma.automationSuggestion
        .create({
          data: {
            organizationId,
            type: String(suggestion.type || "document_analysis"),
            title: String(suggestion.title || "Review analyzed document"),
            description: String(suggestion.description || "Review this AI-generated automation suggestion."),
            sourceType: "transaction",
            sourceId: transactionId,
            confidence: Number(suggestion.confidence || 50),
            proposedData: suggestion as Prisma.InputJsonValue,
          },
        })
        .catch(() => null)
    )
  )
}

function buildAccountingContext({
  accounts,
  taxCodes,
  paymentMethods,
}: {
  accounts: Awaited<ReturnType<typeof getLedgerAccounts>>
  taxCodes: Awaited<ReturnType<typeof getTaxCodes>>
  paymentMethods: Awaited<ReturnType<typeof getPaymentMethods>>
}) {
  return [
    "Accounting context for this Alberta Canadian print shop:",
    "Use CAD values for debits and credits. Preserve original foreign currency in the normal transaction fields.",
    "If a business purchase was paid with the owner's personal card, credit account 2310 Owing to Owner.",
    "Only use Canadian GST ITC when GST is actually charged or recoverable. Foreign supplier invoices are usually OUT_OF_SCOPE for GST unless Canadian GST is shown.",
    "",
    "Chart of accounts:",
    ...accounts.map((account) => `- ${account.code}: ${account.name} (${account.type}${account.subtype ? `/${account.subtype}` : ""})`),
    "",
    "Tax codes:",
    ...taxCodes.map((taxCode) => `- ${taxCode.code}: ${taxCode.name} (${taxCode.rateBasisPoints / 100}%)`),
    "",
    "Payment methods:",
    ...paymentMethods.map((method) => `- ${method.name}`),
    "",
    "Automation checks to consider: vendor creation/matching, duplicate receipt risk, GST review, inventory receipt, print job costing, fixed asset capitalization, owner reimbursement, payment method memory, foreign exchange notes, cash flow due dates, and document routing.",
  ].join("\n")
}


export async function deleteUnsortedFileAction(
  _prevState: ActionState<Transaction> | null,
  fileId: string
): Promise<ActionState<Transaction>> {
  try {
    const user = await getCurrentUser()
    await deleteFile(fileId, user.id)
    revalidatePath("/unsorted")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete file:", error)
    return { success: false, error: "Failed to delete file" }
  }
}

export async function splitFileIntoItemsAction(
  _prevState: ActionState<null> | null,
  formData: FormData
): Promise<ActionState<null>> {
  try {
    const user = await getCurrentUser()
    const fileId = formData.get("fileId") as string
    const items = JSON.parse(formData.get("items") as string) as TransactionData[]

    if (!fileId || !items || items.length === 0) {
      return { success: false, error: "File ID and items are required" }
    }

    // Get the original file
    const originalFile = await getFileById(fileId, user.id)
    if (!originalFile) {
      return { success: false, error: "Original file not found" }
    }

    // Get the original file's content
    const userUploadsDirectory = getUserUploadsDirectory(user)
    const originalFilePath = safePathJoin(userUploadsDirectory, originalFile.path)
    const fileContent = await readFile(originalFilePath)

    // Create a new file for each item
    for (const item of items) {
      const fileUuid = randomUUID()
      const fileName = `${originalFile.filename}-part-${item.name}`
      const relativeFilePath = unsortedFilePath(fileUuid, fileName)
      const fullFilePath = safePathJoin(userUploadsDirectory, relativeFilePath)

      // Create directory if it doesn't exist
      await mkdir(path.dirname(fullFilePath), { recursive: true })

      // Copy the original file content
      await writeFile(fullFilePath, fileContent)

      // Create file record in database with the item data cached
      await createFile(user.id, {
        id: fileUuid,
        filename: fileName,
        path: relativeFilePath,
        mimetype: originalFile.mimetype,
        metadata: originalFile.metadata,
        isSplitted: true,
        cachedParseResult: {
          name: item.name,
          merchant: item.merchant,
          description: item.description,
          total: item.total,
          currencyCode: item.currencyCode,
          categoryCode: item.categoryCode,
          projectCode: item.projectCode,
          type: item.type,
          issuedAt: item.issuedAt,
          note: item.note,
          text: item.text,
        },
      })
    }

    // Delete the original file
    await deleteFile(fileId, user.id)

    // Update user storage used
    const storageUsed = await getDirectorySize(getUserUploadsDirectory(user))
    await updateUser(user.id, { storageUsed })

    revalidatePath("/unsorted")
    return { success: true }
  } catch (error) {
    console.error("Failed to split file into items:", error)
    return { success: false, error: `Failed to split file into items: ${error}` }
  }
}
