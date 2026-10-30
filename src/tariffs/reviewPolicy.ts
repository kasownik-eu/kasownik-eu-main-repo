import type { TariffChange } from './diffTariff'
import type { TariffData } from './types'

// POC thresholds; tune once real tariffs flow through
export const REVIEW_POLICY = {
  maxPriceChangeRatio: 0.25,
  maxMajorChanges: 3,
  maxTotalChanges: 15,
}

const PRICE_FIELD = /\.(priceNormal|priceReduced|fee)$/

// Returns why the changes need a human; empty means they can be applied automatically
export const reviewReasons = (current: TariffData, changes: TariffChange[]): string[] => {
  const reasons: string[] = []
  const major = changes.filter((c) => c.major)

  if (current.tickets.length === 0) reasons.push('First import: the operator has no tickets yet.')

  const rows = major.filter((c) => c.path.startsWith('tickets[') && c.kind !== 'changed')
  if (rows.length) reasons.push(`Tickets added or removed: ${rows.map((c) => c.path).join(', ')}`)

  const jumps = major.filter((c) => {
    if (!PRICE_FIELD.test(c.path)) return false
    if (typeof c.before !== 'number' || typeof c.after !== 'number') return true
    return c.before === 0 || Math.abs(c.after - c.before) / c.before > REVIEW_POLICY.maxPriceChangeRatio
  })
  if (jumps.length) {
    const pct = Math.round(REVIEW_POLICY.maxPriceChangeRatio * 100)
    reasons.push(`Prices changed by more than ${pct}% or appeared/disappeared: ${jumps.map((c) => c.path).join(', ')}`)
  }

  if (major.length > REVIEW_POLICY.maxMajorChanges) {
    reasons.push(`${major.length} major changes (limit ${REVIEW_POLICY.maxMajorChanges}).`)
  }
  if (changes.length > REVIEW_POLICY.maxTotalChanges) {
    reasons.push(`${changes.length} changes in total (limit ${REVIEW_POLICY.maxTotalChanges}).`)
  }
  return reasons
}
