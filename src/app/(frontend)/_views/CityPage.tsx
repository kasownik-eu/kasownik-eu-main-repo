import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import React from 'react'

import { RenderTemplate } from '@/blocks/RenderTemplate'
import { getCity, getCitySlugs, getOperator, getTemplate } from '@/content'
import type { Locale } from '@/i18n/routing'

type Props = {
  params: Promise<{ slug: string }>
}

// The city is an entry point: the primary operator's content and template fill it, other operators show as related
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
      <RenderTemplate
        template={getTemplate('city', operator.templates.city)}
        ctx={{ page: 'city', locale, city, operator, sameCity }}
      />
    )
  },
})
