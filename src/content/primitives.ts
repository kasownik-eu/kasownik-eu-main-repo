import { z } from 'zod'

// Building blocks shared by the content schemas (src/content/schema.ts) and the block schemas (src/blocks/schema.ts)

export const slug = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, digits and hyphens')

// Polish is required; English falls back to Polish when missing
export const localizedText = z.strictObject({
  pl: z.string().min(1),
  en: z.string().min(1).optional(),
})

export const optionalText = localizedText.nullish()
