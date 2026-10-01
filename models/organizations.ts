import { prisma } from "@/lib/db"
import { SEEDED_FISCAL_YEARS, WORKING_YEARS } from "@/lib/working-year"
import { User } from "@/prisma/client"
import { cache } from "react"

export const FORMULATED_PRINTS_IDENTITY = {
  name: "Formulated Prints",
  legalName: "Formulated Prints Inc.",
  tradeName: "Formulated Prints",
  entityType: "canadian_corporation",
  province: "AB",
  country: "CA",
  baseCurrency: "CAD",
  fiscalYearStartMonth: 1,
  gstRemittanceFrequency: "quarterly",
  ownerDisplayName: "Jerrold Jacobe",
  businessNumber: "796765758RC0001",
  phone: "(587) 889-3235",
} as const

const STARTER_SEQUENCES = [
  ["journal_entry", "JE-"],
  ["quote", "Q-"],
  ["sales_order", "SO-"],
  ["print_job", "JOB-"],
  ["customer_invoice", "INV-"],
  ["purchase_order", "PO-"],
  ["goods_receipt", "GR-"],
  ["vendor_bill", "BILL-"],
  ["credit_memo", "CM-"],
] as const

const STARTER_UNITS = [
  ["each", "Each", 0],
  ["sheet", "Sheet", 0],
  ["roll", "Roll", 0],
  ["hour", "Hour", 2],
] as const

const STARTER_ACCOUNTS = [
  ["1000", "Operating Cash", "asset", "cash", "debit"],
  ["1010", "Savings", "asset", "cash", "debit"],
  ["1020", "Undeposited Funds", "asset", "cash", "debit"],
  ["1100", "Accounts Receivable", "asset", "current_asset", "debit"],
  ["1160", "GST Input Tax Credits Receivable", "asset", "tax", "debit"],
  ["1200", "Paper Inventory", "asset", "inventory", "debit"],
  ["1210", "Ink and Toner Inventory", "asset", "inventory", "debit"],
  ["1220", "Supplies Inventory", "asset", "inventory", "debit"],
  ["1300", "Work in Process", "asset", "wip", "debit"],
  ["1400", "Finished Goods", "asset", "inventory", "debit"],
  ["1500", "Prepaid Expenses", "asset", "prepaid", "debit"],
  ["1600", "Equipment", "asset", "fixed_asset", "debit"],
  ["1690", "Accumulated Depreciation", "asset", "contra_asset", "credit"],
  ["2000", "Accounts Payable", "liability", "current_liability", "credit"],
  ["2010", "Inventory Received Not Invoiced", "liability", "grni", "credit"],
  ["2100", "GST Collected Payable", "liability", "tax", "credit"],
  ["2110", "GST Remittance Payable", "liability", "tax", "credit"],
  ["2200", "Payroll Liabilities", "liability", "payroll", "credit"],
  ["2210", "Income Taxes Payable", "liability", "tax", "credit"],
  ["2300", "Credit Card Payable", "liability", "credit_card", "credit"],
  ["2310", "Shareholder Loan - Jerrold", "liability", "owner_reimbursement", "credit"],
  ["2400", "Loans Payable", "liability", "loan", "credit"],
  ["2500", "Customer Deposits", "liability", "deferred_revenue", "credit"],
  ["3000", "Common Shares", "equity", "capital", "credit"],
  ["3100", "Retained Earnings", "equity", "retained_earnings", "credit"],
  ["3200", "Current Year Earnings", "equity", "current_earnings", "credit"],
  ["4000", "Print Sales", "revenue", "sales", "credit"],
  ["4100", "Design Services", "revenue", "services", "credit"],
  ["4200", "Rush Fees", "revenue", "fees", "credit"],
  ["4300", "Shipping Income", "revenue", "shipping", "credit"],
  ["4900", "Discounts and Returns", "revenue", "contra_revenue", "debit"],
  ["5000", "Paper Cost", "cogs", "materials", "debit"],
  ["5010", "Ink and Toner Cost", "cogs", "materials", "debit"],
  ["5020", "Outsourced Production", "cogs", "outsourcing", "debit"],
  ["5030", "Direct Labor", "cogs", "labor", "debit"],
  ["5040", "Shipping Cost", "cogs", "shipping", "debit"],
  ["5050", "Spoilage and Waste", "cogs", "waste", "debit"],
  ["5100", "Supplies Expense", "expense", "supplies", "debit"],
  ["6000", "Rent", "expense", "occupancy", "debit"],
  ["6010", "Utilities", "expense", "occupancy", "debit"],
  ["6020", "Software", "expense", "software", "debit"],
  ["6030", "Repairs and Maintenance", "expense", "repairs", "debit"],
  ["6040", "Office Supplies", "expense", "office", "debit"],
  ["6050", "Marketing", "expense", "marketing", "debit"],
  ["6060", "Insurance", "expense", "insurance", "debit"],
  ["6070", "Bank Fees", "expense", "bank_fees", "debit"],
  ["6080", "Professional Fees", "expense", "professional", "debit"],
  ["6090", "Depreciation", "expense", "depreciation", "debit"],
] as const

export const getActiveOrganization = cache(async (userId: string) => {
  return prisma.organization.findFirst({
    where: {
      members: {
        some: {
          userId,
          isActive: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  })
})

export async function ensureActiveOrganization(user: User) {
  const existing = await getActiveOrganization(user.id)
  if (existing) {
    const updated = await applyFormulatedPrintsIdentity(existing.id, user)
    await seedOrganizationDefaultsIfNeeded(existing.id)
    return updated
  }

  const organization = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.id}))`

    const existingInsideLock = await tx.organization.findFirst({
      where: {
        members: {
          some: {
            userId: user.id,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })
    if (existingInsideLock) return existingInsideLock

    return tx.organization.create({
      data: {
        name: user.businessName || FORMULATED_PRINTS_IDENTITY.name,
        legalName: user.businessName || FORMULATED_PRINTS_IDENTITY.legalName,
        tradeName: user.businessName || FORMULATED_PRINTS_IDENTITY.tradeName,
        entityType: FORMULATED_PRINTS_IDENTITY.entityType,
        province: FORMULATED_PRINTS_IDENTITY.province,
        country: FORMULATED_PRINTS_IDENTITY.country,
        baseCurrency: FORMULATED_PRINTS_IDENTITY.baseCurrency,
        fiscalYearStartMonth: FORMULATED_PRINTS_IDENTITY.fiscalYearStartMonth,
        gstRemittanceFrequency: FORMULATED_PRINTS_IDENTITY.gstRemittanceFrequency,
        ownerDisplayName: user.name || FORMULATED_PRINTS_IDENTITY.ownerDisplayName,
        address: user.businessAddress,
        members: {
          create: {
            userId: user.id,
            role: "superuser",
          },
        },
      },
    })
  })

  const identified = await applyFormulatedPrintsIdentity(organization.id, user)
  await seedOrganizationDefaults(identified.id)
  return identified
}

async function seedOrganizationDefaultsIfNeeded(organizationId: string) {
  const [ownerPayable, personalCard, grni] = await Promise.all([
    prisma.ledgerAccount.findUnique({ where: { organizationId_code: { organizationId, code: "2310" } } }),
    prisma.paymentMethod.findUnique({ where: { organizationId_name: { organizationId, name: "Personal Card - Owner" } } }),
    prisma.ledgerAccount.findUnique({ where: { organizationId_code: { organizationId, code: "2010" } } }),
  ])

  if (!ownerPayable || !personalCard || !grni) {
    await seedOrganizationDefaults(organizationId)
    return
  }

  const fiscalYear2025 = await prisma.fiscalYear.findUnique({
    where: { organizationId_name: { organizationId, name: "2025" } },
  })
  const fiscalYear2026 = await prisma.fiscalYear.findUnique({
    where: { organizationId_name: { organizationId, name: "2026" } },
  })
  if (!fiscalYear2025 || !fiscalYear2026 || fiscalYear2025.isClosed || fiscalYear2026.isClosed) {
    await ensureFiscalYears(organizationId)
  }
}

export async function seedOrganizationDefaults(organizationId: string) {
  await Promise.all(
    STARTER_ACCOUNTS.map(([code, name, type, subtype, normalBalance]) =>
      prisma.ledgerAccount.upsert({
        where: { organizationId_code: { organizationId, code } },
        update: { name, type, subtype, normalBalance, isSystem: true },
        create: { organizationId, code, name, type, subtype, normalBalance, isSystem: true },
      })
    )
  )

  const [gstPayable, gstReceivable, cashAccount, creditCardPayable, ownerPayable] = await Promise.all([
    prisma.ledgerAccount.findUnique({ where: { organizationId_code: { organizationId, code: "2100" } } }),
    prisma.ledgerAccount.findUnique({ where: { organizationId_code: { organizationId, code: "1160" } } }),
    prisma.ledgerAccount.findUnique({ where: { organizationId_code: { organizationId, code: "1000" } } }),
    prisma.ledgerAccount.findUnique({ where: { organizationId_code: { organizationId, code: "2300" } } }),
    prisma.ledgerAccount.findUnique({ where: { organizationId_code: { organizationId, code: "2310" } } }),
  ])

  await Promise.all([
    prisma.taxCode.upsert({
      where: { organizationId_code: { organizationId, code: "GST_5_COLLECTED" } },
      update: {
        rateBasisPoints: 500,
        liabilityAccountId: gstPayable?.id,
      },
      create: {
        organizationId,
        code: "GST_5_COLLECTED",
        name: "GST 5% Collected",
        taxType: "GST",
        rateBasisPoints: 500,
        recoverableBasisPoints: 0,
        liabilityAccountId: gstPayable?.id,
      },
    }),
    prisma.taxCode.upsert({
      where: { organizationId_code: { organizationId, code: "GST_5_ITC" } },
      update: {
        rateBasisPoints: 500,
        recoverableBasisPoints: 500,
        receivableAccountId: gstReceivable?.id,
      },
      create: {
        organizationId,
        code: "GST_5_ITC",
        name: "GST 5% Input Tax Credit",
        taxType: "GST",
        rateBasisPoints: 500,
        recoverableBasisPoints: 500,
        receivableAccountId: gstReceivable?.id,
      },
    }),
    prisma.taxCode.upsert({
      where: { organizationId_code: { organizationId, code: "ZERO_RATED" } },
      update: {},
      create: { organizationId, code: "ZERO_RATED", name: "Zero-rated", rateBasisPoints: 0 },
    }),
    prisma.taxCode.upsert({
      where: { organizationId_code: { organizationId, code: "EXEMPT" } },
      update: {},
      create: { organizationId, code: "EXEMPT", name: "Exempt", rateBasisPoints: 0 },
    }),
    prisma.taxCode.upsert({
      where: { organizationId_code: { organizationId, code: "OUT_OF_SCOPE" } },
      update: {},
      create: { organizationId, code: "OUT_OF_SCOPE", name: "Out of scope", rateBasisPoints: 0 },
    }),
  ])

  await Promise.all([
    prisma.provinceTaxProfile.upsert({
      where: { organizationId_province_taxType: { organizationId, province: "AB", taxType: "GST" } },
      update: { rateBasisPoints: 500, isDefault: true },
      create: { organizationId, province: "AB", taxType: "GST", rateBasisPoints: 500, isDefault: true },
    }),
    prisma.salesTaxRegistration.create({
      data: { organizationId, taxType: "GST", province: "AB", rateBasisPoints: 500 },
    }).catch(() => null),
    cashAccount
      ? prisma.bankAccount.create({
          data: {
            organizationId,
            ledgerAccountId: cashAccount.id,
            name: "Operating Cash",
            currencyCode: "CAD",
          },
        }).catch(() => null)
      : Promise.resolve(null),
    cashAccount
      ? prisma.paymentMethod.upsert({
          where: { organizationId_name: { organizationId, name: "Company Operating Cash" } },
          update: { clearingAccountId: cashAccount.id, isActive: true },
          create: {
            organizationId,
            name: "Company Operating Cash",
            clearingAccountId: cashAccount.id,
          },
        })
      : Promise.resolve(null),
    creditCardPayable
      ? prisma.paymentMethod.upsert({
          where: { organizationId_name: { organizationId, name: "Company Credit Card" } },
          update: { clearingAccountId: creditCardPayable.id, isActive: true },
          create: {
            organizationId,
            name: "Company Credit Card",
            clearingAccountId: creditCardPayable.id,
          },
        })
      : Promise.resolve(null),
    ownerPayable
      ? prisma.paymentMethod.upsert({
          where: { organizationId_name: { organizationId, name: "Personal Card - Owner" } },
          update: { clearingAccountId: ownerPayable.id, isActive: true },
          create: {
            organizationId,
            name: "Personal Card - Owner",
            clearingAccountId: ownerPayable.id,
          },
        })
      : Promise.resolve(null),
  ])

  await Promise.all(
    STARTER_SEQUENCES.map(([code, prefix]) =>
      prisma.numberSequence.upsert({
        where: { organizationId_code: { organizationId, code } },
        update: { prefix },
        create: { organizationId, code, prefix },
      })
    )
  )

  await Promise.all(
    STARTER_UNITS.map(([code, name, precision]) =>
      prisma.unitOfMeasure.upsert({
        where: { organizationId_code: { organizationId, code } },
        update: { name, precision },
        create: { organizationId, code, name, precision },
      })
    )
  )

  await prisma.warehouse.upsert({
    where: { organizationId_code: { organizationId, code: "MAIN" } },
    update: { name: "Main Shop", isDefault: true },
    create: { organizationId, code: "MAIN", name: "Main Shop", isDefault: true },
  })

  await ensureFiscalYears(organizationId)
}

export async function applyFormulatedPrintsIdentity(organizationId: string, user?: User) {
  const organization = await prisma.organization.findUnique({ where: { id: organizationId } })
  if (!organization) throw new Error("Organization not found")

  const placeholderNames = new Set(["Alberta Print Shop", "Alberta print shop", ""])
  const shouldRename = placeholderNames.has(organization.name)
  const shouldRenameLegal = placeholderNames.has(organization.legalName || "")
  const shouldRenameTrade = placeholderNames.has(organization.tradeName || "")
  const membership = user
    ? await prisma.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId, userId: user.id } },
      })
    : null
  const needsIdentityUpdate =
    shouldRename ||
    shouldRenameLegal ||
    shouldRenameTrade ||
    !organization.legalName ||
    organization.entityType !== FORMULATED_PRINTS_IDENTITY.entityType ||
    organization.country !== "CA" ||
    organization.province !== "AB" ||
    !organization.ownerDisplayName ||
    organization.businessNumber !== FORMULATED_PRINTS_IDENTITY.businessNumber ||
    organization.gstHstRegistrationNumber !== FORMULATED_PRINTS_IDENTITY.businessNumber

  const updated = needsIdentityUpdate
    ? await prisma.organization.update({
        where: { id: organizationId },
        data: {
          name: shouldRename ? FORMULATED_PRINTS_IDENTITY.name : organization.name,
          legalName: shouldRenameLegal || !organization.legalName ? FORMULATED_PRINTS_IDENTITY.legalName : organization.legalName,
          tradeName: shouldRenameTrade || !organization.tradeName ? FORMULATED_PRINTS_IDENTITY.tradeName : organization.tradeName,
          entityType: FORMULATED_PRINTS_IDENTITY.entityType,
          province: "AB",
          country: "CA",
          baseCurrency: "CAD",
          fiscalYearStartMonth: organization.fiscalYearStartMonth || 1,
          gstRemittanceFrequency: organization.gstRemittanceFrequency || "quarterly",
          ownerDisplayName: organization.ownerDisplayName || user?.name || FORMULATED_PRINTS_IDENTITY.ownerDisplayName,
          businessNumber: FORMULATED_PRINTS_IDENTITY.businessNumber,
          gstHstRegistrationNumber: FORMULATED_PRINTS_IDENTITY.businessNumber,
          phone: organization.phone || FORMULATED_PRINTS_IDENTITY.phone,
        },
      })
    : organization

  if (user && membership && membership.role !== "superuser") {
    await prisma.organizationMember.updateMany({
      where: { organizationId, userId: user.id },
      data: { role: "superuser", isActive: true },
    })
  }

  return updated
}

export async function getWorkingFiscalYears(organizationId: string) {
  return prisma.fiscalYear.findMany({
    where: { organizationId, name: { in: WORKING_YEARS.map(String) } },
    orderBy: { startsAt: "asc" },
  })
}

export async function getLedgerBalanceSnapshots(organizationId: string, year?: number) {
  return prisma.ledgerBalanceSnapshot.findMany({
    where: { organizationId, ...(year ? { year } : {}) },
    orderBy: [{ year: "asc" }, { asOf: "asc" }, { kind: "asc" }],
  })
}

export async function ensureFiscalYears(organizationId: string, years: readonly number[] = SEEDED_FISCAL_YEARS) {
  for (const year of years) {
    const startsAt = new Date(Date.UTC(year, 0, 1))
    const endsAt = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
    const keepOpen = WORKING_YEARS.includes(year as (typeof WORKING_YEARS)[number])

    const fiscalYear = await prisma.fiscalYear.upsert({
      where: { organizationId_name: { organizationId, name: `${year}` } },
      update: keepOpen ? { startsAt, endsAt, isClosed: false } : { startsAt, endsAt },
      create: { organizationId, name: `${year}`, startsAt, endsAt, isClosed: false },
    })

    await Promise.all(
      Array.from({ length: 12 }).map((_, index) => {
        const month = index + 1
        const periodStart = new Date(Date.UTC(year, index, 1))
        const periodEnd = new Date(Date.UTC(year, index + 1, 0, 23, 59, 59, 999))
        const name = `${year}-${String(month).padStart(2, "0")}`

        return prisma.accountingPeriod.upsert({
          where: { organizationId_name: { organizationId, name } },
          update: { startsAt: periodStart, endsAt: periodEnd, fiscalYearId: fiscalYear.id },
          create: {
            organizationId,
            fiscalYearId: fiscalYear.id,
            name,
            startsAt: periodStart,
            endsAt: periodEnd,
            isClosed: false,
          },
        })
      })
    )

    await Promise.all(
      [0, 3, 6, 9].map((month) => {
        const periodStartsAt = new Date(Date.UTC(year, month, 1))
        const periodEndsAt = new Date(Date.UTC(year, month + 3, 0, 23, 59, 59, 999))
        const dueAt = new Date(Date.UTC(year, month + 4, 0, 23, 59, 59, 999))

        return prisma.taxFilingPeriod
          .create({
            data: { organizationId, taxType: "GST", startsAt: periodStartsAt, endsAt: periodEndsAt, dueAt },
          })
          .catch(() => null)
      })
    )
  }
}
