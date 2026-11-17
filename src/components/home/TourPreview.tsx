import { StoreIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type TourPreviewKind = 'buy' | 'prices' | 'zones'

const stepDot =
  'grid size-8 shrink-0 place-items-center rounded-full border-4 border-foreground text-sm font-bold'
const fieldLabel = 'text-xs font-medium tracking-[0.04em] text-muted-foreground uppercase'

// Drawn miniature of one module of an operator page, with made-up data. One image for assistive tech:
// the figure has a text alternative and its drawing is hidden
export async function TourPreview({ kind }: { kind: TourPreviewKind }) {
  const t = await getTranslations('OperatorTour.preview')

  return (
    <figure className="overflow-hidden rounded-[14px] border-2 bg-background text-foreground">
      <figcaption className="border-b-2 bg-muted px-4 py-2 text-[0.8125rem] font-semibold text-muted-foreground">
        {t('caption')}
      </figcaption>
      <div role="img" aria-label={t(`${kind}.label`)}>
        <div aria-hidden="true">
          {kind === 'buy' && <BuyPreview t={t} />}
          {kind === 'prices' && <PricesPreview t={t} />}
          {kind === 'zones' && <ZonesPreview t={t} />}
        </div>
      </div>
    </figure>
  )
}

type T = Awaited<ReturnType<typeof getTranslations<'OperatorTour.preview'>>>

function BuyPreview({ t }: { t: T }) {
  const steps = [t('buy.step1'), t('buy.step2'), t('buy.step3')]

  return (
    <>
      <div className="flex items-center gap-3.5 border-b-2 bg-highlight px-4 py-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-primary">
          <StoreIcon className="size-[22px]" />
        </span>
        <span className="grid justify-items-start gap-0.5">
          <span className="font-semibold">{t('buy.method')}</span>
          <Badge className="h-auto rounded-[6px] border-foreground px-2 text-[0.8125rem] font-semibold">
            {t('buy.badge')}
          </Badge>
        </span>
      </div>
      <ol className="relative m-4 grid gap-3.5 before:absolute before:inset-y-0 before:left-3.5 before:w-1 before:bg-foreground">
        {steps.map((step, index) => (
          <li key={index} className="relative grid grid-cols-[2rem_1fr] items-start gap-3">
            <span className={cn(stepDot, index === steps.length - 1 ? 'bg-primary' : 'bg-background')}>
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </>
  )
}

function PricesPreview({ t }: { t: T }) {
  const tickets = [
    { name: t('prices.ticket1'), validity: t('prices.validity1') },
    { name: t('prices.ticket2'), validity: t('prices.validity2') },
  ]

  return (
    <div className="grid gap-3 p-4">
      {tickets.map((ticket) => (
        <div key={ticket.name} className="rounded-xl border-2 px-4 py-3">
          <div className="border-b-2 border-dashed pb-2.5 font-semibold">{ticket.name}</div>
          <div className="grid grid-cols-3 gap-2 pt-2.5">
            <div>
              <div className={fieldLabel}>{t('prices.validity')}</div>
              <div>{ticket.validity}</div>
            </div>
            {/* Price placeholders: the tour shows the layout, not real prices */}
            {[t('prices.normal'), t('prices.reduced')].map((label) => (
              <div key={label}>
                <div className={fieldLabel}>{label}</div>
                <span className="mt-1.5 block h-[18px] w-16 max-w-full rounded-[6px] bg-line-soft" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ZonesPreview({ t }: { t: T }) {
  const zones = [t('zones.zone1'), t('zones.zone2'), t('zones.zone3')]

  return (
    <>
      <div className="border-b-2 bg-muted">
        <svg viewBox="0 0 400 190" className="block h-auto w-full">
          <circle cx="200" cy="95" r="88" strokeWidth="2" strokeDasharray="6 6" className="fill-muted stroke-rail" />
          <circle cx="200" cy="95" r="58" strokeWidth="2" className="fill-highlight stroke-muted-foreground" />
          <circle cx="200" cy="95" r="28" className="fill-primary" />
          <g fontWeight="600" fontSize="15" textAnchor="middle" className="fill-foreground font-sans">
            <text x="200" y="100">1</text>
            <text x="200" y="58">2</text>
            <text x="200" y="26">3</text>
          </g>
        </svg>
      </div>
      <ul>
        {zones.map((description, index) => (
          <li key={index} className="border-b px-4 py-2.5 last:border-b-0">
            <b className="font-semibold">{t('zones.zone', { number: index + 1 })}</b>{' '}
            <span className="text-muted-foreground">· {description}</span>
          </li>
        ))}
      </ul>
    </>
  )
}
