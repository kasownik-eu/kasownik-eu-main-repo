import { fixtureExtractor } from './fixture'
import { ollamaCloudExtractor } from './ollama-cloud'
import { ollamaLocalExtractor } from './ollama-local'
import type { LlmExtractor } from './types'

const providers: Record<string, LlmExtractor> = {
  fixture: fixtureExtractor,
  'ollama-cloud': ollamaCloudExtractor,
  'ollama-local': ollamaLocalExtractor,
}

const pick = (envName: string, name: string | undefined): LlmExtractor => {
  const provider = name ? providers[name] : undefined
  if (!provider) {
    throw new Error(
      `LLM provider "${name ?? ''}" is not configured. Set ${envName} to one of: ${Object.keys(providers).join(', ')}`,
    )
  }
  return provider
}

export const getLlmExtractor = (): LlmExtractor => pick('CHECK_LLM_PROVIDER', process.env.CHECK_LLM_PROVIDER)

export type { LlmExtractor } from './types'
