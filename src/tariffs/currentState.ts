import type { Payload, PayloadRequest } from 'payload'

import type { Operator } from '@/payload-types'
import type { LocalizedText, TariffData } from './types'

// With locale 'all' every localized field arrives as { pl, en } instead of a string
type AllLocales = Record<string, string | null | undefined> | string | null | undefined

const loc = (value: unknown): LocalizedText | null => {
  const v = value as AllLocales
  if (v == null) return null
  if (typeof v === 'string') return v ? { pl: v, en: v } : null
  const pl = v.pl || v.en
  const en = v.en || v.pl
  return pl && en ? { pl, en } : null
}

const req = (value: unknown): LocalizedText => loc(value) ?? { pl: '', en: '' }

export const toTariffData = (operator: Operator): TariffData => ({
  tickets: (operator.tickets ?? []).map((t) => ({
    category: t.category,
    name: req(t.name),
    validity: loc(t.validity),
    scope: loc(t.scope),
    transportModes: t.transportModes ?? null,
    priceNormal: t.priceNormal ?? null,
    priceReduced: t.priceReduced ?? null,
    whereToBuy: loc(t.whereToBuy),
  })),
  luggage: (operator.luggage ?? []).map((l) => ({
    item: req(l.item),
    note: loc(l.note),
    transportModes: l.transportModes ?? null,
    fee: l.fee ?? null,
    feeText: loc(l.feeText),
    conditions: loc(l.conditions),
    whereToBuy: loc(l.whereToBuy),
  })),
  zones: {
    enabled: Boolean(operator.zones?.enabled),
    items: (operator.zones?.items ?? []).map((z) => ({ name: req(z.name), covers: loc(z.covers) })),
    noteTitle: loc(operator.zones?.noteTitle),
    note: loc(operator.zones?.note),
  },
  rulesNote: loc(operator.rulesNote),
})

export const loadCurrentTariff = async (payload: Payload, id: number, req?: PayloadRequest) =>
  toTariffData(await payload.findByID({ collection: 'operators', id, locale: 'all', depth: 0, req }))
