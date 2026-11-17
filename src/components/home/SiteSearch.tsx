'use client'

import { ChevronRightIcon, SearchIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React, { useId, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SearchEntry } from '@/content'
import { Link, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

// More would turn the panel into a second list page; the status line still gives the full count
const MAX_RESULTS = 8

// Case- and diacritic-insensitive, so "lodz" finds "Łódź" ("ł" has no NFD decomposition)
const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')

const hrefOf = (entry: SearchEntry) =>
  entry.kind === 'city'
    ? ({ pathname: '/city/[slug]', params: { slug: entry.slug } } as const)
    : ({ pathname: '/operator/[slug]', params: { slug: entry.slug } } as const)

type Props = {
  entries: SearchEntry[]
  className?: string
}

// One search over every city and operator in every country; Enter opens the first result
export function SiteSearch({ entries, className }: Props) {
  const t = useTranslations('SiteSearch')
  const router = useRouter()
  const id = useId()
  const [query, setQuery] = useState('')

  const normalizedQuery = normalize(query.trim())
  const found = useMemo(
    () =>
      normalizedQuery
        ? entries.filter((entry) => normalize(entry.name).includes(normalizedQuery))
        : [],
    [entries, normalizedQuery],
  )
  const status = normalizedQuery
    ? found.length
      ? t('found', { count: found.length })
      : t('noResults')
    : ''

  return (
    <form
      role="search"
      className={cn('grid max-w-180 gap-2', className)}
      onSubmit={(event) => {
        event.preventDefault()
        if (found[0]) router.push(hrefOf(found[0]))
      }}
    >
      <Label htmlFor={`${id}-q`} className="text-lg font-semibold">
        {t('label')}
      </Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={`${id}-q`}
          type="search"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-describedby={`${id}-hint`}
          className="h-14 rounded-[6px] border-2 bg-background px-4 text-lg sm:flex-1 md:text-lg dark:bg-background [&::-webkit-search-cancel-button]:hidden"
        />
        <Button type="submit" size="lg" className="h-14 border-foreground px-6 text-[1.0625rem] font-bold">
          <SearchIcon aria-hidden="true" className="size-5" strokeWidth={2.5} />
          {t('submit')}
        </Button>
      </div>
      <p id={`${id}-hint`} className="text-sm opacity-85">
        {t('hint')}
      </p>
      <p role="status" className="sr-only">
        {status}
      </p>

      {normalizedQuery && (
        <div className="overflow-hidden rounded-[10px] border-2 bg-background text-foreground">
          <p aria-hidden="true" className="bg-muted px-4 py-2.5 text-sm font-semibold">
            {status}
          </p>
          {found.length > 0 && (
            <ul>
              {found.slice(0, MAX_RESULTS).map((entry) => (
                <li key={`${entry.kind}-${entry.slug}`} className="border-t">
                  <Link
                    href={hrefOf(entry)}
                    className="group flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2 hover:bg-highlight"
                  >
                    <span className="min-w-0 flex-[1_1_10rem] text-[1.0625rem] font-semibold">
                      {entry.name}
                    </span>
                    <Badge
                      variant={entry.kind === 'city' ? 'default' : 'outline'}
                      className="h-auto rounded-[6px] border-foreground px-2.5 text-[0.8125rem] font-semibold"
                    >
                      {t(`kind.${entry.kind}`)}
                    </Badge>
                    {entry.country && (
                      <span className="text-sm text-muted-foreground">{entry.country}</span>
                    )}
                    <ChevronRightIcon
                      aria-hidden="true"
                      className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  )
}
