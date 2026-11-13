'use client'

import { useTranslations } from 'next-intl'
import React, { useEffect, useSyncExternalStore } from 'react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const STORAGE_KEY = 'text-size'
const sizes = [
  { value: '0', label: 'A' },
  { value: '1', label: 'A+' },
  { value: '2', label: 'A++' },
] as const

type Size = (typeof sizes)[number]['value']

const listeners = new Set<() => void>()
const isSize = (value: unknown): value is Size => sizes.some((s) => s.value === value)

function readSize(): Size {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (isSize(saved)) return saved
  } catch {
    // Storage unavailable (private mode): keep the default size
  }
  return '0'
}

function writeSize(size: Size) {
  try {
    window.localStorage.setItem(STORAGE_KEY, size)
  } catch {
    // Ignore: the choice just won't be remembered
  }
  listeners.forEach((notify) => notify())
}

// Re-render on our own writes and on changes made in other tabs
function subscribe(notify: () => void) {
  listeners.add(notify)
  window.addEventListener('storage', notify)
  return () => {
    listeners.delete(notify)
    window.removeEventListener('storage', notify)
  }
}

// Sets data-fs on <html>; globals.css scales the root font size, and every rem with it
export function TextSizeControl() {
  const t = useTranslations('SiteHeader')
  const size = useSyncExternalStore(subscribe, readSize, () => '0' as Size)

  useEffect(() => {
    document.documentElement.dataset.fs = size
  }, [size])

  return (
    <ToggleGroup
      aria-label={t('textSize')}
      variant="outline"
      spacing={0}
      value={[size]}
      onValueChange={(value) => isSize(value[0]) && writeSize(value[0])}
    >
      {sizes.map((s) => (
        <ToggleGroupItem
          key={s.value}
          value={s.value}
          aria-label={t(`textSizes.${s.value}`)}
          className="h-11 min-w-11 border-primary font-semibold aria-pressed:bg-primary aria-pressed:text-primary-foreground"
        >
          {s.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
