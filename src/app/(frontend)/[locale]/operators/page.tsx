import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getPayload } from 'payload'
import React from 'react'

import { CountrySelect } from '@/components/cities/CountrySelect'
import { initials, mediaUrl } from '@/components/city/format'
import { OperatorsBrowser, type OperatorItem } from '@/components/operators/OperatorsBrowser'
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
import { regionName } from '@/lib/regions'
import config from '@/payload.config'

type Props = {
  params: Promise<{ locale: Locale }>
}

const REPORT_URL = '#'

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Metadata' })

  return { title: t('operatorsTitle') }
}

export default async function OperatorsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('OperatorsList')
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'operators',
    locale,
    select: { name: true, shortName: true, slug: true, logo: true, transportModes: true, cities: true },
    populate: {
      cities: { name: true, region: true },
      regions: { name: true },
      media: { url: true, alt: true },
    },
    depth: 2,
    sort: 'name',
    pagination: false,
  })

  const operators: OperatorItem[] = docs.map((operator) => {
    const cities = (operator.cities ?? [])
      .flatMap((city) => (typeof city === 'object' ? [city] : []))
      .sort((a, b) => a.name.localeCompare(b.name, locale))
    const logo = mediaUrl(operator.logo)

    return {
      id: operator.id,
      name: operator.name,
      slug: operator.slug,
      fallback: operator.shortName || initials(operator.name),
      logo: logo ? { url: logo.url!, alt: logo.alt } : null,
      modes: operator.transportModes ?? [],
      // Regions have no field of their own on the operator: the regions of the cities it serves
      region: [...new Set(cities.flatMap((city) => regionName(city.region) || []))].join(', '),
      cities: cities.map(({ id, name }) => ({ id, name })),
    }
  })

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6">
        <Breadcrumb aria-label={t('breadcrumbs')} className="py-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/operators" />}>{t('title')}</BreadcrumbLink>
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

          {operators.length === 0 ? (
            <p className="mt-6 text-muted-foreground">{t('empty')}</p>
          ) : (
            <OperatorsBrowser operators={operators} reportUrl={REPORT_URL} />
          )}
        </main>
      </div>

      <footer className="chrome mt-16 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-4 px-4 sm:px-6">
          <p className="max-w-[70ch] flex-[1_1_20rem] text-sm text-muted-foreground">{t('footerNote')}</p>
          <Button size="lg" nativeButton={false} render={<a href={REPORT_URL} />}>
            {t('reportMissing')}
          </Button>
        </div>
      </footer>
    </>
  )
}
