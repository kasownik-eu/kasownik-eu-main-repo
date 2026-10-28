'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import React from 'react'

import { Button } from '@/components/ui/button'
import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

type Href = React.ComponentProps<typeof Link>['href']

// Links to the current page in every locale (localized pathnames need the route params)
export function LanguageSwitcher() {
  const t = useTranslations('SiteHeader')
  const locale = useLocale()
  const pathname = usePathname()
  const params = useParams()

  return (
    <nav aria-label={t('language')} className="flex gap-1">
      {routing.locales.map((code) => (
        <Button
          key={code}
          variant={code === locale ? 'secondary' : 'ghost'}
          size="lg"
          className="min-w-11 px-3"
          nativeButton={false}
          render={
            <Link
              href={{ pathname, params } as Href}
              locale={code}
              lang={code}
              aria-current={code === locale ? 'true' : undefined}
            />
          }
        >
          {code.toUpperCase()}
        </Button>
      ))}
    </nav>
  )
}
