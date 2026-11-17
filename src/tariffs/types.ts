import type { z } from 'zod'

import type { tariffSchema } from './schema'

// What the LLM must return: every key present (null when unknown), every text in both locales
export type LocalizedText = { pl: string; en: string }
export type TariffData = z.infer<typeof tariffSchema>
export type TariffPage = { url: string; xpath?: string | null }
