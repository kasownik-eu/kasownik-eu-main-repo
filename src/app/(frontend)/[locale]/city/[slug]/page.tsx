import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React, { cache } from 'react'

import { CityBreadcrumbs, OperatorContent, RelatedOperators, SourceFooter } from '@/components/city'
import type { Locale } from '@/i18n/routing'
import { getOperatorById } from '@/lib/operators'
import config from '@/payload.config'
import type { Operator } from '@/payload-types'

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
    depth: 0,
    select: { name: true, regionPath: true, primaryOperator: true, operators: true },
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

const idOf = (value: number | Operator | null | undefined) => (typeof value === 'object' ? value?.id : value)

// The city is an entry point: the main operator's content fills it, other operators of the city show as related
export default async function CityPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const city = await getCity(slug, locale)
  if (!city) notFound()

  const operatorIds = (city.operators?.docs ?? []).flatMap((doc) => idOf(doc) ?? [])
  const primaryId = idOf(city.primaryOperator) ?? operatorIds[0]
  if (!primaryId) notFound()

  const [operator, ...sameCity] = await Promise.all(
    [primaryId, ...operatorIds.filter((id) => id !== primaryId)].map((id) => getOperatorById(id, locale)),
  )
  if (!operator) notFound()

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <CityBreadcrumbs city={city.name} region={city.regionPath} />

        <main id="main" tabIndex={-1} className="outline-none">
          <OperatorContent operator={operator} label={city.name} />
          <RelatedOperators
            related={operator.relatedOperators}
            sameCity={sameCity.filter((other): other is Operator => Boolean(other))}
          />
        </main>
      </div>

      <SourceFooter sources={operator.sources} verifiedAt={operator.verifiedAt} />
    </>
  )
}
