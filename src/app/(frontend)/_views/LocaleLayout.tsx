import { NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Inter } from 'next/font/google'
import React from 'react'

import '../globals.css'

import { SiteHeader } from '@/components/site/SiteHeader'
import { getSearchSource } from '@/content'
import { SearchSourceProvider } from '@/search/useSearch'
import type { Locale } from '@/i18n/routing'

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-sans' })

// Each locale is its own root layout (app/(frontend)/<locale>/layout.tsx): a static export has no middleware
// to rewrite localized URLs, so every locale gets real folders with its own path names
export const localeLayout = (locale: Locale) => ({
  async generateMetadata() {
    const t = await getTranslations({ locale, namespace: 'Metadata' })
    return { title: t('siteTitle') }
  },

  Layout({ children }: { children: React.ReactNode }) {
    setRequestLocale(locale)

    return (
      <html lang={locale} className={inter.variable}>
        <body className="min-h-screen antialiased">
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
