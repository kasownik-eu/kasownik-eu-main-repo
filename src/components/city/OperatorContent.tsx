import { TriangleAlertIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { Operator } from '@/payload-types'

import { OperatorHeader } from './OperatorHeader'
import { PurchaseMethods } from './PurchaseMethods'
import { TicketTabs } from './TicketTabs'
import { ZoneInfo } from './ZoneInfo'

type Props = {
  operator: Operator
  label?: string | null
}

// Same modules in the same order on city and operator pages; only the content differs
export async function OperatorContent({ operator, label }: Props) {
  const t = await getTranslations('CityPage')

  return (
    <>
      {operator.sampleData && (
        <Alert role="note" className="mb-4 px-4 py-3">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>{t('sampleDataTitle')}</AlertTitle>
          <AlertDescription>{t('sampleDataDescription')}</AlertDescription>
        </Alert>
      )}

      <OperatorHeader operator={operator} label={label} />
      <PurchaseMethods methods={operator.purchaseMethods} operator={operator} />
      <TicketTabs
        tickets={operator.tickets}
        luggage={operator.luggage}
        rulesNote={operator.rulesNote}
        rulesUrl={operator.rulesUrl}
        currency={operator.currency || 'PLN'}
      />
      <ZoneInfo zones={operator.zones} />
    </>
  )
}
