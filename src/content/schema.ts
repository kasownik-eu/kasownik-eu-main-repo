import { z } from 'zod'

import {
  operatorRelations,
  purchaseMethodTypes,
  ticketCategories,
  ticketValidities,
  transportModes,
} from './enums'
import { operatorBlockSchema } from '@/blocks/schema'

import { localizedText, optionalText, slug } from './primitives'

export { localizedText } from './primitives'

// Schemas of the files under data/<country>/<voivodeship>/<operator>/. Objects are strict so a typo in a key
// fails the build instead of silently hiding a field. Optional fields accept null (the tariff sync writes nulls).

const url = z.url().nullish()
const price = z.number().nonnegative().nullish()
const modes = z.array(z.enum(transportModes)).nullish()

// A file in the operator's images/ folder
export const image = z.strictObject({
  file: z.string().regex(/^[\w.-]+$/, 'A plain file name inside images/'),
  alt: optionalText,
})

export const countryFile = z.strictObject({
  code: z.string().regex(/^[A-Z]{2}$/, 'ISO 3166-1 alpha-2, e.g. "PL"'),
  name: localizedText,
})

export const voivodeshipFile = z.strictObject({
  code: z.string().regex(/^[A-Z]{2}-\w+$/, 'ISO 3166-2, e.g. "PL-24"'),
  name: localizedText,
})

export const operatorFile = z.strictObject({
  name: z.string().min(1),
  shortName: z.string().nullish(),
  // Shows a notice that names, prices and rules are made up
  sampleData: z.boolean().optional(),
  label: optionalText,
  logo: image.nullish(),
  description: optionalText,
  websiteUrl: url,
  timetableUrl: url,
  transportModes: modes,
  zoneCount: z.number().int().nonnegative().nullish(),
  currency: z.string().nullish(),
  paymentInfo: optionalText,
  hotline: z.string().nullish(),
  servicePoint: optionalText,
  verifiedAt: z.iso.date().nullish(),
  // Other carriers in the area, shown on every page of this operator
  related: z
    .array(
      z.strictObject({
        operator: slug,
        relation: z.enum(operatorRelations),
        ticketValidity: z.enum(ticketValidities),
        note: optionalText,
        coverage: optionalText,
      }),
    )
    .nullish(),
  sources: z
    .strictObject({
      items: z.array(z.strictObject({ label: localizedText, url })).nullish(),
      aiAssisted: z.boolean().optional(),
    })
    .nullish(),
  // Pages read by the tariff sync (tickets, luggage, zones, rules note)
  tariffSources: z.array(z.strictObject({ url: z.url(), xpath: z.string().nullish() })).nullish(),
  // Page templates (templates/<page>/<name>.json) for this operator's city and operator pages; default "default"
  templates: z.strictObject({ city: slug.optional(), operator: slug.optional() }).nullish(),
  // The operator's own content parts (notice, text), rendered where the template puts "operatorBlocks"
  blocks: z.array(operatorBlockSchema).nullish(),
})

// The cities this operator serves. A city may be listed by several operators; `primary` picks whose content
// fills the city page (default: the first operator by name)
export const citiesFile = z.array(
  z.strictObject({
    slug,
    name: localizedText,
    // Defaults to the operator's voivodeship (folder); set it for carriers crossing voivodeship borders
    voivodeship: slug.optional(),
    primary: z.boolean().optional(),
  }),
)

export const purchaseFile = z
  .array(
    z.strictObject({
      type: z.enum(purchaseMethodTypes),
      title: localizedText,
      subtitle: optionalText,
      requiresValidation: z.boolean(),
      buySteps: z.array(localizedText).max(6).nullish(),
      validationSteps: z.array(localizedText).max(6).nullish(),
      noValidationText: optionalText,
      validationPhotos: z
        .array(z.strictObject({ image, caption: localizedText, alt: optionalText }))
        .max(6)
        .nullish(),
    }),
  )
  .max(6)

export const ticketsFile = z.strictObject({
  tickets: z.array(
    z.strictObject({
      category: z.enum(ticketCategories),
      name: localizedText,
      validity: optionalText,
      scope: optionalText,
      transportModes: modes,
      priceNormal: price,
      priceReduced: price,
      whereToBuy: optionalText,
    }),
  ),
  luggage: z
    .array(
      z.strictObject({
        item: localizedText,
        note: optionalText,
        transportModes: modes,
        // Empty when free of charge
        fee: price,
        // Replaces the fee display, e.g. "free off-peak"
        feeText: optionalText,
        conditions: optionalText,
        whereToBuy: optionalText,
      }),
    )
    .nullish(),
  rulesNote: optionalText,
  rulesUrl: url,
})

export const zonesFile = z.strictObject({
  enabled: z.boolean(),
  map: image.nullish(),
  items: z.array(z.strictObject({ name: localizedText, covers: optionalText })).nullish(),
  noteTitle: optionalText,
  note: optionalText,
})

export type LocalizedText = z.infer<typeof localizedText>
export type ImageRef = z.infer<typeof image>
export type CountryFile = z.infer<typeof countryFile>
export type VoivodeshipFile = z.infer<typeof voivodeshipFile>
export type OperatorFile = z.infer<typeof operatorFile>
export type CitiesFile = z.infer<typeof citiesFile>
export type PurchaseFile = z.infer<typeof purchaseFile>
export type TicketsFile = z.infer<typeof ticketsFile>
export type ZonesFile = z.infer<typeof zonesFile>
