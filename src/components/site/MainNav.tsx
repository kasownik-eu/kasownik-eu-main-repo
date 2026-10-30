'use client'

import { useTranslations } from 'next-intl'
import React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Link, usePathname } from '@/i18n/navigation'

// A list page stays marked while one of its detail pages is open
const links = [
  { href: '/cities', label: 'cities', matches: ['/cities', '/city/[slug]'] },
  { href: '/operators', label: 'operators', matches: ['/operators', '/operator/[slug]'] },
] as const

export function MainNav({ className }: { className?: string }) {
  const t = useTranslations('SiteHeader')
  const pathname = usePathname()

  return (
    <nav aria-label={t('mainNav')} className={className}>
      {links.map((link) => {
        const active = (link.matches as readonly string[]).includes(pathname)

        return (
          <Button
            key={link.href}
            variant={active ? 'secondary' : 'ghost'}
            size="lg"
            className={cn('justify-start px-3', !active && 'text-muted-foreground')}
            nativeButton={false}
            render={<Link href={link.href} aria-current={active ? 'page' : undefined} />}
          >
            {t(link.label)}
          </Button>
        )
      })}
    </nav>
  )
}
