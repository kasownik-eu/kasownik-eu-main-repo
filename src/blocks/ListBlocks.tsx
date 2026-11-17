import { getTranslations } from 'next-intl/server'
import React from 'react'

import { CitiesBrowser, type CityGroup } from '@/components/cities/CitiesBrowser'
import { CountrySelect } from '@/components/cities/CountrySelect'
import { initials } from '@/components/city/format'
import { OperatorsBrowser, type OperatorItem } from '@/components/operators/OperatorsBrowser'
import { LineMark } from '@/components/site/decor'
import { SiteFooter } from '@/components/site/SiteFooter'

import type { BlockProps, PageContext } from './types'

const REPORT_URL = '#'

const messagesOf = (ctx: PageContext<'cities' | 'operators'>) =>
  getTranslations(ctx.page === 'cities' ? 'CitiesList' : 'OperatorsList')

export async function PageHeadingBlock({ ctx, block }: BlockProps<'pageHeading'>) {
  const t = await messagesOf(ctx)

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="flex-[1_1_26rem]">
        <h1 className="flex items-center gap-3.5 text-4xl leading-tight font-extrabold tracking-tight">
          <LineMark size="lg" />
          <span>{t('title')}</span>
        </h1>
        <p className="mt-2 max-w-[62ch] text-lg text-muted-foreground">{t('lead')}</p>
      </div>
      {block.countrySelect && <CountrySelect />}
    </div>
  )
}

// Grouped by region, sorted by the locale's collation; cities without a region go last
export async function CitiesBrowserBlock({ ctx }: BlockProps<'citiesBrowser'>) {
  const t = await getTranslations('CitiesList')
  const otherRegion = t('otherRegion')
  const byRegion = new Map<string, CityGroup>()
  for (const city of ctx.cities) {
    const name = city.region || otherRegion
    if (!byRegion.has(name)) byRegion.set(name, { id: `region-${byRegion.size}`, name, cities: [] })
    byRegion.get(name)!.cities.push({ name: city.name, slug: city.slug })
  }
  const groups = [...byRegion.values()].sort((a, b) =>
    a.name === otherRegion
      ? 1
      : b.name === otherRegion
        ? -1
        : a.name.localeCompare(b.name, ctx.locale),
  )

  return groups.length === 0 ? (
    <p className="mt-6 text-muted-foreground">{t('empty')}</p>
  ) : (
    <CitiesBrowser groups={groups} reportUrl={REPORT_URL} />
  )
}

export async function OperatorsBrowserBlock({ ctx }: BlockProps<'operatorsBrowser'>) {
  const t = await getTranslations('OperatorsList')
  const operators: OperatorItem[] = ctx.operators.map((operator) => ({
    name: operator.name,
    slug: operator.slug,
    fallback: operator.shortName || initials(operator.name),
    logo: operator.logo,
    modes: operator.transportModes,
    // The regions of the cities it serves (an operator may cross voivodeship borders), else its own
    region:
      [...new Set(operator.cities.flatMap((city) => city.region || []))].join(', ') ||
      operator.region ||
      '',
    cities: operator.cities.map(({ slug, name }) => ({ slug, name })),
  }))

  return operators.length === 0 ? (
    <p className="mt-6 text-muted-foreground">{t('empty')}</p>
  ) : (
    <OperatorsBrowser operators={operators} reportUrl={REPORT_URL} />
  )
}

export async function ListFooterBlock({ ctx }: BlockProps<'listFooter'>) {
  const t = await messagesOf(ctx)

  return (
    <SiteFooter actionLabel={t('reportMissing')} actionHref={REPORT_URL}>
      <p>{t('footerNote')}</p>
    </SiteFooter>
  )
}
