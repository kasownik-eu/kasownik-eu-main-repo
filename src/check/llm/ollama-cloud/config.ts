// Non-secret settings have defaults here and can be overridden via env; the API key comes only from env

const num = (name: string, fallback: number): number => {
  const value = process.env[name]
  if (value === undefined || value === '') return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new Error(`${name} must be a number, got "${value}"`)
  return parsed
}

// Ollama accepts a boolean or an effort level ("low" | "medium" | "high", e.g. for gpt-oss)
const think = (value: string | undefined): boolean | 'low' | 'medium' | 'high' | undefined => {
  if (value === undefined || value === '') return undefined
  if (value === 'true' || value === 'false') return value === 'true'
  if (value === 'low' || value === 'medium' || value === 'high') return value
  throw new Error(`OLLAMA_THINK must be true, false, low, medium or high, got "${value}"`)
}

export type OllamaCloudConfig = ReturnType<typeof getOllamaCloudConfig>

export const getOllamaCloudConfig = () => {
  const apiKey = process.env.OLLAMA_API_KEY
  if (!apiKey) throw new Error('OLLAMA_API_KEY is not set (create one at https://ollama.com/settings/keys)')

  return {
    apiKey,
    baseUrl: (process.env.OLLAMA_BASE_URL || 'https://ollama.com').replace(/\/+$/, ''),
    model: process.env.OLLAMA_MODEL || 'gpt-oss:120b',
    think: think(process.env.OLLAMA_THINK),
    timeoutMs: num('OLLAMA_TIMEOUT_MS', 180_000),
    // Retries only on network errors, 429 and 5xx
    maxRetries: num('OLLAMA_MAX_RETRIES', 2),
    retryDelayMs: num('OLLAMA_RETRY_DELAY_MS', 2_000),
    // Passed to Ollama as `options`; low temperature keeps extraction deterministic
    options: {
      temperature: num('OLLAMA_TEMPERATURE', 0),
      seed: num('OLLAMA_SEED', 42),
      num_ctx: num('OLLAMA_NUM_CTX', 32_768),
      num_predict: num('OLLAMA_NUM_PREDICT', 8_192),
    },
  }
}
