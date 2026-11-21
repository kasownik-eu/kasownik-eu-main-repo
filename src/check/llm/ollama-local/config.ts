// Settings for a local Ollama server; everything has a default and can be overridden via env (no secrets needed)

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
  throw new Error(`OLLAMA_LOCAL_THINK must be true, false, low, medium or high, got "${value}"`)
}

export type OllamaLocalConfig = ReturnType<typeof getOllamaLocalConfig>

export const getOllamaLocalConfig = () => ({
  baseUrl: (process.env.OLLAMA_LOCAL_BASE_URL || 'http://localhost:11434').replace(/\/+$/, ''),
  // Any model pulled locally (`ollama pull <model>`, list with `ollama list`)
  model: process.env.OLLAMA_LOCAL_MODEL || 'qwen3:8b',
  think: think(process.env.OLLAMA_LOCAL_THINK),
  // Local inference is slower than the cloud, hence the longer default
  timeoutMs: num('OLLAMA_LOCAL_TIMEOUT_MS', 600_000),
  // Retries only on network errors, 429 and 5xx
  maxRetries: num('OLLAMA_LOCAL_MAX_RETRIES', 1),
  retryDelayMs: num('OLLAMA_LOCAL_RETRY_DELAY_MS', 2_000),
  // Passed to Ollama as `options`; low temperature keeps extraction deterministic
  options: {
    temperature: num('OLLAMA_LOCAL_TEMPERATURE', 0),
    seed: num('OLLAMA_LOCAL_SEED', 42),
    num_ctx: num('OLLAMA_LOCAL_NUM_CTX', 16_384),
    num_predict: num('OLLAMA_LOCAL_NUM_PREDICT', 8_192),
  },
})
