import {
  BusIcon,
  ChevronDownIcon,
  CircleHelpIcon,
  CreditCardIcon,
  type LucideIcon,
  MessageSquareIcon,
  SmartphoneIcon,
  StoreIcon,
  TicketIcon,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import type { purchaseMethodTypes } from '@/collections/Cities'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { City } from '@/payload-types'

import { PrintButton } from './PrintButton'
import { Section } from './Section'

type Props = {
  methods: City['purchaseMethods']
  operator: City['operator']
}

type Steps = { text: string; id?: string | null }[] | null | undefined

const icons: Record<(typeof purchaseMethodTypes)[number], LucideIcon> = {
  machine: TicketIcon,
  app: SmartphoneIcon,
  office: StoreIcon,
  contactless: CreditCardIcon,
  driver: BusIcon,
  sms: MessageSquareIcon,
  other: CircleHelpIcon,
}

function StepList({ steps }: { steps: Steps }) {
  return (
    <ol className="grid gap-4">
      {steps?.map((step, index) => (
        <li key={step.id ?? index} className="grid grid-cols-[2rem_1fr] items-start gap-3 text-lg">
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-full bg-muted text-sm font-semibold"
          >
            {index + 1}
          </span>
          <span>{step.text}</span>
        </li>
      ))}
    </ol>
  )
}

// Each method expands in place (independent rows, first open); instructions sit right under it
export async function PurchaseMethods({ methods, operator }: Props) {
  const t = await getTranslations('PurchaseMethods')
  const contactName = operator.shortName || operator.name
  const stepHeading = 'mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase'

  return (
    <Section id="purchase" title={t('title')} lead={t('lead')}>
      {!methods?.length ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="grid gap-3">
          {methods.map((method, index) => {
            const Icon = icons[method.type]

            return (
              <Card key={method.id ?? index} className="gap-0 py-0">
                <Collapsible defaultOpen={index === 0}>
                  <CollapsibleTrigger className="group flex min-h-19 w-full flex-wrap items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/50 data-panel-open:border-b sm:px-5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-muted" aria-hidden="true">
                      <Icon className="size-5" />
                    </span>
                    <span className="grid min-w-0 flex-[1_1_12rem] justify-items-start gap-0.5">
                      <span className="text-lg font-semibold">{method.title}</span>
                      {method.subtitle && <span className="text-sm text-muted-foreground">{method.subtitle}</span>}
                      <Badge variant="outline" className="mt-1.5 h-auto rounded-md px-2.5 text-[0.8125rem]">
                        {method.requiresValidation ? t('requiresValidation') : t('noValidation')}
                      </Badge>
                    </span>
                    <span className={buttonVariants({ variant: 'outline', size: 'lg', className: 'max-sm:w-full' })}>
                      <span className="group-data-panel-open:hidden">{t('show')}</span>
                      <span className="hidden group-data-panel-open:inline">{t('hide')}</span>
                      <ChevronDownIcon
                        aria-hidden="true"
                        className="transition-transform group-data-panel-open:rotate-180"
                      />
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid gap-px bg-border md:grid-cols-2">
                      <div className="bg-card p-4 sm:p-6">
                        <h3 className={stepHeading}>{t('howToBuy')}</h3>
                        <StepList steps={method.buySteps} />
                      </div>
                      <div className="bg-card p-4 sm:p-6">
                        <h3 className={stepHeading}>{t('howToValidate')}</h3>
                        {method.requiresValidation ? (
                          <StepList steps={method.validationSteps} />
                        ) : (
                          <p className="rounded-lg border border-dashed p-4 text-lg">
                            {method.noValidationText || t('noValidationDefault')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="mt-6 flex-row flex-wrap items-center justify-between gap-4 bg-muted px-4 py-5 sm:px-6">
        <div className="flex-[1_1_20rem] text-lg">
          <p className="font-semibold">{t('helpTitle')}</p>
          {operator.hotline && (
            <p>
              {t('hotline', { operator: contactName })}:{' '}
              <a href={`tel:${operator.hotline.replace(/\s+/g, '')}`} className="underline underline-offset-3">
                {operator.hotline}
              </a>
            </p>
          )}
          {operator.servicePoint && (
            <p>
              {t('servicePoint', { operator: contactName })}: {operator.servicePoint}
            </p>
          )}
          <p className="mt-1.5 text-sm text-muted-foreground">{t('helpDisclaimer')}</p>
        </div>
        <PrintButton label={t('print')} />
      </Card>
    </Section>
  )
}
