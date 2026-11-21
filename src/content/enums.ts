// Stable keys stored in the JSON files; frontend labels come from messages/<locale>.json

export const locales = ['pl', 'en'] as const
export const defaultLocale = 'pl'

export const transportModes = ['tram', 'bus', 'metro', 'train', 'trolleybus', 'ferry'] as const

export const ticketCategories = ['single', 'short', 'long', 'other'] as const

// What a luggage row is about (rules for carrying it); a closed list, so a row is always one of these kinds
export const luggageTypes = ['luggage', 'bike', 'pet', 'stroller', 'other'] as const

// Decides the icon shown next to a purchase method; labels live in the method itself
export const purchaseMethodTypes = [
  'machine',
  'app',
  'office',
  'contactless',
  'metrokarta',
  'driver',
  'sms',
  'other',
] as const

// How a ride is started with a ticket: paper ticket in the validator (kasownik), scanning the QR code in the vehicle (app),
// tapping a card on the reader (payment card, Metrokarta), or nothing to do. A short hint of the method, used when the
// method has no `validate` steps of its own
export const validationKinds = ['punch', 'qr', 'tap', 'none'] as const

// A step of a purchase method: buying the ticket, or starting the ride with it (validator, QR code, card tap). Both are
// one flow on the page: a method with a `validate` step shows "requires validation"
export const stepKinds = ['buy', 'validate'] as const

// The data files whose facts evidence.json can back with a quote from an official page
export const evidenceFiles = ['operator', 'tickets', 'purchase', 'zones'] as const

export const operatorRelations = ['neighbourCity', 'sharedArea', 'regional', 'private'] as const

export const ticketValidities = ['valid', 'partial', 'invalid'] as const

export type TransportMode = (typeof transportModes)[number]
export type ValidationKind = (typeof validationKinds)[number]
export type PurchaseMethodType = (typeof purchaseMethodTypes)[number]
