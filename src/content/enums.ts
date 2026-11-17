// Stable keys stored in the JSON files; frontend labels come from messages/<locale>.json

export const locales = ['pl', 'en'] as const
export const defaultLocale = 'pl'

export const transportModes = ['tram', 'bus', 'metro', 'train', 'trolleybus', 'ferry'] as const

export const ticketCategories = ['single', 'short', 'long', 'other'] as const

// Decides the icon shown next to a purchase method; labels live in the method itself
export const purchaseMethodTypes = [
  'machine',
  'app',
  'office',
  'contactless',
  'driver',
  'sms',
  'other',
] as const

export const operatorRelations = ['neighbourCity', 'sharedArea', 'regional', 'private'] as const

export const ticketValidities = ['valid', 'partial', 'invalid'] as const

export type TransportMode = (typeof transportModes)[number]
