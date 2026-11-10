import { z } from 'zod'

import { ticketCategories, transportModes } from '@/collections/Operators'
import type { TariffData } from './types'

const text = z.object({ pl: z.string().min(1), en: z.string().min(1) })
const optionalText = text.nullable()
const price = z.number().nonnegative().nullable()

type TransportMode = (typeof transportModes)[number]

// The transportModes enum is narrowed to the modes of the operator being synced
export const tariffSchemaFor = (allowedModes: readonly TransportMode[]) => {
  const modes = z.array(z.enum(allowedModes as [TransportMode, ...TransportMode[]])).nullable()
  return z.object({
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
}

// Accepts every known mode: used where the operator's current modes don't matter (approving a stored proposal)
export const tariffSchema = tariffSchemaFor(transportModes)

// Compile-time guard: the schema and the Payload-derived type must match in both directions
type Infer = z.infer<typeof tariffSchema>
type Assert<T extends true> = T
export type _SchemaMatchesPayload = Assert<
  [Infer] extends [TariffData] ? ([TariffData] extends [Infer] ? true : false) : false
>

