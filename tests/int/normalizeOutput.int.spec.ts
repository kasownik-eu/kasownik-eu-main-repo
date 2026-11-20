import { describe, expect, it } from 'vitest'

import { normalizeLlmOutput } from '@/tariffs/normalizeOutput'

describe('normalizeLlmOutput', () => {
  it('turns "null" strings into null and collapses all-null { pl, en } texts', () => {
    const out = normalizeLlmOutput({
      tickets: [
        {
          name: { pl: 'Dzienny', en: 'Daily' },
          scope: { pl: 'null', en: 'null' },
          validity: { pl: 'ważny do 23:59', en: ' NULL ' },
          priceReduced: null,
        },
      ],
      rulesNote: 'null',
    })
    expect(out).toEqual({
      tickets: [
        {
          name: { pl: 'Dzienny', en: 'Daily' },
          scope: null,
          validity: { pl: 'ważny do 23:59', en: null },
          priceReduced: null,
        },
      ],
      rulesNote: null,
    })
  })

  it('treats dash placeholders as missing', () => {
    expect(normalizeLlmOutput({ note: { pl: '-' }, other: { pl: ' — ' }, n: 'N/A', text: { pl: 'a - b' } })).toEqual({
      note: null,
      other: null,
      n: null,
      text: { pl: 'a - b' },
    })
  })

  it('keeps ordinary values untouched', () => {
    const value = { zones: { enabled: false, items: [] }, price: 4.4, note: 'nullable' }
    expect(normalizeLlmOutput(value)).toEqual(value)
  })
})
