import type { z } from 'zod'

import type { tariffSchema } from './schema'

// What the LLM returns: texts in Polish only; `en` is only present for translations that already exist in the content
export type LocalizedText = { pl: string; en?: string | null }
export type TariffData = z.infer<typeof tariffSchema>
export type TariffPage = { url: string; xpath?: string | null }
