import type { TariffData } from './types'

type Json = unknown
const isObject = (value: Json): value is Record<string, Json> => !!value && typeof value === 'object' && !Array.isArray(value)

// Existing English texts by their Polish source, so the Polish-only LLM output doesn't wipe translations that are
// still valid. A text whose Polish wording changed gets no English until it is translated again
const collectTranslations = (value: Json, found = new Map<string, string>()): Map<string, string> => {
  if (Array.isArray(value)) value.forEach((item) => collectTranslations(item, found))
  else if (isObject(value)) {
    if (typeof value.pl === 'string' && typeof value.en === 'string' && value.en && value.en !== value.pl)
      found.set(value.pl, value.en)
    Object.values(value).forEach((item) => collectTranslations(item, found))
  }
  return found
}

const apply = (value: Json, translations: Map<string, string>): Json => {
  if (Array.isArray(value)) return value.map((item) => apply(item, translations))
  if (!isObject(value)) return value
  const entries = Object.entries(value).map(([key, item]) => [key, apply(item, translations)] as const)
  const out = Object.fromEntries(entries)
  if (typeof out.pl === 'string' && !out.en && translations.has(out.pl)) out.en = translations.get(out.pl)
  return out
}

export const keepTranslations = (current: TariffData, proposed: TariffData): TariffData =>
  apply(proposed, collectTranslations(current)) as TariffData

// whereToBuy is not extracted by the LLM (see schema.ts): carry the existing value over to the row it belongs to
export const keepWhereToBuy = (current: TariffData, proposed: TariffData): TariffData => {
  const byKey = <T>(rows: T[], key: (row: T) => string) => new Map(rows.map((row) => [key(row).trim().toLowerCase(), row]))
  const tickets = byKey(current.tickets, (t) => `${t.category}:${t.name.pl}`)
  const luggage = byKey(current.luggage, (l) => l.item.pl)
  return {
    ...proposed,
    tickets: proposed.tickets.map((t) => {
      const whereToBuy = tickets.get(`${t.category}:${t.name.pl}`.trim().toLowerCase())?.whereToBuy
      return whereToBuy ? { ...t, whereToBuy } : t
    }),
    luggage: proposed.luggage.map((l) => {
      const whereToBuy = luggage.get(l.item.pl.trim().toLowerCase())?.whereToBuy
      return whereToBuy ? { ...l, whereToBuy } : l
    }),
  }
}
