import type { Operator } from '@/payload-types'

// Extraction shapes are derived from the Payload `Operator` type so field changes surface as type errors

export type LocalizedText = { pl: string; en: string }

type Row<K extends 'tickets' | 'luggage'> = NonNullable<Operator[K]>[number]
type Zones = NonNullable<Operator['zones']>
type ZoneRow = NonNullable<Zones['items']>[number]

// Every key becomes required (the LLM must answer null explicitly); localized strings become { pl, en }
type Localized<T, K extends keyof T> = {
  [P in Exclude<keyof T, K | 'id'>]-?: Exclude<T[P], undefined>
} & {
  [P in K]-?: null extends T[P] ? LocalizedText | null : LocalizedText
}

export type TariffTicket = Localized<Row<'tickets'>, 'name' | 'validity' | 'scope' | 'whereToBuy'>
export type TariffLuggage = Localized<Row<'luggage'>, 'item' | 'note' | 'feeText' | 'conditions' | 'whereToBuy'>
export type TariffZoneItem = Localized<ZoneRow, 'name' | 'covers'>
export type TariffZones = Localized<Omit<Zones, 'map' | 'items' | 'enabled'>, 'noteTitle' | 'note'> & {
  enabled: boolean
  items: TariffZoneItem[]
}

export type TariffData = {
  tickets: TariffTicket[]
  luggage: TariffLuggage[]
  zones: TariffZones
  rulesNote: LocalizedText | null
}

export type TariffPage = { url: string; xpath?: string | null }
