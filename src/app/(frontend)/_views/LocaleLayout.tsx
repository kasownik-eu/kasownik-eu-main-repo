import { NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Inter } from 'next/font/google'
import React from 'react'

import '../globals.css'

import { SiteHeader } from '@/components/site/SiteHeader'
import { getSearchSource } from '@/content'
import { SearchSourceProvider } from '@/search/useSearch'
import type { Locale } from '@/i18n/routing'

// Runs before first paint: applies the saved text size (see TextSizeControl) so A+ / A++ don't re-layout after hydration
const textSizeScript = `try{var s=localStorage.getItem('text-size');if(s==='1'||s==='2')document.documentElement.dataset.fs=s}catch(e){}`

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
      <html lang={locale} className={inter.variable} suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: textSizeScript }} />
        </head>
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
