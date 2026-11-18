'use client'

import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { SiteSearch } from '@/components/search/SiteSearch'
import { Link } from '@/i18n/navigation'
import { useSearch } from '@/search/useSearch'
import type { TransportMode } from '@/components/city/format'

export type OperatorItem = {
  name: string
  slug: string
  // Logo fallback: short name or initials
  fallback: string
  logo: { url: string; alt?: string | null } | null
  modes: TransportMode[]
  region: string
  cities: { slug: string; name: string }[]
}

type Props = {
  operators: OperatorItem[]
  reportUrl?: string
}

// Cities shown before "Show all cities"; operators shown before "Show more operators"
const VISIBLE_CITIES = 6
const PAGE_SIZE = 20

function OperatorCard({ operator }: { operator: OperatorItem }) {
  const t = useTranslations('OperatorsList')
  const tHeader = useTranslations('OperatorHeader')
  const tModes = useTranslations('TransportModes')
  const [open, setOpen] = useState(false)
  const href = { pathname: '/operator/[slug]', params: { slug: operator.slug } } as const

  const cityLink = (city: OperatorItem['cities'][number]) => (
    <li key={city.slug}>
      <Button
        variant="outline"
        size="lg"
        className="text-[0.9375rem]"
        nativeButton={false}
        render={<Link href={href} />}
      >
        {city.name}
        <span className="sr-only"> {t('cityLinkHint')}</span>
      </Button>
    </li>
  )

  return (
    <Card className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 p-4 shadow-xs md:grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1.6fr)] md:gap-6 md:p-5">
      <Avatar className="size-18 rounded-xl after:rounded-xl">
        {operator.logo && (
          <AvatarImage
            src={operator.logo.url}
            alt={operator.logo.alt || tHeader('logoAlt', { operator: operator.name })}
            className="rounded-xl object-contain"
          />
        )}
        <AvatarFallback
          className="rounded-xl bg-primary text-[1.375rem] font-bold text-primary-foreground ring-2 ring-border ring-inset"
          role="img"
          aria-label={tHeader('logoAlt', { operator: operator.name })}
        >
          {operator.fallback}
        </AvatarFallback>
      </Avatar>

      <div className="grid content-start gap-2">
        <h2 className="text-xl font-semibold">
          <Link href={href} className="underline underline-offset-3 hover:bg-accent">
            {operator.name}
          </Link>
        </h2>
        {operator.modes.length > 0 && (
          <span className="flex flex-wrap gap-1.5">
            {operator.modes.map((mode) => (
              <Badge
                key={mode}
                variant="secondary"
                className="h-auto rounded-md px-2.5 text-[0.8125rem]"
              >
                {tModes(mode)}
              </Badge>
            ))}
          </span>
        )}
        {operator.region && <p className="text-sm text-muted-foreground">{operator.region}</p>}
      </div>

      {operator.cities.length > 0 && (
        <div className="col-span-full md:col-span-1">
          <p className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {t('citiesCount', { count: operator.cities.length })}
          </p>
          <ul className="flex flex-wrap gap-2">
            {operator.cities.slice(0, VISIBLE_CITIES).map(cityLink)}
          </ul>
          {operator.cities.length > VISIBLE_CITIES && (
            <Collapsible open={open} onOpenChange={setOpen} className="mt-2">
              <CollapsibleContent>
                <ul className="mb-2 flex flex-wrap gap-2">
                  {operator.cities.slice(VISIBLE_CITIES).map(cityLink)}
                </ul>
              </CollapsibleContent>
              <CollapsibleTrigger
                render={
                  <Button variant="link" size="lg" className="px-0 text-[0.9375rem] underline" />
                }
              >
                {open
                  ? t('showLess')
                  : t('showAllCities', { count: operator.cities.length - VISIBLE_CITIES })}
              </CollapsibleTrigger>
            </Collapsible>
          )}
        </div>
      )}
    </Card>
  )
}

// One row per operator with the cities it serves; every link opens the operator's page.
// The list follows the site search: the same data and matching as the search bar above it
// (an operator matches by its name, short name and the cities it serves)
export function OperatorsBrowser({ operators, reportUrl = '#' }: Props) {
  const t = useTranslations('OperatorsList')
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const { hits, active, status } = useSearch(query)

  const matches = useMemo(() => {
    if (!active || !hits) return operators
    // In the order of relevance, like the search panel
    const rank = new Map(
      hits.flatMap((hit) => (hit.kind === 'operator' ? [hit.slug] : [])).map((slug, i) => [slug, i]),
    )
    return operators
      .filter((operator) => rank.has(operator.slug))
      .sort((a, b) => rank.get(a.slug)! - rank.get(b.slug)!)
  }, [operators, hits, active])

  const search = (value: string) => {
    setQuery(value)
    setLimit(PAGE_SIZE)
  }

  return (
    <>
      <div className="relative z-10 mt-6">
        <SiteSearch query={query} onQueryChange={search} />
        <p aria-live="polite" className="mt-4 mb-4 text-sm text-muted-foreground">
          {active && status === 'loading'
            ? null
            : active
              ? t('statusFound', { count: matches.length })
              : t('statusAll', { count: matches.length })}
        </p>
      </div>

      {matches.length === 0 ? (
        <Empty className="mt-6 rounded-[14px] border-2 border-solid py-12">
          <EmptyHeader>
            <EmptyTitle className="text-xl">
              {t('noResultsTitle', { query: query.trim() })}
            </EmptyTitle>
            <EmptyDescription className="text-base">{t('noResultsDescription')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row flex-wrap justify-center">
            <Button variant="outline" size="lg" onClick={() => search('')}>
              {t('clearSearch')}
            </Button>
            <Button size="lg" nativeButton={false} render={<a href={reportUrl} />}>
              {t('reportMissing')}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <ul className="grid gap-4">
            {matches.slice(0, limit).map((operator) => (
              <li key={operator.slug}>
                <OperatorCard operator={operator} />
              </li>
            ))}
          </ul>
          {matches.length > limit && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => setLimit(limit + PAGE_SIZE)}
              >
                {t('showMore')}
              </Button>
            </div>
          )}
        </>
      )}
    </>
  )
}
