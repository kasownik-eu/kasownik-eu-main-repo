'use client'

import { ChevronRightIcon, SearchIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React, { useId, useMemo, useState } from 'react'

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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Link } from '@/i18n/navigation'

export type CityGroup = {
  id: string
  name: string
  cities: {
    id: number | string
    name: string
    slug: string
  }[]
}

type Props = {
  groups: CityGroup[]
  reportUrl?: string
}

// Case- and diacritic-insensitive, so "slask" finds "Śląsk" ("ł" has no NFD decomposition)
const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')

// Matching a region name keeps all of its cities; otherwise only cities matching by name remain
function filterGroups(groups: CityGroup[], query: string) {
  if (!query) return groups

  return groups.flatMap((group) => {
    if (normalize(group.name).includes(query)) return [group]
    const cities = group.cities.filter((city) => normalize(city.name).includes(query))
    return cities.length ? [{ ...group, cities }] : []
  })
}

export function CitiesBrowser({ groups, reportUrl = '#' }: Props) {
  const t = useTranslations('CitiesList')
  const searchId = useId()
  const [query, setQuery] = useState('')

  const normalizedQuery = normalize(query.trim())
  const visible = useMemo(() => filterGroups(groups, normalizedQuery), [groups, normalizedQuery])
  const total = visible.reduce((sum, group) => sum + group.cities.length, 0)

  return (
    <>
      <div role="search" className="mt-6">
        <Label htmlFor={searchId} className="mb-1.5">
          {t('searchLabel')}
        </Label>
        <InputGroup className="h-13 rounded-[10px] bg-background shadow-xs">
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" className="size-5" />
          </InputGroupAddon>
          <InputGroupInput
            id={searchId}
            type="search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('searchPlaceholder')}
            className="text-lg md:text-lg [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-sm"
                className="size-11"
                aria-label={t('clearSearch')}
                onClick={() => setQuery('')}
              >
                <XIcon aria-hidden="true" className="size-5" />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        <p role="status" aria-live="polite" className="mt-2 text-sm text-muted-foreground">
          {normalizedQuery
            ? t('statusFound', { count: total })
            : t('statusAll', { cities: total, regions: visible.length })}
        </p>
      </div>

      {visible.length === 0 ? (
        <Empty className="mt-6 border border-dashed py-12">
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
            <Button size="lg" nativeButton={false} render={<a href={reportUrl} />}>
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
                    <li key={city.id} className="border-b last:border-b-0">
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
                          className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
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
