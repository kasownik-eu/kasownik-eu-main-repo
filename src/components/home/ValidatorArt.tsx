'use client'

import { CheckIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React, { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

// reset: ticket above the slot, no transition · insert: ticket slides in · stamped: lamps go green
type Phase = 'reset' | 'insert' | 'stamped'

// A ticket going into a validator, replayed each time it scrolls back into view. The server render,
// no-JS and reduced motion all show the end state (ticket in, lamps green)
export function ValidatorArt({ className }: { className?: string }) {
  const t = useTranslations('HomeHero')
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('stamped')

  useEffect(() => {
    const box = ref.current
    if (!box || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const timers: number[] = []
    let frame = 0
    let seen = false
    const clear = () => {
      timers.splice(0).forEach((timer) => window.clearTimeout(timer))
      cancelAnimationFrame(frame)
    }
    const play = () => {
      clear()
      setPhase('reset')
      // Two frames so the reset position is painted before the transition starts
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          timers.push(window.setTimeout(() => setPhase('insert'), 500))
          timers.push(window.setTimeout(() => setPhase('stamped'), 2000))
        })
      })
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting)
        if (visible && !seen) play()
        seen = visible
      },
      { threshold: 0.6 },
    )
    observer.observe(box)

    return () => {
      observer.disconnect()
      clear()
    }
  }, [])

  const stamped = phase === 'stamped'
  const lamp = cn(
    'size-[18px] rounded-full border-2',
    phase !== 'reset' && 'transition-[background-color,box-shadow] duration-300',
    stamped
      ? 'border-green-300 bg-green-500 shadow-[0_0_0_4px_rgb(34_197_94/0.25)]'
      : 'border-muted-foreground bg-gray-600',
  )

  return (
    <div ref={ref} role="img" aria-label={t('artLabel')} className={className}>
      <div aria-hidden="true" className="relative mx-auto h-[380px] w-60 overflow-hidden">
        {/* ticket */}
        <div
          className={cn(
            'absolute top-1.5 left-[70px] h-[150px] w-[100px] rounded-lg border-2 border-foreground bg-background',
            phase === 'reset' ? 'translate-y-0' : 'translate-y-[84px]',
            phase !== 'reset' && 'transition-transform duration-[1.4s] ease-in-out',
          )}
        >
          <div className="grid gap-2 px-3 pt-3.5">
            <span className="h-1 bg-foreground" />
            <span className="h-1 w-[70%] bg-foreground" />
          </div>
          <div className="mt-3.5 border-t-2 border-dashed border-foreground" />
          <div className="grid gap-2 px-3 pt-2.5">
            <span className="h-1 w-[85%] bg-foreground" />
            <span className="h-1 w-[55%] bg-foreground" />
          </div>
        </div>

        {/* validator body */}
        <div className="absolute top-[136px] left-0 h-[260px] w-60 rounded-t-[20px] bg-chrome px-[22px] pt-[18px]">
          <div className="mx-auto h-3.5 w-32 rounded-full bg-black shadow-[inset_0_0_0_2px_var(--muted-foreground)]" />
          <div className="mx-auto mt-2 size-0 border-x-8 border-t-[10px] border-x-transparent border-t-primary" />
          <div className="mt-3.5 flex min-h-16 items-center justify-center gap-2 rounded-[10px] border-2 border-muted-foreground bg-background px-2.5 py-2 text-center text-lg leading-tight font-bold text-foreground">
            {stamped && <CheckIcon className="size-[22px] text-green-700" strokeWidth={3} />}
            <span>{stamped ? t('artStamped') : t('artInsert')}</span>
          </div>
          <div className="mt-[22px] flex justify-center gap-4">
            <span className={lamp} />
            <span className={lamp} />
            <span className={lamp} />
          </div>
        </div>
      </div>
    </div>
  )
}
