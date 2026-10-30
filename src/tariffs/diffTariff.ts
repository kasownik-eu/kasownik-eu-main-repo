import type { LocalizedText, TariffData } from './types'

export type TariffChange = {
  path: string
  kind: 'added' | 'removed' | 'changed'
  before: unknown
  after: unknown
  // Major: affects what a passenger pays or can use. Minor: wording and translations
  major: boolean
}

type Fields<T> = { major: (keyof T)[]; text: (keyof T)[] }

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
const sortedModes = (v: unknown) => (Array.isArray(v) ? [...v].sort() : v)

// Rows are matched by a natural key; duplicates get an ordinal so they still pair up deterministically
const keyed = <T>(rows: T[], key: (row: T) => string) => {
  const seen = new Map<string, number>()
  return new Map(
    rows.map((row) => {
      const k = key(row).trim().toLowerCase()
      const n = seen.get(k) ?? 0
      seen.set(k, n + 1)
      return [n ? `${k}#${n + 1}` : k, row]
    }),
  )
}

const diffText = (path: string, before: LocalizedText | null, after: LocalizedText | null): TariffChange[] => {
  if (!before || !after) {
    return same(before, after) ? [] : [{ path, kind: before ? 'removed' : 'added', before, after, major: false }]
  }
  return (['pl', 'en'] as const)
    .filter((l) => before[l] !== after[l])
    .map((l) => ({ path: `${path}.${l}`, kind: 'changed', before: before[l], after: after[l], major: false }))
}

const diffRow = <T>(path: string, before: T, after: T, fields: Fields<T>): TariffChange[] => [
  ...fields.major
    .filter((f) => !same(sortedModes(before[f]), sortedModes(after[f])))
    .map((f) => ({
      path: `${path}.${String(f)}`,
      kind: 'changed' as const,
      before: before[f],
      after: after[f],
      major: true,
    })),
  ...fields.text.flatMap((f) =>
    diffText(`${path}.${String(f)}`, before[f] as LocalizedText | null, after[f] as LocalizedText | null),
  ),
]

const diffRows = <T>(
  section: string,
  before: T[],
  after: T[],
  key: (row: T) => string,
  fields: Fields<T>,
): TariffChange[] => {
  const prev = keyed(before, key)
  const next = keyed(after, key)
  const changes: TariffChange[] = []
  for (const [k, row] of prev) {
    const path = `${section}[${k}]`
    const match = next.get(k)
    if (!match) changes.push({ path, kind: 'removed', before: row, after: null, major: true })
    else changes.push(...diffRow(path, row, match, fields))
  }
  for (const [k, row] of next) {
    if (!prev.has(k)) changes.push({ path: `${section}[${k}]`, kind: 'added', before: null, after: row, major: true })
  }
  return changes
}

export const diffTariff = (current: TariffData, proposed: TariffData): TariffChange[] => [
  ...diffRows('tickets', current.tickets, proposed.tickets, (t) => `${t.category}:${t.name.pl}`, {
    major: ['category', 'transportModes', 'priceNormal', 'priceReduced'],
    text: ['name', 'validity', 'scope', 'whereToBuy'],
  }),
  ...diffRows('luggage', current.luggage, proposed.luggage, (l) => l.item.pl, {
    major: ['transportModes', 'fee'],
    text: ['item', 'note', 'feeText', 'conditions', 'whereToBuy'],
  }),
  ...(current.zones.enabled === proposed.zones.enabled
    ? []
    : [
        {
          path: 'zones.enabled',
          kind: 'changed' as const,
          before: current.zones.enabled,
          after: proposed.zones.enabled,
          major: true,
        },
      ]),
  ...diffRows('zones.items', current.zones.items, proposed.zones.items, (z) => z.name.pl, {
    major: [],
    text: ['name', 'covers'],
  }),
  ...diffText('zones.noteTitle', current.zones.noteTitle, proposed.zones.noteTitle),
  ...diffText('zones.note', current.zones.note, proposed.zones.note),
  ...diffText('rulesNote', current.rulesNote, proposed.rulesNote),
]
