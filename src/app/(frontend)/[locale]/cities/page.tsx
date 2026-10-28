import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getPayload } from 'payload'
import React from 'react'

import { CitiesBrowser, type CityGroup } from '@/components/cities/CitiesBrowser'
import { CountrySelect } from '@/components/cities/CountrySelect'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import config from '@/payload.config'

type Props = {
  params: Promise<{ locale: Locale }>
}

const REPORT_URL = '#'

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Metadata' })

  return { title: t('citiesTitle') }
}

export default async function CitiesPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('CitiesList')
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'cities',
    locale,
    select: { name: true, slug: true, regionPath: true },
    sort: 'name',
    limit: 200,
  })

  // Group by region, sorted by the locale's collation; cities without a region go last
  const otherRegion = t('otherRegion')
  const byRegion = new Map<string, CityGroup>()
  for (const city of docs) {
    const name = city.regionPath || otherRegion
    if (!byRegion.has(name)) byRegion.set(name, { id: `region-${byRegion.size}`, name, cities: [] })
    byRegion.get(name)!.cities.push({ id: city.id, name: city.name, slug: city.slug })
  }
  const groups = [...byRegion.values()].sort((a, b) =>
    a.name === otherRegion ? 1 : b.name === otherRegion ? -1 : a.name.localeCompare(b.name, locale),
  )

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6">
        <Breadcrumb aria-label={t('breadcrumbs')} className="py-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/cities" />}>{t('title')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">{t('countryPoland')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <main id="main" tabIndex={-1} className="outline-none">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div className="flex-[1_1_26rem]">
              <h1 className="text-4xl leading-tight font-extrabold tracking-tight">{t('title')}</h1>
              <p className="mt-2 max-w-[62ch] text-lg text-muted-foreground">{t('lead')}</p>
            </div>
            <CountrySelect />
          </div>

          {docs.length === 0 ? (
            <p className="mt-6 text-muted-foreground">{t('empty')}</p>
          ) : (
            <CitiesBrowser groups={groups} reportUrl={REPORT_URL} />
          )}
        </main>
      </div>

      <footer className="mt-16 border-t py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-4 px-4 sm:px-6">
          <p className="max-w-[70ch] flex-[1_1_20rem] text-sm text-muted-foreground">
            {t('footerNote')}
          </p>
          <Button variant="outline" size="lg" nativeButton={false} render={<a href={REPORT_URL} />}>
            {t('reportMissing')}
          </Button>
        </div>
      </footer>
    </>
  )
}
