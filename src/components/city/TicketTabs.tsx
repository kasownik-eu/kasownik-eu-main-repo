import { ClockIcon, InfoIcon } from 'lucide-react'
import { getFormatter, getTranslations } from 'next-intl/server'
import React from 'react'

import { TicketNotches } from '@/components/site/decor'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { LuggageView, TicketMediaView, TicketView } from '@/content'

import { ModeBadges } from './ModeBadges'
import { Section } from './Section'
import { TicketValidation, type ValidationOption } from './TicketValidation'

type Ticket = TicketView
type Luggage = LuggageView

type Props = {
  tickets: Ticket[]
  // How a ride is started with each form of ticket; a ticket lists the forms it comes in
  media: TicketMediaView[]
  luggage: Luggage[]
  rulesNote?: string | null
  rulesUrl?: string | null
  currency: string
}

// Fixed tab order for every city: single, short, long, luggage, other (shown only when it has tickets)
const tabOrder = ['single', 'short', 'long', 'luggage', 'other'] as const

const fieldLabel = 'text-[0.8125rem] text-muted-foreground'
const smallLabel = 'text-xs font-medium tracking-wider text-muted-foreground uppercase'
const cardGrid =
  'grid items-stretch gap-5 grid-cols-[repeat(auto-fill,minmax(min(21.25rem,100%),1fr))]'
const ticketCard = 'gap-0 overflow-visible py-0 shadow-[3px_3px_0_0_var(--foreground)]'

export async function TicketTabs({
  tickets,
  media,
  luggage,
  rulesNote,
  rulesUrl,
  currency,
}: Props) {
  const t = await getTranslations('TicketTabs')
  const tCommon = await getTranslations('Common')
  const format = await getFormatter()

  const price = (value: number | null | undefined) =>
    value == null ? '—' : format.number(value, { style: 'currency', currency })
  const fee = (row: Luggage) =>
    row.feeText || (row.fee == null || row.fee === 0 ? t('free') : price(row.fee))

  const tabs = tabOrder.filter(
    (id) => id !== 'other' || (tickets ?? []).some((ticket) => ticket.category === 'other'),
  )

  const empty = <p className="text-muted-foreground">{t('empty')}</p>

  const validationLabels = {
    heading: t('validation.heading'),
    group: t('validation.group'),
    showSteps: t('validation.showSteps'),
    hideSteps: t('validation.hideSteps'),
    popupTitle: t('validation.popupTitle'),
    close: t('validation.close'),
  }
  // The ticket's forms in its own order, each with the operator-wide way of validating it
  const optionsOf = (ticket: Ticket): ValidationOption[] =>
    (ticket.media ?? []).flatMap((type) => {
      const entry = media.find((item) => item.type === type)
      return entry
        ? [
            {
              type,
              label: entry.name || t(`media.${type}`),
              action: entry.action,
              when: entry.when ?? null,
              steps: entry.steps ?? [],
              photo: entry.photo
                ? {
                    src: entry.photo.image.url,
                    alt: entry.photo.alt || entry.photo.image.alt || entry.photo.caption,
                    caption: entry.photo.caption,
                  }
                : null,
            },
          ]
        : []
    })

  const whereToBuy = (ticket: Ticket) =>
    ticket.whereToBuy && (
      <p className="mt-3.5 border-t pt-3 text-[0.8125rem] text-muted-foreground">
        {t('whereToBuy', { where: ticket.whereToBuy })}
      </p>
    )

  // Side panel of the step-by-step popup: what the ticket is and costs
  const popupSummary = (ticket: Ticket) => (
    <div className="grid gap-4">
      <div>
        {ticket.validity && (
          <Badge className="h-auto gap-1.5 rounded-full border-2 border-border bg-highlight px-2.5 py-0.5 text-[0.8125rem] font-bold text-foreground">
            <ClockIcon aria-hidden="true" />
            {ticket.validity}
          </Badge>
        )}
        {ticket.scope && <p className="mt-2 font-semibold">{ticket.scope}</p>}
      </div>
      <dl className="grid gap-3.5">
        <div>
          <dt className="text-[0.8125rem] font-semibold">{t('columns.normal')}</dt>
          <dd className="text-4xl leading-tight font-extrabold tracking-tight tabular-nums">
            {price(ticket.priceNormal)}
          </dd>
        </div>
        <div>
          <dt className="text-[0.8125rem] font-semibold">{t('columns.reduced')}</dt>
          <dd className="text-4xl leading-tight font-extrabold tracking-tight tabular-nums">
            {price(ticket.priceReduced)}
          </dd>
        </div>
      </dl>
      <ModeBadges modes={ticket.transportModes} />
    </div>
  )

  // Every ticket is a card that reads as a ticket: tear line with notches, prices, then how to validate it
  const ticketPanel = (rows: Ticket[]) =>
    rows.length === 0 ? (
      empty
    ) : (
      <div className={cardGrid}>
        {rows.map((ticket, index) => {
          const options = optionsOf(ticket)
          return (
            <Card key={index} className={ticketCard}>
              <div className="px-4">
                <header className="relative flex items-start justify-between gap-3 border-b-2 border-dashed py-4">
                  <div className="min-w-0">
                    <h3 className="text-xl leading-snug font-bold">{ticket.name}</h3>
                    {ticket.scope && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{ticket.scope}</p>
                    )}
                  </div>
                  {ticket.validity && (
                    <Badge className="h-auto shrink-0 gap-1.5 rounded-full border-2 border-border bg-highlight px-2.5 py-0.5 text-[0.8125rem] font-bold whitespace-nowrap text-foreground">
                      <ClockIcon aria-hidden="true" />
                      <span className="sr-only">{t('columns.validity')}: </span>
                      {ticket.validity}
                    </Badge>
                  )}
                  <TicketNotches />
                </header>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4">
                <div>
                  <dt className={fieldLabel}>{t('columns.normal')}</dt>
                  <dd className="text-[1.75rem] leading-tight font-extrabold tracking-tight tabular-nums">
                    {price(ticket.priceNormal)}
                  </dd>
                </div>
                <div>
                  <dt className={fieldLabel}>{t('columns.reduced')}</dt>
                  <dd className="text-[1.75rem] leading-tight font-extrabold tracking-tight tabular-nums">
                    {price(ticket.priceReduced)}
                  </dd>
                </div>
                {!!ticket.transportModes?.length && (
                  <div className="col-span-2">
                    <dt className={fieldLabel}>{t('columns.modes')}</dt>
                    <dd className="mt-1">
                      <ModeBadges modes={ticket.transportModes} />
                    </dd>
                  </div>
                )}
              </dl>
              {options.length > 0 ? (
                <div className="flex flex-1 flex-col overflow-hidden rounded-b-xl">
                  <TicketValidation
                    ticketName={ticket.name}
                    options={options}
                    labels={validationLabels}
                    summary={popupSummary(ticket)}
                  >
                    {whereToBuy(ticket)}
                  </TicketValidation>
                </div>
              ) : (
                ticket.whereToBuy && (
                  <div className="px-5 pb-4 [&>p]:mt-0">{whereToBuy(ticket)}</div>
                )
              )}
            </Card>
          )
        })}
      </div>
    )

  const luggagePanel = (rows: Luggage[]) =>
    rows.length === 0 ? (
      empty
    ) : (
      <div className="grid gap-3">
        {rows.map((row, index) => (
          <Card key={index} className="gap-0 overflow-visible px-4 py-4">
            <div className="relative border-b-2 border-dashed pb-3">
              <h3 className="text-lg font-semibold">{row.item}</h3>
              {row.note && <p className="text-sm text-muted-foreground">{row.note}</p>}
              <TicketNotches />
            </div>
            <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(12.5rem,1fr))] gap-x-5 gap-y-3 text-base">
              {!!row.transportModes?.length && (
                <div>
                  <div className={smallLabel}>{t('columns.modes')}</div>
                  <div className="mt-0.5">
                    <ModeBadges modes={row.transportModes} />
                  </div>
                </div>
              )}
              <div>
                <div className={smallLabel}>{t('columns.fee')}</div>
                <div className="text-lg font-semibold">{fee(row)}</div>
              </div>
              {row.conditions && (
                <div className="sm:col-span-2">
                  <div className={smallLabel}>{t('columns.conditions')}</div>
                  <div className="text-[0.9375rem]">{row.conditions}</div>
                </div>
              )}
              {row.whereToBuy && (
                <div className="sm:col-span-2">
                  <div className={smallLabel}>{t('columns.whereToBuy')}</div>
                  <div className="text-[0.9375rem]">{row.whereToBuy}</div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    )

  return (
    <Section id="tickets" title={t('title')} lead={t('lead')}>
      <Tabs defaultValue="single" className="gap-5">
        <TabsList
          variant="line"
          aria-label={t('tabsLabel')}
          className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b-2 border-foreground p-0"
        >
          {tabs.map((id) => (
            <TabsTrigger
              key={id}
              value={id}
              className="min-h-11 flex-none rounded-none px-4 text-base whitespace-nowrap group-data-horizontal/tabs:after:bottom-[-2px] group-data-horizontal/tabs:after:h-1"
            >
              {t(`tabs.${id}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((id) => (
          <TabsContent key={id} value={id} tabIndex={0} className="text-base">
            <p className="mb-4 text-muted-foreground">{t(`intro.${id}`)}</p>
            {id === 'luggage'
              ? luggagePanel(luggage ?? [])
              : ticketPanel((tickets ?? []).filter((ticket) => ticket.category === id))}
          </TabsContent>
        ))}
      </Tabs>

      {(rulesNote || rulesUrl) && (
        <Alert role="note" className="mt-4 px-4 py-3">
          <InfoIcon aria-hidden="true" />
          <AlertTitle>{t('rules')}</AlertTitle>
          <AlertDescription>
            {rulesNote}{' '}
            {rulesUrl && (
              <a href={rulesUrl} target="_blank" rel="noopener noreferrer">
                {t('rulesLink')}
                <span className="sr-only"> {tCommon('opensInNewTab')}</span>
              </a>
            )}
          </AlertDescription>
        </Alert>
      )}
    </Section>
  )
}
