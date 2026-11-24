import { NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Roboto } from 'next/font/google'
import React from 'react'

import '../globals.css'

import { SiteHeader } from '@/components/site/SiteHeader'
import { getSearchSource } from '@/content'
import { SearchSourceProvider } from '@/search/useSearch'
import type { Locale } from '@/i18n/routing'

const roboto = Roboto({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '700', '900'], variable: '--font-sans' })

// Each locale is its own root layout (app/(frontend)/<locale>/layout.tsx): a static export has no middleware
// to rewrite localized URLs, so every locale gets real folders with its own path names
export const localeLayout = (locale: Locale) => ({
  async generateMetadata() {
    const t = await getTranslations({ locale, namespace: 'Metadata' })
    // Follow the OS text-size setting (the root font size must stay untouched, so there is no in-page size control)
    return { title: t('siteTitle'), other: { 'text-scale': 'scale' } }
  },

  Layout({ children }: { children: React.ReactNode }) {
    setRequestLocale(locale)

    return (
      <html lang={locale} className={roboto.variable} suppressHydrationWarning>
        <body className="min-h-dvh antialiased">
          <NextIntlClientProvider>
            {/* Only the data version goes into the page; the search data itself is fetched on first use */}
            <SearchSourceProvider source={getSearchSource(locale)}>
              <SiteHeader />
              {children}
            </SearchSourceProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    )
  },
})
