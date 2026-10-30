import { MenuIcon, TramFrontIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

import { LanguageSwitcher } from './LanguageSwitcher'
import { MainNav } from './MainNav'
import { TextSizeControl } from './TextSizeControl'

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
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-2 sm:gap-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground ring-2 ring-primary-foreground" aria-hidden="true">
            <TramFrontIcon className="size-[18px]" />
          </span>
          <span className="max-sm:sr-only">{tMeta('siteTitle')}</span>
        </Link>

        <MainNav className="hidden gap-1 md:flex" />

        <span className="flex-1" />

        <TextSizeControl />

        <div className="hidden md:block">
          <LanguageSwitcher />
        </div>

        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="icon-lg" className="size-11 md:hidden" aria-label={t('menu')} />}>
            <MenuIcon />
          </SheetTrigger>
          <SheetContent side="right" closeLabel={t('close')}>
            <SheetHeader>
              <SheetTitle>{t('menu')}</SheetTitle>
            </SheetHeader>
            <MainNav className="flex flex-col gap-1 px-4" />
            <div className="px-4">
              <LanguageSwitcher />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
