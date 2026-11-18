import { getTranslations, setRequestLocale } from 'next-intl/server'
import React from 'react'

import { RenderTemplate } from '@/blocks/RenderTemplate'
import { getTemplate } from '@/content'
import type { Locale } from '@/i18n/routing'

export const homePage = (locale: Locale) => ({
  async generateMetadata() {
    const t = await getTranslations({ locale, namespace: 'Metadata' })
    return { title: t('homeTitle'), description: t('homeDescription') }
  },

  Page() {
    setRequestLocale(locale)
    return (
      <RenderTemplate
        template={getTemplate('home')}
        ctx={{ page: 'home', locale }}
      />
    )
  },
})
