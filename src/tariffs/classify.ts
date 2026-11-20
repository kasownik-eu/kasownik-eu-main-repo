import type { z } from 'zod'

import type { ticketCategories } from '@/content/enums'

import type { ticketsExtractionSchemaFor } from './schema'
import type { TariffData } from './types'

type TicketCategory = (typeof ticketCategories)[number]

export type ExtractedTariff = z.infer<ReturnType<typeof ticketsExtractionSchemaFor>>
type Extracted = ExtractedTariff['tickets'][number]

const MINUTES_PER_UNIT = { minutes: 1, hours: 60, days: 1_440, months: 43_200, years: 525_600 } as const

// Category thresholds (minutes): single up to 2 h, short 24 h to 7 days, long 30 days and more, anything else "other"
const SINGLE_MAX = 120
const SHORT_MIN = 24 * 60
const SHORT_MAX = 7 * 24 * 60
const LONG_MIN = 30 * 24 * 60

export const ticketCategoryFor = ({ kind, duration }: Pick<Extracted, 'kind' | 'duration'>): TicketCategory => {
  if (kind !== 'ticket' || !duration) return 'other'
  const minutes = duration.value * MINUTES_PER_UNIT[duration.unit]
  if (minutes <= SINGLE_MAX) return 'single'
  if (minutes >= SHORT_MIN && minutes <= SHORT_MAX) return 'short'
  if (minutes >= LONG_MIN) return 'long'
  return 'other'
}

// Only tickets and ticket packages are stored as tickets; luggage has its own list, events and fees are not tickets
const STORED_KINDS: readonly Extracted['kind'][] = ['ticket', 'package']

export const classifyTariff = (
  extracted: ExtractedTariff,
): { data: Pick<TariffData, 'tickets' | 'zones' | 'rulesNote'>; skipped: { name: string; kind: string }[] } => {
  const skipped: { name: string; kind: string }[] = []
  const tickets: TariffData['tickets'] = []
  for (const { kind, duration, ...ticket } of extracted.tickets) {
    if (STORED_KINDS.includes(kind)) tickets.push({ category: ticketCategoryFor({ kind, duration }), ...ticket })
    else skipped.push({ name: ticket.name.pl, kind })
  }
  return { data: { ...extracted, tickets }, skipped }
}
