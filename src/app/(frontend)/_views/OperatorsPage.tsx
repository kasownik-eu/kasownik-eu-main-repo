import { getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import { CountrySelect } from '@/components/cities/CountrySelect'
import { initials } from '@/components/city/format'
import { OperatorsBrowser, type OperatorItem } from '@/components/operators/OperatorsBrowser'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { LineMark } from '@/components/site/decor'
import { TramStrip } from '@/components/site/TramStrip'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getOperatorSummaries } from '@/content'

const REPORT_URL = '#'

export const operatorsPage = (locale: Locale) => ({
  async generateMetadata() {
    const t = await getTranslations({ locale, namespace: 'Metadata' })
    return { title: t('operatorsTitle') }
  },

  Page: () => <OperatorsPage locale={locale} />,
})

async function OperatorsPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale)

  const t = await getTranslations('OperatorsList')
  const operators: OperatorItem[] = getOperatorSummaries(locale).map((operator) => ({
    name: operator.name,
    slug: operator.slug,
    fallback: operator.shortName || initials(operator.name),
    logo: operator.logo,
    modes: operator.transportModes,
    // The regions of the cities it serves (an operator may cross voivodeship borders), else its own
    region: [...new Set(operator.cities.flatMap((city) => city.region || []))].join(', ') || operator.region || '',
    cities: operator.cities.map(({ slug, name }) => ({ slug, name })),
  }))

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
              <h1 className="flex items-center gap-3.5 text-4xl leading-tight font-extrabold tracking-tight">
                <LineMark size="lg" />
                <span>{t('title')}</span>
              </h1>
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

      <footer className="chrome mt-16 pb-8">
        <TramStrip />
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
