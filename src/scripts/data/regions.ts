import type { Payload } from 'payload'

type Localized = { pl: string; en: string }

// ISO 3166-2 codes; only Poland for now
export const countries: { code: string; name: Localized; regions: { code: string; name: Localized }[] }[] = [
  {
    code: 'PL',
    name: { pl: 'Polska', en: 'Poland' },
    regions: [
      { code: 'PL-02', name: { pl: 'Dolnośląskie', en: 'Lower Silesian' } },
      { code: 'PL-04', name: { pl: 'Kujawsko-pomorskie', en: 'Kuyavian-Pomeranian' } },
      { code: 'PL-06', name: { pl: 'Lubelskie', en: 'Lublin' } },
      { code: 'PL-08', name: { pl: 'Lubuskie', en: 'Lubusz' } },
      { code: 'PL-10', name: { pl: 'Łódzkie', en: 'Łódź' } },
      { code: 'PL-12', name: { pl: 'Małopolskie', en: 'Lesser Poland' } },
      { code: 'PL-14', name: { pl: 'Mazowieckie', en: 'Masovian' } },
      { code: 'PL-16', name: { pl: 'Opolskie', en: 'Opole' } },
      { code: 'PL-18', name: { pl: 'Podkarpackie', en: 'Subcarpathian' } },
      { code: 'PL-20', name: { pl: 'Podlaskie', en: 'Podlaskie' } },
      { code: 'PL-22', name: { pl: 'Pomorskie', en: 'Pomeranian' } },
      { code: 'PL-24', name: { pl: 'Śląskie', en: 'Silesian' } },
      { code: 'PL-26', name: { pl: 'Świętokrzyskie', en: 'Holy Cross' } },
      { code: 'PL-28', name: { pl: 'Warmińsko-mazurskie', en: 'Warmian-Masurian' } },
      { code: 'PL-30', name: { pl: 'Wielkopolskie', en: 'Greater Poland' } },
      { code: 'PL-32', name: { pl: 'Zachodniopomorskie', en: 'West Pomeranian' } },
    ],
  },
]

// Find by code, then update or create the Polish version and add the English name
const upsertByCode = async (
  payload: Payload,
  collection: 'countries' | 'regions',
  code: string,
  name: Localized,
  data: Record<string, unknown> = {},
) => {
  const { docs } = await payload.find({ collection, where: { code: { equals: code } }, limit: 1, depth: 0 })
  const args = { collection, data: { ...data, code, name: name.pl }, locale: 'pl', depth: 0 } as const
  const doc = docs[0]
    ? await payload.update({ ...args, id: docs[0].id } as Parameters<typeof payload.update>[0])
    : await payload.create(args as Parameters<typeof payload.create>[0])
  await payload.update({ collection, id: doc.id, locale: 'en', depth: 0, data: { name: name.en } })
  return doc.id as number
}

// Idempotent: safe to run on every seed. Returns region ids by ISO code
export const seedRegions = async (payload: Payload) => {
  const regionIds = new Map<string, { id: number; country: number }>()
  for (const country of countries) {
    const countryId = await upsertByCode(payload, 'countries', country.code, country.name)
    for (const region of country.regions) {
      const id = await upsertByCode(payload, 'regions', region.code, region.name, { country: countryId })
      regionIds.set(region.code, { id, country: countryId })
    }
  }
  return regionIds
}
