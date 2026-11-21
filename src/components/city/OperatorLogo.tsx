import React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { LogoBackground } from '@/content/enums'
import { cn } from '@/lib/utils'

type Props = {
  logo: { url: string; alt?: string | null; background?: LogoBackground } | null
  // Shown when there is no logo or it fails to load: short name or initials
  fallback: string
  // Accessible name of the plaque
  label: string
  // Size (and fallback text size) of the plaque, e.g. "size-16 text-xl"
  className?: string
  // The margin between the plaque edge and the logo
  padding?: string
}

// A carrier's plate: logo on a white square with a black 2px frame; dark (#111) when the logo is too light for white
export function OperatorLogo({ logo, fallback, label, className, padding = 'p-3' }: Props) {
  const dark = logo?.background === 'dark'

  return (
    <Avatar
      className={cn(
        'rounded-xl border-2 border-black after:hidden',
        dark ? 'bg-[#111]' : 'bg-white',
        className,
      )}
    >
      {logo && (
        <AvatarImage
          src={logo.url}
          alt={logo.alt || label}
          className={cn('rounded-[inherit] object-contain', padding)}
        />
      )}
      <AvatarFallback
        className="rounded-[inherit] bg-primary font-bold text-primary-foreground"
        role="img"
        aria-label={label}
      >
        {fallback}
      </AvatarFallback>
    </Avatar>
  )
}
