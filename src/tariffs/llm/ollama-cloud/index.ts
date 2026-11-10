import { Ollama, type ChatRequest, type ChatResponse } from 'ollama'

import type { TariffExtractor } from '../types'
import { getOllamaCloudConfig, type OllamaCloudConfig } from './config'
import { systemPrompt, userPrompt } from './prompts'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// The library has no timeout for non-streaming requests: add one through its fetch hook
const createClient = (config: OllamaCloudConfig) =>
  new Ollama({
    host: config.baseUrl,
    headers: { Authorization: `Bearer ${config.apiKey}` },
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        signal: init?.signal
          ? AbortSignal.any([init.signal, AbortSignal.timeout(config.timeoutMs)])
          : AbortSignal.timeout(config.timeoutMs),
      }),
  })

// HTTP errors come as the library's ResponseError (not exported); anything else is a network error or timeout
const httpStatus = (err: unknown) =>
  (err as { name?: string }).name === 'ResponseError' ? (err as { status_code: number }).status_code : undefined

const isRetryable = (err: unknown) => {
  const status = httpStatus(err)
  return status === undefined || status === 429 || status >= 500
}

const chatWithRetry = async (
  client: Ollama,
  config: OllamaCloudConfig,
  request: ChatRequest & { stream?: false },
): Promise<ChatResponse> => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await client.chat({ ...request, stream: false })
    } catch (err) {
      if (!isRetryable(err) || attempt >= config.maxRetries) {
        const status = httpStatus(err)
        throw status ? new Error(`HTTP ${status}: ${(err as Error).message}`, { cause: err }) : err
      }
      await sleep(config.retryDelayMs * 2 ** attempt)
    }
  }
}

export const ollamaCloudExtractor: TariffExtractor = {
  name: 'ollama-cloud',
  async extract({ pages, operator, jsonSchema, instructions }) {
    const config = getOllamaCloudConfig()
    const response = await chatWithRetry(createClient(config), config, {
      model: config.model,
      // Structured output: Ollama constrains decoding to this JSON schema
      format: jsonSchema,
      think: config.think,
      options: config.options,
      messages: [
        { role: 'system', content: systemPrompt(instructions, jsonSchema) },
        { role: 'user', content: userPrompt({ operator, pages }) },
      ],
    })

    if (response.done_reason === 'length') {
      throw new Error(`model "${config.model}" hit the output limit, raise OLLAMA_NUM_PREDICT`)
    }
    const content = response.message?.content?.trim()
    if (!content) throw new Error(`model "${config.model}" returned an empty response`)
    try {
      return JSON.parse(content)
    } catch {
      throw new Error(`model "${config.model}" returned non-JSON output: ${content.slice(0, 200)}`)
    }
  },
}
