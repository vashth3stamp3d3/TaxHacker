import { prisma } from "@/lib/db"
import { User } from "@/prisma/client"
import { cache } from "react"

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
  ["2100", "GST Collected Payable", "liability", "tax", "credit"],
  ["2110", "GST Remittance Payable", "liability", "tax", "credit"],
  ["2200", "Payroll Liabilities", "liability", "payroll", "credit"],
  ["2300", "Credit Card Payable", "liability", "credit_card", "credit"],
  ["2310", "Owing to Owner", "liability", "owner_reimbursement", "credit"],
  ["2400", "Loans Payable", "liability", "loan", "credit"],
  ["2500", "Customer Deposits", "liability", "deferred_revenue", "credit"],
  ["3000", "Owner Capital", "equity", "capital", "credit"],
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
    await seedOrganizationDefaultsIfNeeded(existing.id)
    return existing
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
        name: user.businessName || "Alberta Print Shop",
        legalName: user.businessName || "Alberta Print Shop",
        tradeName: user.businessName || "Alberta Print Shop",
        province: "AB",
        country: "CA",
        baseCurrency: "CAD",
        fiscalYearStartMonth: 1,
        gstRemittanceFrequency: "quarterly",
        address: user.businessAddress,
        members: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
      },
    })
  })

  await seedOrganizationDefaults(organization.id)
  return organization
}

async function seedOrganizationDefaultsIfNeeded(organizationId: string) {
  const [ownerPayable, personalCard] = await Promise.all([
    prisma.ledgerAccount.findUnique({ where: { organizationId_code: { organizationId, code: "2310" } } }),
    prisma.paymentMethod.findUnique({ where: { organizationId_name: { organizationId, name: "Personal Card - Owner" } } }),
  ])

  if (!ownerPayable || !personalCard) {
    await seedOrganizationDefaults(organizationId)
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

  await ensureCurrentFiscalYear(organizationId)
}

async function ensureCurrentFiscalYear(organizationId: string) {
  const year = new Date().getFullYear()
  const startsAt = new Date(Date.UTC(year, 0, 1))
  const endsAt = new Date(Date.UTC(year, 11, 31, 23, 59, 59))

  const fiscalYear = await prisma.fiscalYear.upsert({
    where: { organizationId_name: { organizationId, name: `${year}` } },
    update: { startsAt, endsAt },
    create: { organizationId, name: `${year}`, startsAt, endsAt },
  })

  await Promise.all(
    Array.from({ length: 12 }).map((_, index) => {
      const month = index + 1
      const periodStart = new Date(Date.UTC(year, index, 1))
      const periodEnd = new Date(Date.UTC(year, index + 1, 0, 23, 59, 59))
      const name = `${year}-${String(month).padStart(2, "0")}`

      return prisma.accountingPeriod.upsert({
        where: { organizationId_name: { organizationId, name } },
        update: { startsAt: periodStart, endsAt: periodEnd, fiscalYearId: fiscalYear.id },
        create: { organizationId, fiscalYearId: fiscalYear.id, name, startsAt: periodStart, endsAt: periodEnd },
      })
    })
  )

  await Promise.all(
    [0, 3, 6, 9].map((month) => {
      const startsAt = new Date(Date.UTC(year, month, 1))
      const endsAt = new Date(Date.UTC(year, month + 3, 0, 23, 59, 59))
      const dueAt = new Date(Date.UTC(year, month + 4, 0, 23, 59, 59))

      return prisma.taxFilingPeriod.create({
        data: { organizationId, taxType: "GST", startsAt, endsAt, dueAt },
      }).catch(() => null)
    })
  )
}
