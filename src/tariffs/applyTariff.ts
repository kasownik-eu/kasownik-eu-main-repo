import type { Payload, PayloadRequest } from 'payload'

import type { LocalizedText, TariffData } from './types'

type Locale = 'pl' | 'en'

const pick = (text: LocalizedText | null, locale: Locale) => (text ? text[locale] : null)

const tariffFor = (data: TariffData, locale: Locale) => ({
  tickets: data.tickets.map((t) => ({
    ...t,
    name: t.name[locale],
    validity: pick(t.validity, locale),
    scope: pick(t.scope, locale),
    whereToBuy: pick(t.whereToBuy, locale),
  })),
  luggage: data.luggage.map((l) => ({
    ...l,
    item: l.item[locale],
    note: pick(l.note, locale),
    feeText: pick(l.feeText, locale),
    conditions: pick(l.conditions, locale),
    whereToBuy: pick(l.whereToBuy, locale),
  })),
  zones: {
    enabled: data.zones.enabled,
    items: data.zones.items.map((z) => ({ name: z.name[locale], covers: pick(z.covers, locale) })),
    noteTitle: pick(data.zones.noteTitle, locale),
    note: pick(data.zones.note, locale),
  },
  rulesNote: pick(data.rulesNote, locale),
})

// Writes tariff fields only (never purchaseMethods); returns the id of the operator version it created
export const applyTariff = async (
  payload: Payload,
  id: number,
  data: TariffData,
  { req, rulesUrl }: { req?: PayloadRequest; rulesUrl?: string | null } = {},
): Promise<string | null> => {
  const current = await payload.findByID({ collection: 'operators', id, locale: 'pl', depth: 0, req })
  const pl = tariffFor(data, 'pl')
  const en = tariffFor(data, 'en')
  const context = { tariffSync: true }

  // Polish pass replaces the arrays; the English pass reuses the new row ids so translations stay aligned
  const operator = await payload.update({
    collection: 'operators',
    id,
    locale: 'pl',
    depth: 0,
    req,
    context,
    data: {
      ...pl,
      zones: { ...current.zones, ...pl.zones },
      rulesUrl: rulesUrl ?? current.rulesUrl,
      sources: { ...current.sources, aiAssisted: true },
    },
  })

  await payload.update({
    collection: 'operators',
    id,
    locale: 'en',
    depth: 0,
    req,
    context,
    data: {
      tickets: operator.tickets?.map((row, i) => ({ ...row, ...en.tickets[i] })),
      luggage: operator.luggage?.map((row, i) => ({ ...row, ...en.luggage[i] })),
      zones: {
        ...operator.zones,
        ...en.zones,
        items: operator.zones?.items?.map((row, i) => ({ ...row, ...en.zones.items[i] })),
      },
      rulesNote: en.rulesNote,
    },
  })

  const versions = await payload.findVersions({
    collection: 'operators',
    where: { parent: { equals: id } },
    sort: '-updatedAt',
    limit: 1,
    depth: 0,
    req,
  })
  return versions.docs[0] ? String(versions.docs[0].id) : null
}
