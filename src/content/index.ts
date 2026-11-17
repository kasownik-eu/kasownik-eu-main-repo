import { defaultLocale, type locales, type TransportMode } from './enums'
import type { Block, PageKind, Template } from '@/blocks/schema'

import { DEFAULT_TEMPLATE, getCatalog, type RawCity, type RawOperator } from './load'
import type {
  ImageRef,
  LocalizedText,
  OperatorFile,
  PurchaseFile,
  TicketsFile,
  ZonesFile,
} from './schema'

// Read-only access to the JSON content for pages, resolved to one locale

export type Locale = (typeof locales)[number]

// Every { pl, en } becomes a plain string in the requested locale
export type Localized<T> = T extends LocalizedText
  ? string
  : T extends readonly (infer U)[]
    ? Localized<U>[]
    : T extends object
      ? { [K in keyof T]: Localized<T[K]> }
      : T

const isLocalizedText = (value: object): value is LocalizedText =>
  typeof (value as LocalizedText).pl === 'string' &&
  Object.keys(value).every((key) => key === 'pl' || key === 'en')

export const pickLocale = (text: LocalizedText, locale: Locale) =>
  locale === defaultLocale ? text.pl : (text[locale] ?? text.pl)

export const localize = <T>(value: T, locale: Locale): Localized<T> => {
  if (Array.isArray(value)) return value.map((item) => localize(item, locale)) as Localized<T>
  if (value && typeof value === 'object') {
    if (isLocalizedText(value)) return pickLocale(value, locale) as Localized<T>
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, localize(item, locale)]),
    ) as Localized<T>
  }
  return value as Localized<T>
}

export type MediaView = { url: string; alt: string | null }
export type CityRef = { slug: string; name: string; region: string | null }

export type OperatorSummary = {
  slug: string
  name: string
  shortName: string | null
  logo: MediaView | null
  transportModes: TransportMode[]
  // The voivodeship folder the operator lives in
  region: string | null
  cities: CityRef[]
}

export type PurchaseMethodView = Omit<Localized<PurchaseFile[number]>, 'validationPhotos'> & {
  validationPhotos: { image: MediaView; caption: string; alt: string | null }[]
}
export type TicketView = Localized<TicketsFile['tickets'][number]>
export type LuggageView = Localized<NonNullable<TicketsFile['luggage']>[number]>
export type ZonesView = Omit<Localized<ZonesFile>, 'map'> & { map: MediaView | null }
export type RelatedView = Omit<
  Localized<NonNullable<OperatorFile['related']>[number]>,
  'operator'
> & {
  operator: OperatorSummary
}
export type SourcesView = Localized<NonNullable<OperatorFile['sources']>>

export type OperatorView = OperatorSummary & {
  sampleData: boolean
  label: string | null
  description: string | null
  websiteUrl: string | null
  timetableUrl: string | null
  zoneCount: number | null
  currency: string
  paymentInfo: string | null
  hotline: string | null
  servicePoint: string | null
  verifiedAt: string | null
  purchaseMethods: PurchaseMethodView[]
  tickets: TicketView[]
  luggage: LuggageView[]
  rulesNote: string | null
  rulesUrl: string | null
  zones: ZonesView | null
  related: RelatedView[]
  sources: SourcesView | null
  // Template names for the operator's city and operator pages
  templates: { city: string; operator: string }
  // The operator's own content parts, still in both locales (blocks are localized when rendered)
  blocks: Block[]
}

export type CityView = {
  slug: string
  name: string
  region: string | null
  // Primary operator first
  operators: string[]
}

// Images are copied to public/media/<operator>/ by src/scripts/copyImages.ts (predev / prebuild)
export const MEDIA_DIR = 'media'
export const mediaPath = (operator: string, file: string) => `/${MEDIA_DIR}/${operator}/${file}`

const text = (value: LocalizedText | null | undefined, locale: Locale) =>
  value ? pickLocale(value, locale) : null

const media = (
  operator: RawOperator,
  image: ImageRef | null | undefined,
  locale: Locale,
): MediaView | null =>
  image ? { url: mediaPath(operator.slug, image.file), alt: text(image.alt, locale) } : null

const byName = (locale: Locale) => (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, locale)

const regionName = (voivodeship: string, locale: Locale) => {
  const region = getCatalog().voivodeships.get(voivodeship)
  return region ? pickLocale(region.name, locale) : null
}

const cityRef = (city: RawCity, locale: Locale): CityRef => ({
  slug: city.slug,
  name: pickLocale(city.name, locale),
  region: regionName(city.voivodeship, locale),
})

const summary = (operator: RawOperator, locale: Locale): OperatorSummary => {
  const { cities } = getCatalog()
  return {
    slug: operator.slug,
    name: operator.info.name,
    shortName: operator.info.shortName ?? null,
    logo: media(operator, operator.info.logo, locale),
    transportModes: operator.info.transportModes ?? [],
    region: regionName(operator.voivodeship, locale),
    cities: operator.cities
      .map((entry) => cityRef(cities.get(entry.slug)!, locale))
      .sort(byName(locale)),
  }
}

const view = (operator: RawOperator, locale: Locale): OperatorView => {
  const { info, tickets, zones } = operator
  const { operators } = getCatalog()

  return {
    ...summary(operator, locale),
    sampleData: Boolean(info.sampleData),
    label: text(info.label, locale),
    description: text(info.description, locale),
    websiteUrl: info.websiteUrl ?? null,
    timetableUrl: info.timetableUrl ?? null,
    zoneCount: info.zoneCount ?? null,
    currency: info.currency || 'PLN',
    paymentInfo: text(info.paymentInfo, locale),
    hotline: info.hotline ?? null,
    servicePoint: text(info.servicePoint, locale),
    verifiedAt: info.verifiedAt ?? null,
    purchaseMethods: operator.purchase.map(({ validationPhotos, ...method }) => ({
      ...localize(method, locale),
      validationPhotos: (validationPhotos ?? []).map((photo) => ({
        image: media(operator, photo.image, locale)!,
        caption: pickLocale(photo.caption, locale),
        alt: text(photo.alt, locale),
      })),
    })),
    tickets: localize(tickets?.tickets ?? [], locale),
    luggage: localize(tickets?.luggage ?? [], locale),
    rulesNote: text(tickets?.rulesNote, locale),
    rulesUrl: tickets?.rulesUrl ?? null,
    zones: zones
      ? {
          ...localize({ ...zones, map: undefined }, locale),
          map: media(operator, zones.map, locale),
        }
      : null,
    related: (info.related ?? []).map((row) => ({
      ...localize(row, locale),
      operator: summary(operators.get(row.operator)!, locale),
    })),
    sources: info.sources ? localize(info.sources, locale) : null,
    templates: {
      city: info.templates?.city ?? DEFAULT_TEMPLATE,
      operator: info.templates?.operator ?? DEFAULT_TEMPLATE,
    },
    blocks: info.blocks ?? [],
  }
}

export const getOperatorSlugs = () => [...getCatalog().operators.keys()]

export const getOperator = (slug: string, locale: Locale): OperatorView | null => {
  const operator = getCatalog().operators.get(slug)
  return operator ? view(operator, locale) : null
}

export const getOperatorSummaries = (locale: Locale): OperatorSummary[] =>
  [...getCatalog().operators.values()]
    .map((operator) => summary(operator, locale))
    .sort(byName(locale))

export const getCitySlugs = () => [...getCatalog().cities.keys()]

export const getCity = (slug: string, locale: Locale): CityView | null => {
  const city = getCatalog().cities.get(slug)
  return city ? { ...cityRef(city, locale), operators: city.operators } : null
}

// Only cities some operator serves exist at all, so every one has a page
export const getCities = (locale: Locale): CityRef[] =>
  [...getCatalog().cities.values()].map((city) => cityRef(city, locale)).sort(byName(locale))

// Every city and operator in every country, for the site-wide search (the home page)
export type SearchEntry = {
  kind: 'city' | 'operator'
  slug: string
  name: string
  country: string | null
}

export const getSearchIndex = (locale: Locale): SearchEntry[] => {
  const { countries, cities, operators } = getCatalog()
  const countryName = (slug: string) => {
    const country = countries.find((entry) => entry.slug === slug)
    return country ? pickLocale(country.name, locale) : null
  }
  return [
    ...[...cities.values()].map((city) => ({
      kind: 'city' as const,
      slug: city.slug,
      name: pickLocale(city.name, locale),
      country: countryName(city.country),
    })),
    ...[...operators.values()].map((operator) => ({
      kind: 'operator' as const,
      slug: operator.slug,
      name: operator.info.name,
      country: countryName(operator.country),
    })),
  ].sort(byName(locale))
}

// The loader guarantees every page kind has a default and that operators only name existing templates
export const getTemplate = (page: PageKind, name: string = DEFAULT_TEMPLATE): Template => {
  const template = getCatalog().templates[page].get(name)
  if (!template) throw new Error(`Template "${name}" for ${page} pages does not exist`)
  return template
}
