import { ChatOpenAI } from "@langchain/openai"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatMistralAI } from "@langchain/mistralai"
import { BaseMessage, HumanMessage } from "@langchain/core/messages"
import type { AnalyzeAttachment } from "@/ai/attachments"
import { logError, logInfo, logWarn } from "@/lib/logger"

export type LLMProvider = "openai" | "google" | "mistral" | "openai_compatible"

export interface LLMConfig {
  provider: LLMProvider
  apiKey: string
  model: string
  baseUrl?: string
  maxConcurrency?: number
}

export interface LLMSettings {
  providers: LLMConfig[]
}

export interface LLMRequest {
  prompt: string
  schema?: Record<string, unknown>
  attachments?: AnalyzeAttachment[]
}

export interface LLMResponse {
  output: Record<string, string>
  tokensUsed?: number
  provider: LLMProvider
  error?: string
}

const GEMINI_DOCUMENT_MODEL = "gemini-2.5-flash"

type LLMModel = ChatOpenAI | ChatGoogleGenerativeAI | ChatMistralAI

type MessageContent = Array<
  | { type: string; text?: string; image_url?: { url: string } }
  | { type: "media"; mimeType: string; data: string }
>

function hasDocumentAttachment(req: LLMRequest) {
  return Boolean(req.attachments?.length)
}

function attachmentToContent(att: AnalyzeAttachment, provider: LLMProvider) {
  if (provider === "google" && !att.contentType.startsWith("image/")) {
    return {
      type: "media" as const,
      mimeType: att.contentType,
      data: att.base64,
    }
  }

  return {
    type: "image_url" as const,
    image_url: {
      url: `data:${att.contentType};base64,${att.base64}`,
    },
  }
}

function extractErrorInfo(error: unknown): {
  message: string | undefined
  cause: unknown
  status: number | undefined
  errorBody: unknown
} {
  const obj = error as Record<string, unknown>
  const causeObj = obj?.cause as Record<string, unknown> | undefined
  return {
    message: typeof obj?.message === "string" ? obj.message : undefined,
    cause: obj?.cause,
    status: (obj?.status as number | undefined) ?? (causeObj?.status as number | undefined),
    errorBody: obj?.error,
  }
}

async function requestLLMUnified(config: LLMConfig, req: LLMRequest): Promise<LLMResponse> {
  try {
    const temperature = 0
    let model: LLMModel
    if (config.provider === "openai") {
      model = new ChatOpenAI({
        apiKey: config.apiKey,
        model: config.model,
        temperature: temperature,
      })
    } else if (config.provider === "google") {
      model = new ChatGoogleGenerativeAI({
        apiKey: config.apiKey,
        model: config.model,
        temperature: temperature,
      })
    } else if (config.provider === "mistral") {
      model = new ChatMistralAI({
        apiKey: config.apiKey,
        model: config.model,
        temperature: temperature,
      })
    } else if (config.provider === "openai_compatible") {
      model = new ChatOpenAI({
        apiKey: config.apiKey || "not-needed",
        model: config.model,
        temperature: temperature,
        configuration: {
          baseURL: config.baseUrl?.trim(),
        },
      })
    } else {
      return {
        output: {},
        provider: config.provider,
        error: "Unknown provider",
      }
    }

    const messageContent: MessageContent = [{ type: "text", text: req.prompt }]
    if (req.attachments && req.attachments.length > 0) {
      const attachments = req.attachments
        .filter((att) => config.provider === "google" || att.contentType.startsWith("image/"))
        .map((att) => attachmentToContent(att, config.provider))
      messageContent.push(...attachments)
    }
    const messages: BaseMessage[] = [new HumanMessage({ content: messageContent })]

    let response: Record<string, unknown>
    if (config.provider === "openai_compatible") {
      const raw = await model.invoke(messages)
      const rawContent = raw as { content: string | Array<{ text?: string }> }
      const text = typeof rawContent.content === "string"
        ? rawContent.content
        : Array.isArray(rawContent.content)
          ? rawContent.content.map((c: { text?: string }) => c.text || "").join("")
          : ""
      const cleaned = text.replace(/```(?:json)?\s*/g, "").trim()
      // Some openai-compatible models emit raw control chars (e.g. a literal
      // newline) inside JSON string values, which JSON.parse rejects. Replace
      // them with spaces so the value parses (structural whitespace is unaffected).
      response = JSON.parse(cleaned.replace(/[\u0000-\u001F]/g, " "))
    } else {
      const structuredModel = model.withStructuredOutput(req.schema!, { name: "transaction" })
      response = await structuredModel.invoke(messages) as Record<string, unknown>
    }

    return {
      output: response as Record<string, string>,
      provider: config.provider,
    }
  } catch (error: unknown) {
    const info = extractErrorInfo(error)
    const causeMsg = info.cause instanceof Error ? info.cause.message : info.cause ? String(info.cause) : null
    const status = info.status ? ` (HTTP ${info.status})` : ""
    const body = info.errorBody ? ` ${JSON.stringify(info.errorBody)}` : ""
    const detail = [
      info.message ?? `${config.provider} request failed`,
      causeMsg && causeMsg !== info.message ? `cause: ${causeMsg}` : null,
    ].filter(Boolean).join(" | ")

    console.error(`[${config.provider}] LLM request failed${status}:`, {
      message: info.message,
      status: info.status,
      cause: info.cause ?? undefined,
      ...(info.errorBody ? { body: info.errorBody } : {}),
    })

    const isVisionError =
      detail.includes("content.type") ||
      (detail.includes("image_url") && detail.includes("not supported"))

    const visionHint = isVisionError
      ? " — This model does not support image input. Use a vision-capable model or test the provider in Settings."
      : ""

    const concurrencyHint =
      info.status === 429 && (config.maxConcurrency ?? 1) > 1
        ? " — rate-limited; lower \u201cMax concurrency\u201d for this provider in LLM settings and retry"
        : ""

    return {
      output: {},
      provider: config.provider,
      error: `${detail}${status}${body}${concurrencyHint}${visionHint}`,
    }
  }
}

export interface LLMTestResult {
  success: boolean
  supportsVision: boolean
  message: string
}

const TINY_TEST_IMAGE_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

export async function testLLMProvider(config: LLMConfig): Promise<LLMTestResult> {
  try {
    const temperature = 0
    let model: LLMModel
    if (config.provider === "openai") {
      model = new ChatOpenAI({ apiKey: config.apiKey, model: config.model, temperature })
    } else if (config.provider === "google") {
      model = new ChatGoogleGenerativeAI({ apiKey: config.apiKey, model: config.model, temperature })
    } else if (config.provider === "mistral") {
      model = new ChatMistralAI({ apiKey: config.apiKey, model: config.model, temperature })
    } else if (config.provider === "openai_compatible") {
      model = new ChatOpenAI({
        apiKey: config.apiKey || "not-needed",
        model: config.model,
        temperature,
        configuration: { baseURL: config.baseUrl?.trim() },
      })
    } else {
      return { success: false, supportsVision: false, message: `Unknown provider: ${config.provider}` }
    }

    const messages: BaseMessage[] = [
      new HumanMessage({
        content: [
          { type: "text", text: "Reply with the single word: ok" },
          { type: "image_url", image_url: { url: `data:image/png;base64,${TINY_TEST_IMAGE_BASE64}` } },
        ],
      }),
    ]

    const raw = await model.invoke(messages)
    const rawContent = raw as { content: string | Array<{ text?: string }> }
    const text =
      typeof rawContent.content === "string"
        ? rawContent.content
        : Array.isArray(rawContent.content)
          ? rawContent.content.map((c: { text?: string }) => c.text || "").join("")
          : ""

    return {
      success: true,
      supportsVision: true,
      message: `Model responded: "${text.trim().slice(0, 100)}"`,
    }
  } catch (error: unknown) {
    const causeMsg =
      error instanceof Error && error.cause instanceof Error
        ? error.cause.message
        : (error as Record<string, unknown>)?.cause
          ? String((error as Record<string, unknown>).cause)
          : null
    const errorMsg = error instanceof Error ? error.message : String(error)
    const combined = [errorMsg, causeMsg].filter(Boolean).join(" | ")

    const isVisionRejection =
      combined.includes("content.type") ||
      combined.includes("image_url") ||
      (combined.includes("image") && combined.includes("not supported"))

    if (isVisionRejection) {
      return {
        success: false,
        supportsVision: false,
        message: "This model does not support image input. Invoice analysis requires a vision-capable model.",
      }
    }

    return {
      success: false,
      supportsVision: false,
      message: `Connection failed: ${combined}`,
    }
  }
}

export async function requestLLM(settings: LLMSettings, req: LLMRequest): Promise<LLMResponse> {
  const isDocumentAnalysis = hasDocumentAttachment(req)
  const providers = isDocumentAnalysis
    ? settings.providers
        .filter((config) => config.provider === "google")
        .map((config) => ({ ...config, model: GEMINI_DOCUMENT_MODEL }))
    : settings.providers

  const failures: string[] = []
  logInfo("llm.request.start", {
    documentAnalysis: isDocumentAnalysis,
    attachmentCount: req.attachments?.length || 0,
    configuredProviders: settings.providers.map((config) => ({
      provider: config.provider,
      hasApiKey: Boolean(config.apiKey),
      hasBaseUrl: Boolean(config.baseUrl),
      model: config.model || null,
    })),
    selectedProviders: providers.map((config) => ({
      provider: config.provider,
      hasApiKey: Boolean(config.apiKey),
      hasBaseUrl: Boolean(config.baseUrl),
      model: config.model || null,
    })),
  })

  let lastError = "All LLM providers failed or are not configured"
  for (const config of providers) {
    if (!config.model) {
      failures.push(`${config.provider}: missing model`)
      logWarn("llm.provider.skip", { provider: config.provider, reason: "missing_model" })
      continue
    }
    if (config.provider === "openai_compatible" ? !config.baseUrl : !config.apiKey) {
      failures.push(`${config.provider}: missing ${config.provider === "openai_compatible" ? "base URL" : "API key"}`)
      logWarn("llm.provider.skip", {
        provider: config.provider,
        model: config.model,
        reason: config.provider === "openai_compatible" ? "missing_base_url" : "missing_api_key",
      })
      continue
    }
    logInfo("llm.provider.use", {
      provider: config.provider,
      model: config.model,
      documentAnalysis: isDocumentAnalysis,
      attachmentTypes: req.attachments?.map((attachment) => attachment.contentType) || [],
    })

    const response = await requestLLMUnified(config, req)

    if (!response.error) {
      logInfo("llm.provider.success", {
        provider: config.provider,
        model: config.model,
        documentAnalysis: isDocumentAnalysis,
      })
      return response
    }
    lastError = response.error
    failures.push(`${config.provider}/${config.model}: ${response.error}`)
    logError("llm.provider.error", {
      provider: config.provider,
      model: config.model,
      documentAnalysis: isDocumentAnalysis,
      error: response.error,
    })
  }

  const fallbackError = isDocumentAnalysis
    ? failures.some((failure) => failure.includes("missing API key"))
      ? `Document analysis requires a configured Google API key. Add one in Settings > AI and use the ${GEMINI_DOCUMENT_MODEL} model.`
      : `Google Gemini document analysis failed. Check logs for llm.provider.error. Last error: ${failures.at(-1) || "No Google provider was selected."}`
    : lastError

  logError("llm.request.failed", {
    documentAnalysis: isDocumentAnalysis,
    providerCount: providers.length,
    failures,
    userFacingError: fallbackError,
  })

  return {
    output: {},
    provider: providers[0]?.provider || settings.providers[0]?.provider || "openai",
    error: fallbackError,
  }
}
