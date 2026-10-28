import { getTranslations } from 'next-intl/server'
import React from 'react'

import { Badge } from '@/components/ui/badge'

import type { TransportMode } from './format'

type Props = {
  modes: TransportMode[] | null | undefined
}

// Transport modes are always shown as chips
export async function ModeBadges({ modes }: Props) {
  if (!modes?.length) return null
  const t = await getTranslations('TransportModes')

  return (
    <span className="flex flex-wrap gap-1.5">
      {modes.map((mode) => (
        <Badge key={mode} variant="secondary" className="h-auto rounded-md px-2.5 text-[0.8125rem]">
          {t(mode)}
        </Badge>
      ))}
    </span>
  )
}
