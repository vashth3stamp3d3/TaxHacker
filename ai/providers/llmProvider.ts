import { ChatOpenAI } from "@langchain/openai"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatMistralAI } from "@langchain/mistralai"
import { BaseMessage, HumanMessage } from "@langchain/core/messages"
import { logError, logInfo, logWarn } from "@/lib/logger"

export type LLMProvider = "openai" | "google" | "mistral" | "openai_compatible"

export interface LLMConfig {
  provider: LLMProvider
  apiKey: string
  model: string
  baseUrl?: string
}

export interface LLMSettings {
  providers: LLMConfig[]
}

export interface LLMRequest {
  prompt: string
  schema?: Record<string, unknown>
  attachments?: any[]
}

export interface LLMResponse {
  output: Record<string, string>
  tokensUsed?: number
  provider: LLMProvider
  error?: string
}

const GEMINI_DOCUMENT_MODEL = "gemini-2.5-flash"

function hasDocumentAttachment(req: LLMRequest) {
  return Boolean(req.attachments?.length)
}

function googleAttachmentToContent(att: any) {
  if (att.contentType.startsWith("image/")) {
    return {
      type: "image_url",
      image_url: {
        url: `data:${att.contentType};base64,${att.base64}`,
      },
    }
  }

  return {
    type: "media",
    mimeType: att.contentType,
    data: att.base64,
  }
}

function imageAttachmentToContent(att: any) {
  return {
    type: "image_url",
    image_url: {
      url: `data:${att.contentType};base64,${att.base64}`,
    },
  }
}

async function requestLLMUnified(config: LLMConfig, req: LLMRequest): Promise<LLMResponse> {
  try {
    const temperature = 0
    let model: any
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

    let message_content: any = [{ type: "text", text: req.prompt }]
    if (req.attachments && req.attachments.length > 0) {
      const attachments =
        config.provider === "google"
          ? req.attachments.map(googleAttachmentToContent)
          : req.attachments.filter((att) => att.contentType.startsWith("image/")).map(imageAttachmentToContent)
      message_content.push(...attachments)
    }
    const messages: BaseMessage[] = [new HumanMessage({ content: message_content })]

    let response: any
    if (config.provider === "openai_compatible") {
      const raw = await model.invoke(messages)
      const text = typeof raw.content === "string" ? raw.content : raw.content.map((c: any) => c.text || "").join("")
      response = JSON.parse(text.replace(/```(?:json)?\s*/g, "").trim())
    } else {
      const structuredModel = model.withStructuredOutput(req.schema, { name: "transaction" })
      response = await structuredModel.invoke(messages)
    }

    return {
      output: response,
      provider: config.provider,
    }
  } catch (error: any) {
    return {
      output: {},
      provider: config.provider,
      error: error instanceof Error ? error.message : `${config.provider} request failed`,
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
    } else {
      failures.push(`${config.provider}/${config.model}: ${response.error}`)
      logError("llm.provider.error", {
        provider: config.provider,
        model: config.model,
        documentAnalysis: isDocumentAnalysis,
        error: response.error,
      })
    }
  }

  const fallbackError = isDocumentAnalysis
    ? failures.some((failure) => failure.includes("missing API key"))
      ? `Document analysis requires a configured Google API key. Add one in Settings > AI and use the ${GEMINI_DOCUMENT_MODEL} model.`
      : `Google Gemini document analysis failed. Check Railway logs for llm.provider.error. Last error: ${failures.at(-1) || "No Google provider was selected."}`
    : "All LLM providers failed or are not configured"

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
