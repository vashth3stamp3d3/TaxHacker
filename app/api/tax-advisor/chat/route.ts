import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { getCurrentUser } from "@/lib/auth"
import config from "@/lib/config"
import { errorMessage, logError, logInfo } from "@/lib/logger"
import { retrieveCraExcerpts } from "@/lib/tax-advisor/cra-corpus"
import { getLLMSettings, getSettings } from "@/models/settings"
import { NextRequest, NextResponse } from "next/server"

const TAX_ADVISOR_MODEL = "gemini-2.5-flash"
const MAX_MESSAGE_CHARS = 3000
const MAX_PAGE_CONTEXT_CHARS = 6000

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

type PageContext = {
  url?: string
  title?: string
  selectedText?: string
  visibleText?: string
}

function trimText(value: unknown, maxLength: number) {
  return String(value || "").slice(0, maxLength)
}

function contentToText(content: unknown) {
  if (typeof content === "string") return content
  if (Array.isArray(content)) {
    return content.map((part: any) => part?.text || "").join("")
  }
  return ""
}

function buildPageContext(pageContext: PageContext) {
  return [
    `URL: ${trimText(pageContext.url, 500)}`,
    `Title: ${trimText(pageContext.title, 300)}`,
    pageContext.selectedText ? `Selected text: ${trimText(pageContext.selectedText, 1500)}` : "",
    `Visible page text: ${trimText(pageContext.visibleText, MAX_PAGE_CONTEXT_CHARS)}`,
  ]
    .filter(Boolean)
    .join("\n")
}

function buildPrompt(messages: ChatMessage[], pageContext: string, craContext: string) {
  const conversation = messages
    .slice(-8)
    .map((message) => `${message.role === "user" ? "User" : "Advisor"}: ${trimText(message.content, MAX_MESSAGE_CHARS)}`)
    .join("\n\n")

  return [
    "You are the Formulated Tax Canadian tax advisor for an Alberta corporate print shop ERP.",
    "Use the supplied CRA excerpts first, and cite the CRA guide title/source in practical language.",
    "Be clear about whether guidance is about corporation income tax, GST/HST, payroll/source deductions, taxable benefits, or bookkeeping operations.",
    "Alberta has GST at 5% and no HST/PST. Do not invent provincial sales tax rules for Alberta.",
    "Give practical feedback based on the current page context, but do not claim to provide final legal, tax, or accounting sign-off.",
    "If the issue is high-risk, ambiguous, or outside the excerpts, say what to verify with CRA or a CPA.",
    "",
    "Current app page context:",
    pageContext || "No page context was captured.",
    "",
    "Relevant CRA reference excerpts:",
    craContext || "No matching CRA excerpt was retrieved. Answer cautiously and recommend checking CRA guidance directly.",
    "",
    "Conversation:",
    conversation,
  ].join("\n")
}

export async function POST(request: NextRequest) {
  let userId: string | undefined

  try {
    const user = await getCurrentUser()
    userId = user.id
    const body = await request.json()
    const messages = Array.isArray(body.messages) ? (body.messages as ChatMessage[]) : []
    const latestMessage = messages.filter((message) => message.role === "user").at(-1)
    const pageContext = buildPageContext((body.pageContext || {}) as PageContext)

    if (!latestMessage?.content?.trim()) {
      return NextResponse.json({ error: "Ask a tax question first." }, { status: 400 })
    }

    const settings = await getSettings(user.id)
    const googleSettings = getLLMSettings(settings).providers.find((provider) => provider.provider === "google")
    const apiKey = googleSettings?.apiKey || config.ai.googleApiKey

    logInfo("tax_advisor.chat.start", {
      userId: user.id,
      model: TAX_ADVISOR_MODEL,
      hasApiKey: Boolean(apiKey),
      messageCount: messages.length,
      pageContextLength: pageContext.length,
    })

    if (!apiKey) {
      logError("tax_advisor.gemini.missing_key", { userId: user.id, model: TAX_ADVISOR_MODEL })
      return NextResponse.json({ error: "Google API key is not configured for the tax advisor." }, { status: 400 })
    }

    const excerpts = await retrieveCraExcerpts(latestMessage.content, pageContext)
    const craContext = excerpts
      .map(
        (excerpt, index) =>
          `[${index + 1}] ${excerpt.title} (${excerpt.sourceUrl})\n${excerpt.text}`
      )
      .join("\n\n")

    logInfo("tax_advisor.retrieval", {
      userId: user.id,
      model: TAX_ADVISOR_MODEL,
      excerptCount: excerpts.length,
      sources: excerpts.map((excerpt) => ({
        guideId: excerpt.guideId,
        chunkIndex: excerpt.chunkIndex,
        score: excerpt.score,
      })),
    })

    const model = new ChatGoogleGenerativeAI({
      apiKey,
      model: TAX_ADVISOR_MODEL,
      temperature: 0.2,
    })

    const response = await model.invoke([
      new SystemMessage("You answer as a careful Canadian tax professional using CRA guidance and the current ERP page context."),
      new HumanMessage(buildPrompt(messages, pageContext, craContext)),
    ])
    const answer = contentToText(response.content).trim()

    logInfo("tax_advisor.chat.success", {
      userId: user.id,
      model: TAX_ADVISOR_MODEL,
      excerptCount: excerpts.length,
      answerLength: answer.length,
    })

    return NextResponse.json({
      answer,
      sources: excerpts.map((excerpt) => ({
        guideId: excerpt.guideId,
        title: excerpt.title,
        sourceUrl: excerpt.sourceUrl,
      })),
    })
  } catch (error) {
    logError("tax_advisor.gemini.error", {
      userId,
      model: TAX_ADVISOR_MODEL,
      error: errorMessage(error),
    })
    return NextResponse.json({ error: `Tax advisor failed: ${errorMessage(error)}` }, { status: 500 })
  }
}
