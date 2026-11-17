import { readFile, writeFile } from 'fs/promises'
import path from 'path'

import { OPERATOR_FILES, type RawOperator } from '@/content/load'
import type { LocalizedText as ContentText, TicketsFile, ZonesFile } from '@/content/schema'

import type { LocalizedText, TariffData } from './types'

// Content files may omit the English text (it falls back to Polish); the tariff shape always has both
const both = (text: ContentText | null | undefined): LocalizedText | null =>
  text ? { pl: text.pl, en: text.en ?? text.pl } : null
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

  await writeJson(path.join(operator.dir, OPERATOR_FILES.tickets), tickets)
  await writeJson(path.join(operator.dir, OPERATOR_FILES.zones), zones)

  // Edited as raw JSON, not the parsed value, so the editor's key order and formatting survive
  const infoFile = path.join(operator.dir, OPERATOR_FILES.info)
  const info = JSON.parse(await readFile(infoFile, 'utf8'))
  if (info.sources?.aiAssisted !== true) {
    info.sources = { ...info.sources, aiAssisted: true }
    await writeJson(infoFile, info)
  }
}
