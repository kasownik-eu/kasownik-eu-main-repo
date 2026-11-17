import { getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import { RenderTemplate } from '@/blocks/RenderTemplate'
import { getOperatorSummaries, getTemplate } from '@/content'
import type { Locale } from '@/i18n/routing'

export const operatorsPage = (locale: Locale) => ({
  async generateMetadata() {
    const t = await getTranslations({ locale, namespace: 'Metadata' })
    return { title: t('operatorsTitle') }
  },

  Page() {
    setRequestLocale(locale)
    return (
      <RenderTemplate
        template={getTemplate('operators')}
        ctx={{ page: 'operators', locale, operators: getOperatorSummaries(locale) }}
      />
    )
  },
})
