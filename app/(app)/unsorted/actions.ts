"use server"

import { transactionFormSchema } from "@/forms/transactions"
import { ActionState } from "@/lib/actions"
import { prisma } from "@/lib/db"
import {
  getDirectorySize,
  getTransactionFileUploadPath,
  getUserUploadsDirectory,
  safePathJoin,
  unsortedFilePath,
} from "@/lib/files"
import { type DocumentDestination } from "@/lib/tax/gst"
import { AccountingSuggestion, postReceiptAnalysisJournalEntry } from "@/models/accounting"
import { requirePortalContext } from "@/models/access"
import { createCustomer, createCustomerInvoiceWithPosting, createVendor, createVendorBillWithPosting } from "@/models/commerce"
import { attachDocument, findExistingSourceDocument, matchCustomerByName, matchVendorByName, saveDocumentClassification } from "@/models/documents"
import { createFile, deleteFile, getFileById, updateFile } from "@/models/files"
import { createInventoryItem, getItems, getWarehouses, receiveInboxInventory } from "@/models/inventory"
import {
  createTransaction,
  TransactionData,
  updateTransactionFiles,
  updateTransactionJournalEntry,
  findDuplicateTransaction,
} from "@/models/transactions"
import { updateUser } from "@/models/users"
import { Prisma, Transaction, User } from "@/prisma/client"
import { randomUUID } from "crypto"
import { mkdir, readFile, rename, writeFile } from "fs/promises"
import { revalidatePath } from "next/cache"
import path from "path"

export async function saveFileAsTransactionAction(
  _prevState: ActionState<Transaction> | null,
  formData: FormData
): Promise<ActionState<Transaction>> {
  try {
    const { user, organization } = await requirePortalContext("inbox_review")
    const validatedForm = transactionFormSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedForm.success) {
      return { success: false, error: validatedForm.error.message }
    }

    const fileId = formData.get("fileId") as string
    const file = await getFileById(fileId, user.id)
    if (!file) throw new Error("File not found")

    const existingSource = await findExistingSourceDocument(organization.id, file.id)
    if (existingSource) {
      return { success: false, error: "This file has already been booked into the ERP." }
    }

    const forceSave = formData.get("forceSave") === "true"
    const destination = (String(formData.get("destination") || "paid_expense") || "paid_expense") as DocumentDestination
    const transactionData = {
      ...validatedForm.data,
      organizationId: organization.id,
      sourceFileId: file.id,
      destinationType: destination,
      postsToLedger: destination === "paid_expense",
    }

    if (!forceSave && destination === "paid_expense") {
      const existingTransaction = await findDuplicateTransaction(user.id, transactionData)
      if (existingTransaction) {
        return {
          success: false,
          error: "DUPLICATE_FOUND",
          duplicateData: {
            existingTransaction: existingTransaction,
            newTransactionData: transactionData,
            resumeIndex: 0,
          },
        }
      }
    }

    const merchant = transactionData.merchant || transactionData.name || "Unknown party"
    const amount = transactionData.convertedTotal || transactionData.total || 0
    const accountingSuggestion = transactionData.accountingSuggestion as AccountingSuggestion | null
    let vendorBillId: string | undefined
    let customerInvoiceId: string | undefined
    let goodsReceiptId: string | undefined
    let journalEntryId: string | undefined

    if (destination === "vendor_bill") {
      const vendor =
        (await matchVendorByName(organization.id, merchant)) ||
        (await createVendor(organization.id, { name: merchant }))
      const bill = await createVendorBillWithPosting({
        organizationId: organization.id,
        vendorId: vendor.id,
        createdById: user.id,
        description: transactionData.description || transactionData.name || merchant,
        taxableAmount: amount,
        sourceFileId: file.id,
      })
      vendorBillId = bill.id
    } else if (destination === "customer_invoice") {
      const customer =
        (await matchCustomerByName(organization.id, merchant)) ||
        (await createCustomer(organization.id, { name: merchant }))
      const invoice = await createCustomerInvoiceWithPosting({
        organizationId: organization.id,
        customerId: customer.id,
        createdById: user.id,
        description: transactionData.description || transactionData.name || merchant,
        taxableAmount: amount,
        sourceFileId: file.id,
      })
      customerInvoiceId = invoice.id
    } else if (destination === "inventory_receipt") {
      const warehouses = await getWarehouses(organization.id)
      const warehouseId = String(formData.get("warehouseId") || warehouses[0]?.id || "")
      if (!warehouseId) throw new Error("Create a warehouse before booking inventory receipts")
      let itemId = String(formData.get("itemId") || "")
      if (!itemId) {
        const items = await getItems(organization.id)
        const matched = items.find((item) => item.name.toLowerCase() === merchant.toLowerCase())
        const created = matched || (await createInventoryItem(organization.id, {
          sku: `INBOX-${Date.now()}`,
          name: merchant,
          standardCost: amount,
        }))
        itemId = created.id
      }
      const received = await receiveInboxInventory({
        organizationId: organization.id,
        itemId,
        warehouseId,
        quantity: Math.max(1, Number(formData.get("quantity") || 1)),
        unitCost: amount,
        createdById: user.id,
        sourceFileId: file.id,
      })
      goodsReceiptId = received.receipt.id
    } else {
      const transaction = await createTransaction(user.id, transactionData)
      if (accountingSuggestion) {
        const journalEntry = await postReceiptAnalysisJournalEntry({
          organizationId: organization.id,
          createdById: user.id,
          transactionId: transaction.id,
          paymentMethodId: transactionData.paymentMethodId,
          description: transactionData.description || transactionData.name || "Analyzed receipt",
          postedAt: transactionData.issuedAt ? new Date(transactionData.issuedAt) : new Date(),
          accountingSuggestion,
          fallbackAmount: amount,
        })
        journalEntryId = journalEntry.id
        await createAnalysisAutomationSuggestions(organization.id, transaction.id, accountingSuggestion)
      }
      return await finalizeInboxFile({
        user,
        organizationId: organization.id,
        file,
        transaction,
        journalEntryId,
        destination,
      })
    }

    const archive = await createTransaction(user.id, {
      ...transactionData,
      postsToLedger: false,
      vendorBillId,
      customerInvoiceId,
      goodsReceiptId,
    })

    return await finalizeInboxFile({
      user,
      organizationId: organization.id,
      file,
      transaction: archive,
      destination,
      vendorBillId,
      customerInvoiceId,
      goodsReceiptId,
    })
  } catch (error) {
    console.error("Failed to save transaction:", error)
    return { success: false, error: `Failed to save transaction: ${error}` }
  }
}

async function finalizeInboxFile({
  user,
  organizationId,
  file,
  transaction,
  journalEntryId,
  destination,
  vendorBillId,
  customerInvoiceId,
  goodsReceiptId,
}: {
  user: User
  organizationId: string
  file: { id: string; path: string; filename: string }
  transaction: Transaction
  journalEntryId?: string
  destination: string
  vendorBillId?: string
  customerInvoiceId?: string
  goodsReceiptId?: string
}) {
  const userUploadsDirectory = getUserUploadsDirectory(user)
  const originalFileName = path.basename(file.path)
  const newRelativeFilePath = getTransactionFileUploadPath(file.id, originalFileName, transaction)
  const oldFullFilePath = safePathJoin(userUploadsDirectory, file.path)
  const newFullFilePath = safePathJoin(userUploadsDirectory, newRelativeFilePath)
  await mkdir(path.dirname(newFullFilePath), { recursive: true })
  await rename(path.resolve(oldFullFilePath), path.resolve(newFullFilePath))

  await updateFile(file.id, user.id, {
    path: newRelativeFilePath,
    isReviewed: true,
    organizationId,
  })
  await updateTransactionFiles(transaction.id, user.id, [file.id])
  if (journalEntryId) {
    await updateTransactionJournalEntry(transaction.id, user.id, journalEntryId)
  }

  await attachDocument({
    organizationId,
    fileId: file.id,
    transactionId: transaction.id,
    vendorBillId,
    customerInvoiceId,
    goodsReceiptId,
  })
  await saveDocumentClassification({
    organizationId,
    fileId: file.id,
    documentType: destination === "paid_expense" ? "receipt" : destination,
    partyName: transaction.merchant,
    extractedData: { destination },
  })

  revalidatePath("/unsorted")
  revalidatePath("/transactions")
  revalidatePath("/accounting")
  revalidatePath("/accounting/journal-entries")
  revalidatePath("/reports")
  revalidatePath("/taxes/gst")
  revalidatePath("/taxes/t2")
  revalidatePath("/sales")
  revalidatePath("/purchasing")
  revalidatePath("/inventory")
  revalidatePath("/dashboard")

  return { success: true, data: transaction }
}

export const completeInboxReviewAction = saveFileAsTransactionAction



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

export async function deleteUnsortedFileAction(
  _prevState: ActionState<Transaction> | null,
  fileId: string
): Promise<ActionState<Transaction>> {
  try {
    const { user } = await requirePortalContext("inbox_review")
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
    const { user, organization } = await requirePortalContext("inbox_review")
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
        organizationId: organization.id,
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
