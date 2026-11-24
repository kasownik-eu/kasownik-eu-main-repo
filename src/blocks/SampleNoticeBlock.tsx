import { TriangleAlertIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import type { BlockProps } from './types'

// Only for operators flagged `sampleData`: names, prices and rules are made up
export async function SampleNoticeBlock({ ctx }: BlockProps<'sampleNotice'>) {
  if (!ctx.operator.sampleData) return null
  const t = await getTranslations('CityPage')

  return (
    <Alert role="note" className="mb-4 px-4 py-3">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertTitle>{t('sampleDataTitle')}</AlertTitle>
      <AlertDescription>{t('sampleDataDescription')}</AlertDescription>
    </Alert>
  )
}
