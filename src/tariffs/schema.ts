import { z } from 'zod'

import { ticketCategories, transportModes } from '@/collections/Operators'
import type { TariffData } from './types'

const text = z.object({ pl: z.string().min(1), en: z.string().min(1) })
const optionalText = text.nullable()
const modes = z.array(z.enum(transportModes)).nullable()
const price = z.number().nonnegative().nullable()

export const tariffSchema = z.object({
  tickets: z.array(
    z.object({
      category: z.enum(ticketCategories),
      name: text,
      validity: optionalText,
      scope: optionalText,
      transportModes: modes,
      priceNormal: price,
      priceReduced: price,
      whereToBuy: optionalText,
    }),
  ),
  luggage: z.array(
    z.object({
      item: text,
      note: optionalText,
      transportModes: modes,
      fee: price,
      feeText: optionalText,
      conditions: optionalText,
      whereToBuy: optionalText,
    }),
  ),
  zones: z.object({
    enabled: z.boolean(),
    items: z.array(z.object({ name: text, covers: optionalText })),
    noteTitle: optionalText,
    note: optionalText,
  }),
  rulesNote: optionalText,
})

// Compile-time guard: the schema and the Payload-derived type must match in both directions
type Infer = z.infer<typeof tariffSchema>
type Assert<T extends true> = T
export type _SchemaMatchesPayload = Assert<
  [Infer] extends [TariffData] ? ([TariffData] extends [Infer] ? true : false) : false
>

export const tariffJsonSchema = z.toJSONSchema(tariffSchema)
