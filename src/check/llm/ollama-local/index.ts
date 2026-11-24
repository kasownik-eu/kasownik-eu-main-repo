import { Ollama, type ChatRequest, type ChatResponse } from 'ollama'
import { Agent } from 'undici'

import type { LlmExtractor } from '../types'
import { getOllamaLocalConfig, type OllamaLocalConfig } from './config'
import { systemPrompt, userPrompt } from './prompts'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// The library has no timeout for non-streaming requests: add one through its fetch hook.
// Node's fetch also gives up after 300 s without response headers (undici default), which a slow local model
// exceeds while it reads a long prompt, so the same limit is applied to the dispatcher.
const createClient = (config: OllamaLocalConfig) => {
  const dispatcher = new Agent({ headersTimeout: config.timeoutMs, bodyTimeout: config.timeoutMs })
  return new Ollama({
    host: config.baseUrl,
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        dispatcher,
        signal: init?.signal
          ? AbortSignal.any([init.signal, AbortSignal.timeout(config.timeoutMs)])
          : AbortSignal.timeout(config.timeoutMs),
      } as RequestInit),
  })
}

// HTTP errors come as the library's ResponseError (not exported); anything else is a network error or timeout
const httpStatus = (err: unknown) =>
  (err as { name?: string }).name === 'ResponseError' ? (err as { status_code: number }).status_code : undefined

const isRetryable = (err: unknown) => {
  const status = httpStatus(err)
  return status === undefined || status === 429 || status >= 500
}

const chatWithRetry = async (
  client: Ollama,
  config: OllamaLocalConfig,
  request: ChatRequest & { stream?: false },
): Promise<ChatResponse> => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await client.chat({ ...request, stream: false })
    } catch (err) {
      if (!isRetryable(err) || attempt >= config.maxRetries) {
        const status = httpStatus(err)
        if (status === 404) {
          throw new Error(
            `model "${config.model}" not found on ${config.baseUrl}, run \`ollama pull ${config.model}\` or change OLLAMA_LOCAL_MODEL`,
            { cause: err },
          )
        }
        if (status) throw new Error(`HTTP ${status}: ${(err as Error).message}`, { cause: err })
        throw new Error(
          `cannot reach Ollama at ${config.baseUrl} (is \`ollama serve\` running?): ${(err as Error).message}`,
          { cause: err },
        )
      }
      await sleep(config.retryDelayMs * 2 ** attempt)
    }
  }
}

export const ollamaLocalExtractor: LlmExtractor = {
  name: 'ollama-local',
  async extract({ pages, operator, jsonSchema, instructions, task }) {
    const config = getOllamaLocalConfig()
    const response = await chatWithRetry(createClient(config), config, {
      model: config.model,
      // Structured output: Ollama constrains decoding to this JSON schema
      format: jsonSchema,
      think: config.think,
      options: config.options,
      messages: [
        { role: 'system', content: systemPrompt(instructions, jsonSchema) },
        { role: 'user', content: userPrompt({ operator, pages, task }) },
      ],
    })

    if (response.done_reason === 'length') {
      throw new Error(`model "${config.model}" hit the output limit, raise OLLAMA_LOCAL_NUM_PREDICT`)
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
