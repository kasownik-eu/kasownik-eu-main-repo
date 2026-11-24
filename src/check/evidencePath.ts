import type { RawOperator } from '@/content/load'
import type { EvidenceFile } from '@/content/schema'

export type Fact = EvidenceFile['facts'][number]

// The data a fact's `path` is relative to. purchase.json is an array, so it is addressed as `purchase[1].type`
const rootOf = (operator: RawOperator, file: Fact['file']): unknown => {
  switch (file) {
    case 'operator':
      return operator.info
    case 'tickets':
      return operator.tickets
    case 'zones':
      return operator.zones
    case 'purchase':
      return { purchase: operator.purchase }
  }
}

// `tickets[3].priceNormal`, `items[0].name.pl`: undefined when any step is missing
export const resolveFact = (
  operator: RawOperator,
  { file, path }: Pick<Fact, 'file' | 'path'>,
): unknown => {
  let current = rootOf(operator, file)
  for (const [, key, index] of path.matchAll(/([^.[\]]+)|\[(\d+)\]/g)) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key ?? index]
  }
  return current
}
