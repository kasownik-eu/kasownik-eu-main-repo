import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['pl', 'en'],
  defaultLocale: 'pl',
  // Keys are the internal app/ routes; values are the public, per-locale URLs
  pathnames: {
    '/': '/',
    '/cities': {
      pl: '/miasta',
      en: '/cities',
    },
    '/city/[slug]': {
      pl: '/miasto/[slug]',
      en: '/city/[slug]',
    },
    '/operators': {
      pl: '/przewoznicy',
      en: '/operators',
    },
    '/operator/[slug]': {
      pl: '/przewoznik/[slug]',
      en: '/operator/[slug]',
    },
  },
})

export type Locale = (typeof routing.locales)[number]
