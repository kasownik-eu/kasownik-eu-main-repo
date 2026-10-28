'use client'

import { useTranslations } from 'next-intl'
import React, { useId } from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Only Poland is covered for now; the disabled item tells users more countries are planned
export function CountrySelect() {
  const t = useTranslations('CitiesList')
  const id = useId()
  const items = [{ value: 'pl', label: t('countryPoland') }]

  return (
    <div>
      <Label htmlFor={id} className="mb-1.5">
        {t('country')}
      </Label>
      <Select items={items} defaultValue="pl">
        <SelectTrigger
          id={id}
          className="h-11 min-w-45 bg-background px-3.5 text-[0.9375rem] font-medium shadow-xs data-[size=default]:h-11"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pl">{t('countryPoland')}</SelectItem>
          <SelectItem value="soon" disabled>
            {t('moreCountriesSoon')}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
