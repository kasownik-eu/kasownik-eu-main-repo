import { fixtureExtractor } from './fixture'
import { ollamaCloudExtractor } from './ollama-cloud'
import type { TariffExtractor } from './types'

const providers: Record<string, TariffExtractor> = {
  fixture: fixtureExtractor,
  'ollama-cloud': ollamaCloudExtractor,
}

export const getTariffExtractor = (): TariffExtractor => {
  const name = process.env.TARIFF_LLM_PROVIDER
  const provider = name ? providers[name] : undefined
  if (!provider) {
    throw new Error(
      `Tariff LLM provider "${name ?? ''}" is not configured. Set TARIFF_LLM_PROVIDER to one of: ${Object.keys(providers).join(', ')}`,
    )
  }
  return provider
}

export type { TariffExtractor } from './types'
