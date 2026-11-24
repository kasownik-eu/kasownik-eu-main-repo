import React from 'react'

import { Button } from '@/components/ui/button'

import { TramStrip } from './TramStrip'

type Props = {
  // Page-specific text (a note, sources…); the shell around it is the same on every page
  children: React.ReactNode
  actionLabel: string
  actionHref?: string
}

// Black site footer: tram strip, the page's note and one yellow action button
export function SiteFooter({ children, actionLabel, actionHref = '#' }: Props) {
  return (
    <footer className="chrome mt-16 pb-8">
      <TramStrip />
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-4 px-4 sm:px-6">
        <div className="max-w-[70ch] flex-[1_1_20rem] text-sm">{children}</div>
        <Button size="lg" nativeButton={false} render={<a href={actionHref} />}>
          {actionLabel}
        </Button>
      </div>
    </footer>
  )
}
