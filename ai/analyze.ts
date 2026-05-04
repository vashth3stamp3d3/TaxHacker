"use server"

import { ActionState } from "@/lib/actions"
import { updateFile } from "@/models/files"
import { getLLMSettings, getSettings } from "@/models/settings"
import { AnalyzeAttachment } from "./attachments"
import { requestLLM } from "./providers/llmProvider"
import { errorMessage, logError, logInfo } from "@/lib/logger"

export type AnalysisResult = {
  output: Record<string, string>
  tokensUsed: number
}

export async function analyzeTransaction(
  prompt: string,
  schema: Record<string, unknown>,
  attachments: AnalyzeAttachment[],
  fileId: string,
  userId: string
): Promise<ActionState<AnalysisResult>> {
  const settings = await getSettings(userId)
  const llmSettings = getLLMSettings(settings)

  logInfo("analysis.llm.settings", {
    fileId,
    attachmentCount: attachments.length,
    providers: llmSettings.providers.map((provider) => ({
      provider: provider.provider,
      model: provider.model || null,
      hasApiKey: Boolean(provider.apiKey),
      hasBaseUrl: Boolean(provider.baseUrl),
    })),
  })

  try {
    const response = await requestLLM(llmSettings, {
      prompt,
      schema,
      attachments,
    })

    if (response.error) {
      throw new Error(response.error)
    }

    const result = response.output
    const tokensUsed = response.tokensUsed || 0

    logInfo("analysis.llm.success", {
      fileId,
      provider: response.provider,
      tokensUsed,
      outputKeys: Object.keys(result),
    })

    await updateFile(fileId, userId, { cachedParseResult: result })

    return {
      success: true,
      data: {
        output: result,
        tokensUsed: tokensUsed,
      },
    }
  } catch (error) {
    logError("analysis.llm.error", {
      fileId,
      error: errorMessage(error),
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze invoice",
    }
  }
}
