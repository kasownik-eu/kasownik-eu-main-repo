import {
  CheckIcon,
  ChevronRightIcon,
  type LucideIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import type { OperatorSummary, RelatedView } from '@/content'
import type { ticketValidities } from '@/content/enums'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'

import { initials } from './format'
import { ModeBadges } from './ModeBadges'
import { OperatorLogo } from './OperatorLogo'
import { Section } from './Section'
import { ShowMoreList } from './ShowMoreList'

type Props = {
  related: RelatedView[]
  // Other operators of the same city that the main operator has no relation entry for
  sameCity?: OperatorSummary[]
  // Cards shown before "Show all"
  visible?: number
}

type Related = Omit<RelatedView, 'operator'>

// A same-city operator has no relation entry, so no ticket-validity row
type Item = { key: string; operator: OperatorSummary; row?: Related }

const VISIBLE = 3

const validityIcons: Record<(typeof ticketValidities)[number], LucideIcon> = {
  valid: CheckIcon,
  partial: TriangleAlertIcon,
  invalid: XIcon,
}

// "Jeździ też w": the editor's text wins over the list of cities the carrier serves
const coverageOf = (operator: OperatorSummary, row?: Related) =>
  row?.coverage || operator.cities.map((city) => city.name).join(', ')

async function RelatedCard({ row, operator }: Omit<Item, 'key'>) {
  const t = await getTranslations('RelatedOperators')
  const tHeader = await getTranslations('OperatorHeader')
  const { logo } = operator
  const coverage = coverageOf(operator, row)
  const Icon = row && validityIcons[row.ticketValidity]

  return (
    <Card className="relative h-full gap-0 overflow-hidden py-0 has-[a:hover]:bg-highlight">
      <div className="grid grid-cols-[3.5rem_1fr] items-center gap-4 px-5 pt-5 pb-3">
        <OperatorLogo
          logo={logo}
          fallback={operator.shortName || initials(operator.name)}
          label={tHeader('logoAlt', { operator: operator.name })}
          className="size-14 text-lg"
          padding="p-1.5"
        />
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
        {coverage && (
          <p className="text-sm text-muted-foreground">{t('alsoRunsIn', { places: coverage })}</p>
        )}
        <ModeBadges modes={operator.transportModes} />
      </div>

      {row && Icon ? (
        <div className="grid flex-1 grid-cols-[1.25rem_1fr] content-start gap-x-2.5 border-t-2 bg-muted px-5 py-3">
          <Icon aria-hidden="true" className="mt-0.5 size-5" />
          <p className="text-[0.9375rem] leading-snug font-semibold">
            {t(`validity.${row.ticketValidity}`)}
          </p>
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
export async function RelatedOperators({ related, sameCity = [], visible = VISIBLE }: Props) {
  const rows: Item[] = related.map(({ operator, ...row }) => ({
    key: operator.slug,
    row,
    operator,
  }))
  const listed = new Set(rows.map((item) => item.operator.slug))
  const items: Item[] = [
    ...sameCity
      .filter((operator) => !listed.has(operator.slug))
      .map((operator) => ({ key: `city-${operator.slug}`, operator })),
    ...rows,
  ]
  if (!items.length) return null

  const t = await getTranslations('RelatedOperators')
  const cards = items.map(({ key, row, operator }) => (
    <RelatedCard key={key} row={row} operator={operator} />
  ))

  return (
    <Section id="related" title={t('title')} lead={t('lead')}>
      <ShowMoreList
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        visible={cards.slice(0, visible)}
        hidden={cards.slice(visible)}
        showAllLabel={t('showAll', { count: items.length })}
        showLessLabel={t('showLess')}
      />
    </Section>
  )
}
