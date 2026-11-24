'use client'

import { REPORT_URL } from '@/lib/links'
import { ChevronRightIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { StopDot } from '@/components/site/decor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
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

export type CityGroup = {
  id: string
  name: string
  cities: {
    slug: string
    name: string
  }[]
}

type Props = {
  groups: CityGroup[]
  reportUrl?: string
}

// The list follows the site search: the same data and matching as the search bar above it
// (a region name matches all of its cities)
export function CitiesBrowser({ groups, reportUrl = REPORT_URL }: Props) {
  const t = useTranslations('CitiesList')
  const [query, setQuery] = useState('')
  const { hits, active, status } = useSearch(query)

  const visible = useMemo(() => {
    if (!active || !hits) return groups
    const found = new Set(hits.flatMap((hit) => (hit.kind === 'city' ? hit.slug : [])))
    return groups.flatMap((group) => {
      const cities = group.cities.filter((city) => found.has(city.slug))
      return cities.length ? [{ ...group, cities }] : []
    })
  }, [groups, hits, active])
  const total = visible.reduce((sum, group) => sum + group.cities.length, 0)

  return (
    <>
      <div className="relative z-10 mt-6">
        <SiteSearch query={query} onQueryChange={setQuery} />
        <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">
          {active && status === 'loading'
            ? null
            : active
              ? t('statusFound', { count: total })
              : t('statusAll', { cities: total, regions: visible.length })}
        </p>
      </div>

      {visible.length === 0 ? (
        <Empty className="mt-6 rounded-[14px] border-2 border-solid py-12">
          <EmptyHeader>
            <EmptyTitle className="text-xl">
              {t('noResultsTitle', { query: query.trim() })}
            </EmptyTitle>
            <EmptyDescription className="text-base">{t('noResultsDescription')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row flex-wrap justify-center">
            <Button variant="outline" size="lg" onClick={() => setQuery('')}>
              {t('clearSearch')}
            </Button>
            <Button size="lg" nativeButton={false} render={<a href={reportUrl} target="_blank" rel="noopener noreferrer" />}>
              {t('reportMissing')}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="mt-6 grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((group) => (
            <section key={group.id} aria-labelledby={group.id}>
              <Card className="gap-0 py-0 shadow-xs">
                <CardHeader className="flex items-center justify-between gap-3 border-b-2 bg-highlight px-5 py-3.5 [.border-b]:pb-3.5">
                  <CardTitle className="text-lg font-semibold">
                    <h2 id={group.id}>{group.name}</h2>
                  </CardTitle>
                  <Badge className="h-auto rounded-full border-border px-3 text-[0.8125rem] font-bold">
                    {group.cities.length}
                  </Badge>
                </CardHeader>
                <ul>
                  {group.cities.map((city) => (
                    <li key={city.slug} className="border-b last:border-b-0">
                      <Link
                        href={{ pathname: '/city/[slug]', params: { slug: city.slug } }}
                        className="group flex min-h-14 items-center justify-between gap-3 px-5 py-2 text-lg font-medium hover:bg-highlight"
                      >
                        <span className="flex items-center gap-3">
                          <StopDot />
                          <span>{city.name}</span>
                        </span>
                        <ChevronRightIcon
                          aria-hidden="true"
                          className="size-5 shrink-0 text-muted-foreground motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
