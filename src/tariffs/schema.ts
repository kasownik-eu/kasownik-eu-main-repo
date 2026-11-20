import { z } from 'zod'

import { luggageTypes, ticketCategories, transportModes, type TransportMode } from '@/content/enums'
import { ticketsFile, zonesFile } from '@/content/schema'

// Polish only: English is optional in the content and is filled in later (existing translations are kept, see keepTranslations).
// Optional fields may be omitted, which saves the model output tokens a "null" would cost
const text = z.object({ pl: z.string().min(1) })
const optionalText = text.nullish()
const price = z.number().nonnegative().nullish()

// The model reports facts about each row (what it is, how long it is valid); code derives the category (see classify.ts)
export const ticketKinds = ['ticket', 'package', 'luggage', 'event_offer', 'fee', 'other'] as const
export const durationUnits = ['minutes', 'hours', 'days', 'months', 'years'] as const
const duration = z.object({ value: z.number().positive(), unit: z.enum(durationUnits) })

// whereToBuy is NOT extracted by the LLM yet: with free text the models invent sales channels ("Automaty biletowe") that
// the tariff pages never mention. Existing values are kept on every sync (see keepWhereToBuy).
// TODO: make it an enum of known sales channels (like purchaseMethodTypes), add it to the extraction schema and the
// prompt, and let the LLM pick from the enum only when the text states it. Do not just re-add it as free text.
const whereToBuy = optionalText

// The transportModes enum is narrowed to the modes of the operator being synced
const sharedFields = (allowedModes: readonly TransportMode[]) => {
  const modes = z.array(z.enum(allowedModes as [TransportMode, ...TransportMode[]])).nullish()
  const luggageItem = z.object({
    type: z.enum(luggageTypes),
    item: text,
    note: optionalText,
    transportModes: modes,
    fee: price,
    feeText: optionalText,
    conditions: optionalText,
  })
  return {
    luggageItem,
    ticket: {
      name: text,
      validity: optionalText,
      scope: optionalText,
      transportModes: modes,
      priceNormal: price,
      priceReduced: price,
    },
    rest: {
      zones: z.object({
        enabled: z.boolean(),
        items: z.array(z.object({ name: text, covers: optionalText })),
        noteTitle: optionalText,
        note: optionalText,
      }),
      rulesNote: optionalText,
    },
  }
}

// What the LLM returns, one schema per pass: tickets (with zones and the rules note) and luggage rules
export const ticketsExtractionSchemaFor = (allowedModes: readonly TransportMode[]) => {
  const { ticket, rest } = sharedFields(allowedModes)
  return z.object({
    tickets: z.array(z.object({ kind: z.enum(ticketKinds), duration: duration.nullish(), ...ticket })),
    zones: rest.zones,
    rulesNote: rest.rulesNote,
  })
}

export const luggageExtractionSchemaFor = (allowedModes: readonly TransportMode[]) =>
  z.object({ luggage: z.array(sharedFields(allowedModes).luggageItem) })

// What is stored: the extraction after classify.ts removed the non-tickets and derived the category
export const tariffSchemaFor = (allowedModes: readonly TransportMode[]) => {
  const { ticket, rest, luggageItem } = sharedFields(allowedModes)
  return z.object({
    tickets: z.array(z.object({ category: z.enum(ticketCategories), ...ticket, whereToBuy })),
    ...rest,
    luggage: z.array(luggageItem.extend({ type: z.enum(luggageTypes).nullish(), whereToBuy })),
  })
}

// Accepts every known mode: used where the operator's current modes don't matter
export const tariffSchema = tariffSchemaFor(transportModes)

// Compile-time guard: whatever the LLM returns must also be a valid tickets.json / zones.json
type Infer = z.infer<typeof tariffSchema>
type Assert<T extends true> = T
export type _FitsTicketsFile = Assert<
  Pick<Infer, 'tickets' | 'luggage' | 'rulesNote'> extends z.input<typeof ticketsFile>
    ? true
    : false
>
export type _FitsZonesFile = Assert<Infer['zones'] extends z.input<typeof zonesFile> ? true : false>
