import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const OUT_DIR = path.join(process.cwd(), "data", "cra-guides")

const guides = [
  {
    id: "t4012-corporation-income-tax",
    title: "T4012 T2 Corporation Income Tax Guide",
    sourceUrl: "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4012/t2-corporation-income-tax-guide.html",
    pages: [
      "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4012/t2-corporation-income-tax-guide.html",
      "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4012/t2-corporation-income-tax-guide-chapter-1-page-1-t2-return.html",
      "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4012/t2-corporation-income-tax-guide-chapter-2-page-2-t2-return.html",
      "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4012/t2-corporation-income-tax-guide-chapter-3-page-3-t2-return.html",
      "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4012/t2-corporation-income-tax-guide-chapter-4-page-4-t2-return.html",
      "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4012/t2-corporation-income-tax-guide-chapter-5-page-5-t2-return.html",
      "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4012/t2-corporation-income-tax-guide-chapter-6-pages-6-7-t2-return.html",
      "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4012/t2-corporation-income-tax-guide-chapter-7-page-8-t2-return.html",
      "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4012/t2-corporation-income-tax-guide-chapter-8-page-9-t2-return.html",
      "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4012/t2-corporation-income-tax-guide-appendices.html",
    ],
  },
  {
    id: "rc4022-gst-hst-registrants",
    title: "RC4022 General Information for GST/HST Registrants",
    sourceUrl: "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4022/general-information-gst-hst-registrants.html",
    pages: ["https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4022/general-information-gst-hst-registrants.html"],
  },
  {
    id: "t4001-payroll-deductions",
    title: "T4001 Employers' Guide - Payroll Deductions and Remittances",
    sourceUrl: "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4001/employers-guide-payroll-deductions-remittances.html",
    pages: ["https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4001/employers-guide-payroll-deductions-remittances.html"],
  },
  {
    id: "t4130-taxable-benefits",
    title: "T4130 Employers' Guide - Taxable Benefits and Allowances",
    sourceUrl: "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4130/employers-guide-taxable-benefits-allowances.html",
    pages: ["https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4130/employers-guide-taxable-benefits-allowances.html"],
  },
  {
    id: "t4002-business-expenses",
    title: "T4002 Self-employed Business, Professional, Commission, Farming, and Fishing Income",
    sourceUrl: "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4002/t4002-1.html",
    pages: [
      "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4002/t4002-1.html",
      "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4002/t4002-5.html",
    ],
  },
]

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function htmlToText(html) {
  const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] || html
  return decodeEntities(
    main
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<h1[^>]*>/gi, "\n# ")
      .replace(/<h2[^>]*>/gi, "\n## ")
      .replace(/<h3[^>]*>/gi, "\n### ")
      .replace(/<h4[^>]*>/gi, "\n#### ")
      .replace(/<li[^>]*>/gi, "\n- ")
      .replace(/<\/(h1|h2|h3|h4|p|li|tr|table|section|div)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  )
}

async function fetchWithTimeout(url, timeoutMs = 20000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "Formulated Tax CRA guide updater",
        accept: "text/html,application/xhtml+xml",
      },
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchPage(url) {
  let lastError
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetchWithTimeout(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
      }

      return htmlToText(await response.text())
    } catch (error) {
      lastError = error
      console.warn(`Attempt ${attempt} failed for ${url}: ${error instanceof Error ? error.message : error}`)
    }
  }

  throw lastError
}

await mkdir(OUT_DIR, { recursive: true })

const fetchedAt = new Date().toISOString()
const manifest = []

for (const guide of guides) {
  console.log(`Fetching ${guide.title}`)
  const sections = []
  for (const page of guide.pages) {
    try {
      const text = await fetchPage(page)
      sections.push(`## Source page\n${page}\n\n${text}`)
    } catch (error) {
      sections.push(`## Source page\n${page}\n\nFetch failed: ${error instanceof Error ? error.message : error}`)
    }
  }

  const contents = [
    "---",
    `id: ${guide.id}`,
    `title: ${JSON.stringify(guide.title)}`,
    `sourceUrl: ${guide.sourceUrl}`,
    `fetchedAt: ${fetchedAt}`,
    "---",
    "",
    `# ${guide.title}`,
    "",
    "This local reference copy was generated from official Canada.ca CRA guidance for the Formulated Tax advisor.",
    "",
    ...sections,
    "",
  ].join("\n")

  const filename = `${guide.id}.md`
  await writeFile(path.join(OUT_DIR, filename), contents, "utf8")
  manifest.push({ ...guide, filename, fetchedAt })
}

await writeFile(path.join(OUT_DIR, "manifest.json"), `${JSON.stringify({ fetchedAt, guides: manifest }, null, 2)}\n`, "utf8")
console.log(`Wrote ${manifest.length} CRA guides to ${OUT_DIR}`)
