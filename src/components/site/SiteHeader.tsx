import { TramFrontIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import { buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

import { LanguageSwitcher } from './LanguageSwitcher'
import { MainNav } from './MainNav'
import { TextSizeControl } from './TextSizeControl'

// Every option stays visible (no hamburger). Desktop: one row, brand · nav · text size · language.
// Phone: brand and text size on the first row, nav and language on the second
export async function SiteHeader() {
  const t = await getTranslations('SiteHeader')
  const tMeta = await getTranslations('Metadata')

  return (
    <header className="chrome">
      <a
        href="#main"
        className={cn(
          buttonVariants({ variant: 'outline', size: 'lg' }),
          'sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50',
        )}
      >
        {t('skipToContent')}
      </a>
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 sm:gap-x-4 sm:px-6">
        <Link href="/" className="flex min-h-11 items-center gap-2.5 font-bold md:order-1">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground ring-2 ring-primary-foreground" aria-hidden="true">
            <TramFrontIcon className="size-[18px]" />
          </span>
          <span>{tMeta('siteTitle')}</span>
        </Link>

        <span className="flex-1 md:order-3" />

        <div className="md:order-4">
          <TextSizeControl />
        </div>

        <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 md:contents">
          <MainNav className="-ml-3 flex flex-wrap gap-1 md:order-2 md:ml-0" />
          <div className="md:order-5">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  )
}
