import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import React from 'react'

import { CityBreadcrumbs, OperatorContent, RelatedOperators, ServedCities, SourceFooter } from '@/components/city'
import type { Locale } from '@/i18n/routing'
import { getOperator, getOperatorSlugs } from '@/content'

type Props = {
  params: Promise<{ slug: string }>
}

// The operator's own page: target of related-carrier cards and home of carriers that serve no city
export const operatorPage = (locale: Locale) => ({
  generateStaticParams: () => getOperatorSlugs().map((slug) => ({ slug })),

  async generateMetadata({ params }: Props) {
    const operator = getOperator((await params).slug, locale)
    if (!operator) return {}

    const t = await getTranslations({ locale, namespace: 'Metadata' })
    return { title: t('operatorTitle', { operator: operator.name }) }
  },

  async Page({ params }: Props) {
    setRequestLocale(locale)

    const operator = getOperator((await params).slug, locale)
    if (!operator) notFound()

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <CityBreadcrumbs city={operator.name} section="operators" />

        <main id="main" tabIndex={-1} className="outline-none">
          <OperatorContent operator={operator} />
          <ServedCities cities={operator.cities} />
          <RelatedOperators related={operator.related} />
        </main>
      </div>

      <SourceFooter sources={operator.sources} verifiedAt={operator.verifiedAt} />
    </>
  )
  },
})
