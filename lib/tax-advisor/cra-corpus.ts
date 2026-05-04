import { readFile, readdir } from "fs/promises"
import path from "path"

const GUIDE_DIR = path.join(process.cwd(), "data", "cra-guides")
const MAX_CHARS_PER_CHUNK = 1400
const CHUNK_OVERLAP = 220

export type CraExcerpt = {
  guideId: string
  title: string
  sourceUrl: string
  chunkIndex: number
  text: string
  score: number
}

type GuideDocument = {
  id: string
  title: string
  sourceUrl: string
  chunks: string[]
}

let corpusPromise: Promise<GuideDocument[]> | null = null

function frontMatterValue(contents: string, key: string) {
  const match = contents.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))
  return match?.[1]?.replace(/^"|"$/g, "").trim() || ""
}

function stripFrontMatter(contents: string) {
  return contents.replace(/^---[\s\S]*?---\s*/, "").trim()
}

function chunkText(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim()
  const chunks: string[] = []
  let start = 0

  while (start < normalized.length) {
    const end = Math.min(start + MAX_CHARS_PER_CHUNK, normalized.length)
    chunks.push(normalized.slice(start, end).trim())
    if (end === normalized.length) break
    start = Math.max(0, end - CHUNK_OVERLAP)
  }

  return chunks
}

function tokenize(value: string) {
  const stopWords = new Set([
    "about",
    "after",
    "also",
    "and",
    "are",
    "can",
    "for",
    "from",
    "has",
    "have",
    "how",
    "into",
    "our",
    "page",
    "should",
    "that",
    "the",
    "their",
    "this",
    "was",
    "what",
    "when",
    "where",
    "with",
    "you",
    "your",
  ])

  return value
    .toLowerCase()
    .match(/[a-z0-9][a-z0-9/-]{2,}/g)
    ?.filter((word) => !stopWords.has(word)) || []
}

async function loadCorpus() {
  const files = (await readdir(GUIDE_DIR)).filter((file) => file.endsWith(".md"))

  return Promise.all(
    files.map(async (file) => {
      const contents = await readFile(path.join(GUIDE_DIR, file), "utf8")
      const id = frontMatterValue(contents, "id") || file.replace(/\.md$/, "")
      const title = frontMatterValue(contents, "title") || id
      const sourceUrl = frontMatterValue(contents, "sourceUrl")

      return {
        id,
        title,
        sourceUrl,
        chunks: chunkText(stripFrontMatter(contents)),
      }
    })
  )
}

export async function retrieveCraExcerpts(query: string, pageContext: string, limit = 6): Promise<CraExcerpt[]> {
  corpusPromise ||= loadCorpus()
  const corpus = await corpusPromise
  const queryTerms = tokenize(`${query} ${pageContext}`)
  const querySet = new Set(queryTerms)

  const scored = corpus.flatMap((guide) =>
    guide.chunks.map((chunk, index) => {
      const chunkTerms = tokenize(`${guide.title} ${chunk}`)
      const score = chunkTerms.reduce((total, term) => total + (querySet.has(term) ? 1 : 0), 0)

      return {
        guideId: guide.id,
        title: guide.title,
        sourceUrl: guide.sourceUrl,
        chunkIndex: index,
        text: chunk,
        score,
      }
    })
  )

  return scored
    .filter((excerpt) => excerpt.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
