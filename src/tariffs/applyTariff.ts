import { readFile, writeFile } from 'fs/promises'
import path from 'path'

import { OPERATOR_FILES, type RawOperator } from '@/content/load'
import type { LocalizedText as ContentText, TicketsFile, ZonesFile } from '@/content/schema'

import type { LocalizedText, TariffData } from './types'

// The English text is optional in the content (it falls back to Polish) and stays absent here when missing
const both = (text: ContentText | null | undefined): LocalizedText | null =>
  text ? { pl: text.pl, ...(text.en ? { en: text.en } : {}) } : null
const required = (text: ContentText): LocalizedText => both(text)!

// The operator's current tariff in the shape the LLM returns, so the two can be diffed
export const toTariffData = ({
  tickets,
  zones,
}: Pick<RawOperator, 'tickets' | 'zones'>): TariffData => ({
  tickets: (tickets?.tickets ?? []).map((t) => ({
    category: t.category,
    name: required(t.name),
    validity: both(t.validity),
    scope: both(t.scope),
    transportModes: t.transportModes ?? null,
    priceNormal: t.priceNormal ?? null,
    priceReduced: t.priceReduced ?? null,
    whereToBuy: both(t.whereToBuy),
  })),
  luggage: (tickets?.luggage ?? []).map((l) => ({
    type: l.type ?? null,
    item: required(l.item),
    note: both(l.note),
    transportModes: l.transportModes ?? null,
    fee: l.fee ?? null,
    feeText: both(l.feeText),
    conditions: both(l.conditions),
    whereToBuy: both(l.whereToBuy),
  })),
  zones: {
    enabled: Boolean(zones?.enabled),
    items: (zones?.items ?? []).map((z) => ({ name: required(z.name), covers: both(z.covers) })),
    noteTitle: both(zones?.noteTitle),
    note: both(zones?.note),
  },
  rulesNote: both(tickets?.rulesNote),
})

export const writeJson = (file: string, data: unknown) =>
  writeFile(file, `${JSON.stringify(data, null, 2)}\n`)

// Empty fields are left out of the files (all of them are optional), so rows that were not touched keep a minimal diff
const withoutNulls = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(withoutNulls)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item != null)
        .map(([key, item]) => [key, withoutNulls(item)]),
    )
  return value
}

// Rewrites tickets.json and zones.json (never purchase.json); keeps fields the LLM doesn't produce (zone map).
// The first tariff page becomes the rules link, and the operator's sources get the "AI assisted" note
export const applyTariff = async (
  operator: Pick<RawOperator, 'dir' | 'tickets' | 'zones'>,
  data: TariffData,
  { rulesUrl }: { rulesUrl?: string | null } = {},
) => {
  const tickets: TicketsFile = {
    tickets: data.tickets,
    luggage: data.luggage,
    rulesNote: data.rulesNote,
    rulesUrl: rulesUrl ?? operator.tickets?.rulesUrl ?? null,
  }
  const zones: ZonesFile = {
    ...data.zones,
    ...(operator.zones?.map ? { map: operator.zones.map } : {}),
  }

  await writeJson(path.join(operator.dir, OPERATOR_FILES.tickets), withoutNulls(tickets))
  await writeJson(path.join(operator.dir, OPERATOR_FILES.zones), withoutNulls(zones))

  // Edited as raw JSON, not the parsed value, so the editor's key order and formatting survive
  const infoFile = path.join(operator.dir, OPERATOR_FILES.info)
  const info = JSON.parse(await readFile(infoFile, 'utf8'))
  if (info.sources?.aiAssisted !== true) {
    info.sources = { ...info.sources, aiAssisted: true }
    await writeJson(infoFile, info)
  }
}
