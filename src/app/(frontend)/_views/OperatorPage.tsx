import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import React from 'react'

import { RenderTemplate } from '@/blocks/RenderTemplate'
import { getOperator, getOperatorSlugs, getTemplate } from '@/content'
import type { Locale } from '@/i18n/routing'

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
      <RenderTemplate
        template={getTemplate('operator', operator.templates.operator)}
        ctx={{ page: 'operator', locale, operator }}
      />
    )
  },
})
