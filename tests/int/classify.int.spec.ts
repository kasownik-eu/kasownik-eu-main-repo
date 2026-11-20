import { describe, expect, it } from 'vitest'

import { classifyTariff, ticketCategoryFor, type ExtractedTariff } from '@/tariffs/classify'

const ticket = (
  name: string,
  kind: ExtractedTariff['tickets'][number]['kind'],
  duration?: { value: number; unit: 'minutes' | 'hours' | 'days' | 'months' | 'years' } | null,
) => ({ kind, duration, name: { pl: name }, priceNormal: 4 })

describe('ticketCategoryFor', () => {
  it.each([
    [20, 'minutes', 'single'],
    [2, 'hours', 'single'],
    [3, 'hours', 'other'],
    [24, 'hours', 'short'],
    [1, 'days', 'short'],
    [7, 'days', 'short'],
    [8, 'days', 'other'],
    [30, 'days', 'long'],
    [1, 'months', 'long'],
    [180, 'days', 'long'],
    [1, 'years', 'long'],
  ] as const)('%s %s -> %s', (value, unit, category) => {
    expect(ticketCategoryFor({ kind: 'ticket', duration: { value, unit } })).toBe(category)
  })

  it('puts packages and tickets without a duration into "other"', () => {
    expect(ticketCategoryFor({ kind: 'package', duration: { value: 180, unit: 'days' } })).toBe('other')
    expect(ticketCategoryFor({ kind: 'ticket', duration: null })).toBe('other')
    expect(ticketCategoryFor({ kind: 'ticket' })).toBe('other')
  })
})

describe('classifyTariff', () => {
  it('keeps tickets and packages with a derived category and reports the rest', () => {
    const { data, skipped } = classifyTariff({
      tickets: [
        ticket('20 minut', 'ticket', { value: 20, unit: 'minutes' }),
        ticket('Sieć 7', 'ticket', { value: 7, unit: 'days' }),
        ticket('Pakiet 20', 'package'),
        ticket('Impreza do 100 osób', 'event_offer'),
        ticket('Opłata dodatkowa', 'fee'),
        ticket('Pies', 'luggage'),
      ],
      zones: { enabled: false, items: [] },
    })
    expect(data.tickets.map((t) => [t.name.pl, t.category])).toEqual([
      ['20 minut', 'single'],
      ['Sieć 7', 'short'],
      ['Pakiet 20', 'other'],
    ])
    expect(data.tickets[0]).not.toHaveProperty('kind')
    expect(data.tickets[0]).not.toHaveProperty('duration')
    expect(skipped).toEqual([
      { name: 'Impreza do 100 osób', kind: 'event_offer' },
      { name: 'Opłata dodatkowa', kind: 'fee' },
      { name: 'Pies', kind: 'luggage' },
    ])
  })
})
