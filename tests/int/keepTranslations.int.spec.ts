import { describe, expect, it } from 'vitest'

import { keepTranslations, keepWhereToBuy } from '@/tariffs/keepTranslations'
import type { TariffData } from '@/tariffs/types'

const tariff = (name: object, scope?: object | null) =>
  ({
    tickets: [{ category: 'single', name, scope, priceNormal: 4 }],
    luggage: [],
    zones: { enabled: false, items: [] },
  }) as unknown as TariffData

describe('keepTranslations', () => {
  it('carries existing English over to unchanged Polish texts', () => {
    const current = tariff({ pl: 'Bilet 20 minut', en: '20-minute ticket' }, { pl: 'Cała sieć', en: 'Whole network' })
    const proposed = tariff({ pl: 'Bilet 20 minut' }, { pl: 'Cała sieć' })
    expect(keepTranslations(current, proposed).tickets[0]).toMatchObject({
      name: { pl: 'Bilet 20 minut', en: '20-minute ticket' },
      scope: { pl: 'Cała sieć', en: 'Whole network' },
    })
  })

  it('drops English when the Polish wording changed or never had a translation', () => {
    const current = tariff({ pl: 'Bilet 20 minut', en: '20-minute ticket' }, { pl: 'Strefa A' })
    const proposed = tariff({ pl: 'Bilet 20-minutowy' }, { pl: 'Strefa A' })
    const [ticket] = keepTranslations(current, proposed).tickets
    expect(ticket.name).toEqual({ pl: 'Bilet 20-minutowy' })
    expect(ticket.scope).toEqual({ pl: 'Strefa A' })
  })

  it('does not touch missing optional texts', () => {
    expect(keepTranslations(tariff({ pl: 'A', en: 'B' }), tariff({ pl: 'A' }, null)).tickets[0].scope).toBeNull()
  })
})

describe('keepWhereToBuy', () => {
  it('carries the existing whereToBuy to the matching ticket and leaves new tickets without one', () => {
    const withWhere = (name: string, whereToBuy?: object) =>
      ({
        tickets: [{ category: 'single', name: { pl: name }, whereToBuy, priceNormal: 4 }],
        luggage: [],
        zones: { enabled: false, items: [] },
      }) as unknown as TariffData
    const kept = keepWhereToBuy(withWhere('Bilet 20 minut', { pl: 'Automat' }), withWhere('bilet 20 minut'))
    expect(kept.tickets[0].whereToBuy).toEqual({ pl: 'Automat' })
    expect(keepWhereToBuy(withWhere('Bilet 20 minut', { pl: 'Automat' }), withWhere('Inny')).tickets[0].whereToBuy).toBeUndefined()
  })
})
