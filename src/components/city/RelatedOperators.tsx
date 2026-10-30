import { CheckIcon, ChevronRightIcon, type LucideIcon, TriangleAlertIcon, XIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import type { ticketValidities } from '@/collections/Operators'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import type { Operator } from '@/payload-types'

import { initials, mediaUrl } from './format'
import { ModeBadges } from './ModeBadges'
import { Section } from './Section'
import { ShowMoreList } from './ShowMoreList'

type Props = {
  related: Operator['relatedOperators']
  // Other operators of the same city that the main operator has no relation entry for
  sameCity?: Operator[]
}

type Related = NonNullable<Operator['relatedOperators']>[number]

// A same-city operator has no relation entry, so no ticket-validity row
type Item = { key: string | number; operator: Operator; row?: Related }

const VISIBLE = 3

const validityIcons: Record<(typeof ticketValidities)[number], LucideIcon> = {
  valid: CheckIcon,
  partial: TriangleAlertIcon,
  invalid: XIcon,
}

// "Jeździ też w": the editor's text wins over the list of cities the carrier serves
const coverageOf = (operator: Operator, row?: Related) =>
  row?.coverage ||
  (operator.cities ?? [])
    .flatMap((city) => (typeof city === 'object' ? [city.name] : []))
    .join(', ')

async function RelatedCard({ row, operator }: Omit<Item, 'key'>) {
  const t = await getTranslations('RelatedOperators')
  const tHeader = await getTranslations('OperatorHeader')
  const logo = mediaUrl(operator.logo)
  const coverage = coverageOf(operator, row)
  const Icon = row && validityIcons[row.ticketValidity]

  return (
    <Card className="relative h-full gap-0 overflow-hidden py-0 has-[a:hover]:bg-highlight">
      <div className="grid grid-cols-[3.5rem_1fr] items-center gap-4 px-5 pt-5 pb-3">
        <Avatar className="size-14 rounded-[10px] after:rounded-[10px]">
          {logo && (
            <AvatarImage
              src={logo.url!}
              alt={logo.alt || tHeader('logoAlt', { operator: operator.name })}
              className="rounded-[10px] object-contain"
            />
          )}
          <AvatarFallback
            className="rounded-[10px] bg-primary text-lg font-bold text-primary-foreground ring-2 ring-border ring-inset"
            role="img"
            aria-label={tHeader('logoAlt', { operator: operator.name })}
          >
            {operator.shortName || initials(operator.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <Badge variant="outline" className="mb-1.5 text-[0.8125rem]">
            {t(`relation.${row?.relation ?? 'sameCity'}`)}
          </Badge>
          <h3 className="text-lg leading-snug font-semibold">
            <Link
              href={{ pathname: '/operator/[slug]', params: { slug: operator.slug } }}
              className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
            >
              {operator.name}
            </Link>
          </h3>
        </div>
      </div>

      <div className="grid gap-2 px-5 pb-4">
        {coverage && <p className="text-sm text-muted-foreground">{t('alsoRunsIn', { places: coverage })}</p>}
        <ModeBadges modes={operator.transportModes} />
      </div>

      {row && Icon ? (
        <div className="grid flex-1 grid-cols-[1.25rem_1fr] content-start gap-x-2.5 border-t-2 bg-muted px-5 py-3">
          <Icon aria-hidden="true" className="mt-0.5 size-5" />
          <p className="text-[0.9375rem] leading-snug font-semibold">{t(`validity.${row.ticketValidity}`)}</p>
          {row.note && <p className="col-start-2 text-sm text-muted-foreground">{row.note}</p>}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div
        aria-hidden="true"
        className="flex min-h-12 items-center justify-between border-t-2 px-5 text-[0.9375rem] font-medium"
      >
        {t('seeOperator')}
        <ChevronRightIcon className="size-5" />
      </div>
    </Card>
  )
}

// Other carriers in the area; the whole card links to the carrier's own page
export async function RelatedOperators({ related, sameCity = [] }: Props) {
  const rows: Item[] = (related ?? []).flatMap((row, index) =>
    typeof row.operator === 'object' ? [{ key: row.id ?? index, row, operator: row.operator }] : [],
  )
  const listed = new Set(rows.map((item) => item.operator.id))
  const items: Item[] = [
    ...sameCity.filter((operator) => !listed.has(operator.id)).map((operator) => ({ key: `city-${operator.id}`, operator })),
    ...rows,
  ]
  if (!items.length) return null

  const t = await getTranslations('RelatedOperators')
  const cards = items.map(({ key, row, operator }) => <RelatedCard key={key} row={row} operator={operator} />)

  return (
    <Section id="related" title={t('title')} lead={t('lead')}>
      <ShowMoreList
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        visible={cards.slice(0, VISIBLE)}
        hidden={cards.slice(VISIBLE)}
        showAllLabel={t('showAll', { count: items.length })}
        showLessLabel={t('showLess')}
      />
    </Section>
  )
}
