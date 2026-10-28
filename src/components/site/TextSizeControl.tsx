'use client'

import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const STORAGE_KEY = 'text-size'
const sizes = [
  { value: '0', label: 'A' },
  { value: '1', label: 'A+' },
  { value: '2', label: 'A++' },
] as const

// Sets data-fs on <html>; globals.css scales the root font size, and every rem with it
export function TextSizeControl() {
  const t = useTranslations('SiteHeader')
  const [size, setSize] = useState('0')

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved && sizes.some((s) => s.value === saved)) setSize(saved)
    } catch {
      // Storage unavailable (private mode): keep the default size
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.fs = size
    try {
      window.localStorage.setItem(STORAGE_KEY, size)
    } catch {
      // Ignore: the choice just won't be remembered
    }
  }, [size])

  return (
    <ToggleGroup
      aria-label={t('textSize')}
      variant="outline"
      spacing={0}
      value={[size]}
      onValueChange={(value) => value[0] && setSize(value[0])}
    >
      {sizes.map((s) => (
        <ToggleGroupItem
          key={s.value}
          value={s.value}
          aria-label={t(`textSizes.${s.value}`)}
          className="h-11 min-w-11 font-semibold aria-pressed:bg-primary aria-pressed:text-primary-foreground"
        >
          {s.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
