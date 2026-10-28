import { TriangleAlertIcon } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React, { cache } from 'react'

import {
  CityBreadcrumbs,
  OperatorHeader,
  PurchaseMethods,
  SourceFooter,
  TicketTabs,
  ZoneInfo,
} from '@/components/city'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { Locale } from '@/i18n/routing'
import config from '@/payload.config'

type Props = {
  params: Promise<{ locale: Locale; slug: string }>
}

const getCity = cache(async (slug: string, locale: Locale) => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'cities',
    where: { slug: { equals: slug } },
    locale,
    limit: 1,
    depth: 1,
  })

  return docs[0] ?? null
})

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params
  const city = await getCity(slug, locale)
  if (!city) return {}

  const t = await getTranslations({ locale, namespace: 'Metadata' })
  return { title: t('cityTitle', { city: city.name }) }
}

// Same modules in the same order for every city; only the content differs
export default async function CityPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const city = await getCity(slug, locale)
  if (!city) notFound()

  const t = await getTranslations('CityPage')

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <CityBreadcrumbs city={city.name} region={city.regionPath} />

        <main id="main" tabIndex={-1} className="outline-none">
          {city.sampleData && (
            <Alert role="note" className="mb-4 px-4 py-3">
              <TriangleAlertIcon aria-hidden="true" />
              <AlertTitle>{t('sampleDataTitle')}</AlertTitle>
              <AlertDescription>{t('sampleDataDescription')}</AlertDescription>
            </Alert>
          )}

          <OperatorHeader operator={city.operator} />
          <PurchaseMethods methods={city.purchaseMethods} operator={city.operator} />
          <TicketTabs
            tickets={city.tickets}
            luggage={city.luggage}
            rulesNote={city.rulesNote}
            rulesUrl={city.rulesUrl}
            currency={city.operator.currency || 'PLN'}
          />
          <ZoneInfo zones={city.zones} />
        </main>
      </div>

      <SourceFooter sources={city.sources} verifiedAt={city.operator.verifiedAt} />
    </>
  )
}
