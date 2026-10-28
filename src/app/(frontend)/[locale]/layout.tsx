import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import React from 'react'

import './globals.css'

import { SiteHeader } from '@/components/site/SiteHeader'
import { routing } from '@/i18n/routing'

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-sans' })

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  const t = await getTranslations({ locale: locale as (typeof routing.locales)[number], namespace: 'Metadata' })

  return {
    title: t('siteTitle'),
  }
}

export default async function LocaleLayout(props: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { children, params } = props
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  return (
    <html lang={locale} className={inter.variable}>
      <body className="min-h-screen antialiased">
        <NextIntlClientProvider>
          <SiteHeader />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
