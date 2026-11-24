import React from 'react'

import { cn } from '@/lib/utils'

// Decorative transit motifs from design Variant A ("miks"). Purely visual: always aria-hidden.

const lineMarkSizes = {
  // Section headings (h2): 30px line ending in a stop
  md: { w: 44, h: 20, bar: 6, barW: 30, cx: 34, r: 7, stroke: 5 },
  // Page headings (h1)
  lg: { w: 52, h: 24, bar: 8, barW: 36, cx: 40, r: 8.5, stroke: 6 },
}

// Yellow route line that ends in a stop, placed before a heading
export function LineMark({ size = 'md', className }: { size?: keyof typeof lineMarkSizes; className?: string }) {
  const s = lineMarkSizes[size]

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${s.w} ${s.h}`}
      width={s.w}
      height={s.h}
      className={cn('shrink-0', className)}
    >
      <rect x="0" y={(s.h - s.bar) / 2} width={s.barW} height={s.bar} className="fill-primary" />
      <circle cx={s.cx} cy={s.h / 2} r={s.r} strokeWidth={s.stroke} className="fill-background stroke-foreground" />
    </svg>
  )
}

// Tilted ticket drawn faintly behind the operator hero; the parent needs `relative isolate overflow-hidden`
export function TicketArt({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 420 220"
      fill="none"
      strokeWidth="3"
      strokeLinecap="round"
      className={cn(
        'pointer-events-none absolute -right-4 -bottom-6 -z-10 h-auto w-[min(440px,75%)] stroke-highlight-strong',
        className,
      )}
    >
      <g transform="rotate(-8 210 110)">
        <path
          d="M60 40h300a10 10 0 0 1 10 10v36a22 22 0 0 0 0 44v36a10 10 0 0 1-10 10H60a10 10 0 0 1-10-10v-36a22 22 0 0 0 0-44V50a10 10 0 0 1 10-10z"
          className="fill-highlight-hover"
        />
        <path d="M270 46v124" strokeDasharray="8 8" />
        <path d="M92 78h140M92 108h100M92 138h120" />
        <circle cx="322" cy="108" r="22" />
        <path d="M311 108l8 8 15-17" />
      </g>
    </svg>
  )
}

// Stop marker in front of a city name
export function StopDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('size-[18px] shrink-0 rounded-full border-4 border-foreground bg-background', className)}
    />
  )
}

// Half-circle bites on both sides of a ticket card's tear line; render inside a `relative` element
// whose bottom border is the tear line, inside a card with px-4 and no overflow clipping
export function TicketNotches() {
  const notch =
    'pointer-events-none absolute -bottom-[11px] size-5 rounded-full border-2 border-foreground bg-background'

  return (
    <>
      <span aria-hidden="true" className={cn(notch, '-left-[27px] [clip-path:inset(0_0_0_9px)]')} />
      <span aria-hidden="true" className={cn(notch, '-right-[27px] [clip-path:inset(0_9px_0_0)]')} />
    </>
  )
}
