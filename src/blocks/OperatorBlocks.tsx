import React from 'react'

import {
  OperatorHeader,
  PurchaseMethods,
  RelatedOperators,
  ServedCities,
  SourceFooter,
  TicketTabs,
  ZoneInfo,
} from '@/components/city'

import type { BlockProps } from './types'

// Thin wrappers: the operator modules in src/components/city fed from the page context

// On a city page the city name replaces the operator's own label
export const OperatorHeaderBlock = ({ ctx }: BlockProps<'operatorHeader'>) =>
  ctx.page === 'city' ? (
    <OperatorHeader operator={ctx.operator} label={ctx.city.name} />
  ) : (
    <OperatorHeader operator={ctx.operator} />
  )

export const PurchaseMethodsBlock = ({ ctx }: BlockProps<'purchaseMethods'>) => (
  <PurchaseMethods methods={ctx.operator.purchaseMethods} operator={ctx.operator} />
)

export const TicketsBlock = ({ ctx: { operator } }: BlockProps<'tickets'>) => (
  <TicketTabs
    tickets={operator.tickets}
    media={operator.ticketMedia}
    luggage={operator.luggage}
    rulesNote={operator.rulesNote}
    rulesUrl={operator.rulesUrl}
    currency={operator.currency}
  />
)

export const ZonesBlock = ({ ctx }: BlockProps<'zones'>) => <ZoneInfo zones={ctx.operator.zones} />

export const ServedCitiesBlock = ({ ctx }: BlockProps<'servedCities'>) => (
  <ServedCities cities={ctx.operator.cities} />
)

// On a city page the city's other operators come first, as "in this city"
export const RelatedOperatorsBlock = ({ ctx, block }: BlockProps<'relatedOperators'>) => (
  <RelatedOperators
    related={ctx.operator.related}
    sameCity={ctx.page === 'city' ? ctx.sameCity : []}
    visible={block.visible}
  />
)

export const SourceFooterBlock = ({ ctx }: BlockProps<'sourceFooter'>) => (
  <SourceFooter sources={ctx.operator.sources} verifiedAt={ctx.operator.verifiedAt} />
)
