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

import type { purchaseMethodTypes } from '@/collections/Operators'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { Operator } from '@/payload-types'

import { mediaUrl } from './format'
import { PrintButton } from './PrintButton'
import { Section } from './Section'

type Props = {
  methods: Operator['purchaseMethods']
  operator: Operator
}

type Steps = { text: string; id?: string | null }[] | null | undefined
type Photos = NonNullable<Operator['purchaseMethods']>[number]['validationPhotos']

const icons: Record<(typeof purchaseMethodTypes)[number], LucideIcon> = {
  machine: TicketIcon,
  app: SmartphoneIcon,
  office: StoreIcon,
  contactless: CreditCardIcon,
  driver: BusIcon,
  sms: MessageSquareIcon,
  other: CircleHelpIcon,
}

// Steps drawn as stops on a line: ringed numbers joined by a black segment down to the next stop
function StepList({ steps, tone = 'white' }: { steps: Steps; tone?: 'white' | 'yellow' }) {
  return (
    <ol className="grid gap-4">
      {steps?.map((step, index) => (
        <li
          key={step.id ?? index}
          className="relative grid grid-cols-[2rem_1fr] items-start gap-3 text-lg not-last:before:absolute not-last:before:top-8 not-last:before:-bottom-4 not-last:before:left-3.5 not-last:before:w-1 not-last:before:bg-foreground"
        >
          <span
            aria-hidden="true"
            className={cn(
              'grid size-8 place-items-center rounded-full border-4 border-foreground text-sm font-bold',
              tone === 'white' ? 'bg-background text-foreground' : 'bg-primary text-primary-foreground',
            )}
          >
            {index + 1}
          </span>
          <span>{step.text}</span>
        </li>
      ))}
    </ol>
  )
}

// 0–N photos with caption; none renders nothing, so no empty space is left
async function PhotoList({ photos }: { photos: Photos }) {
  const t = await getTranslations('PurchaseMethods')
  const items = (photos ?? []).flatMap((photo) => {
    const image = mediaUrl(photo.image)
    return image ? [{ ...photo, image }] : []
  })
  if (!items.length) return null

  return (
    <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(11.25rem,100%),15rem))] gap-3">
      {items.map((photo, index) => (
        <li key={photo.id ?? index}>
          <figure>
            <AspectRatio ratio={4 / 3} className="overflow-hidden rounded-lg border-2 bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.image.url!}
                alt={photo.alt || photo.image.alt || t('photoAlt', { index: index + 1, count: items.length })}
                loading="lazy"
                className="size-full object-cover"
              />
            </AspectRatio>
            <figcaption className="mt-2 text-sm">{photo.caption}</figcaption>
          </figure>
        </li>
      ))}
    </ul>
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
                  <CollapsibleTrigger className="group flex min-h-19 w-full flex-wrap items-center gap-4 bg-highlight px-4 py-4 text-left transition-colors hover:bg-highlight-hover data-panel-open:border-b-2 sm:px-5">
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground ring-2 ring-border ring-inset"
                      aria-hidden="true"
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="grid min-w-0 flex-[1_1_12rem] justify-items-start gap-0.5">
                      <span className="text-lg font-semibold">{method.title}</span>
                      {method.subtitle && <span className="text-sm text-muted-foreground">{method.subtitle}</span>}
                      <Badge className="mt-1.5 h-auto rounded-md border-border px-2.5 text-[0.8125rem] font-semibold">
                        {method.requiresValidation ? t('requiresValidation') : t('noValidation')}
                      </Badge>
                    </span>
                    <span
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'lg' }),
                        // hover: too, so the outline variant's own hover:bg-muted doesn't win on the button itself
                        'group-hover:bg-primary group-hover:text-primary-foreground hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary max-sm:w-full',
                      )}
                    >
                      <span className="group-data-panel-open:hidden">{t('show')}</span>
                      <span className="hidden group-data-panel-open:inline">{t('hide')}</span>
                      <ChevronDownIcon
                        aria-hidden="true"
                        className="transition-transform group-data-panel-open:rotate-180"
                      />
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid gap-0.5 bg-border md:grid-cols-2">
                      <div className="bg-card p-4 sm:p-6">
                        <h3 className={stepHeading}>{t('howToBuy')}</h3>
                        <StepList steps={method.buySteps} />
                      </div>
                      <div className="bg-highlight p-4 sm:p-6">
                        <h3 className={cn(stepHeading, 'text-foreground')}>{t('howToValidate')}</h3>
                        {method.requiresValidation ? (
                          <StepList steps={method.validationSteps} tone="yellow" />
                        ) : (
                          <p className="rounded-lg border-2 bg-card p-4 text-lg">
                            {method.noValidationText || t('noValidationDefault')}
                          </p>
                        )}
                        <PhotoList photos={method.validationPhotos} />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="mt-6 flex-row flex-wrap items-center justify-between gap-4 bg-highlight px-4 py-5 sm:px-6">
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
