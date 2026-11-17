import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import React from 'react'

import { CityBreadcrumbs, OperatorContent, RelatedOperators, SourceFooter } from '@/components/city'
import { getCity, getCitySlugs, getOperator } from '@/content'
import type { Locale } from '@/i18n/routing'

type Props = {
  params: Promise<{ slug: string }>
}

// The city is an entry point: the main operator's content fills it, other operators of the city show as related
export const cityPage = (locale: Locale) => ({
  generateStaticParams: () => getCitySlugs().map((slug) => ({ slug })),

  async generateMetadata({ params }: Props) {
    const city = getCity((await params).slug, locale)
    if (!city) return {}

    const t = await getTranslations({ locale, namespace: 'Metadata' })
    return { title: t('cityTitle', { city: city.name }) }
  },

  async Page({ params }: Props) {
    setRequestLocale(locale)

    const city = getCity((await params).slug, locale)
    if (!city) notFound()

    // Every listed operator exists: the content loader rejects dangling references
    const [operator, ...sameCity] = city.operators.map((slug) => getOperator(slug, locale)!)

    return (
      <>
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <CityBreadcrumbs city={city.name} region={city.region} />

          <main id="main" tabIndex={-1} className="outline-none">
            <OperatorContent operator={operator} label={city.name} />
            <RelatedOperators related={operator.related} sameCity={sameCity} />
          </main>
        </div>

        <SourceFooter sources={operator.sources} verifiedAt={operator.verifiedAt} />
      </>
    )
  },
})
