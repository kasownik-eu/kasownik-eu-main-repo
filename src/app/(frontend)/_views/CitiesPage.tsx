import { getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import { RenderTemplate } from '@/blocks/RenderTemplate'
import { getCities, getTemplate } from '@/content'
import type { Locale } from '@/i18n/routing'

export const citiesPage = (locale: Locale) => ({
  async generateMetadata() {
    const t = await getTranslations({ locale, namespace: 'Metadata' })
    return { title: t('citiesTitle') }
  },

  Page() {
    setRequestLocale(locale)
    return (
      <RenderTemplate
        template={getTemplate('cities')}
        ctx={{ page: 'cities', locale, cities: getCities(locale) }}
      />
    )
  },
})
