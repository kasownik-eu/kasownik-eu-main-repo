import { InfoIcon } from 'lucide-react'
import { getFormatter, getTranslations } from 'next-intl/server'
import React from 'react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Operator } from '@/payload-types'

import { ModeBadges } from './ModeBadges'
import { Section } from './Section'

type Ticket = NonNullable<Operator['tickets']>[number]
type Luggage = NonNullable<Operator['luggage']>[number]

type Props = {
  tickets: Operator['tickets']
  luggage: Operator['luggage']
  rulesNote?: string | null
  rulesUrl?: string | null
  currency: string
}

// Fixed tab order for every city: single, short, long, luggage, other
const tabOrder = ['single', 'short', 'long', 'luggage', 'other'] as const

const fieldLabel = 'text-xs font-medium tracking-wider text-muted-foreground uppercase'
const tableHead = 'h-11 px-3 text-muted-foreground'
const tableCell = 'px-3 py-3 whitespace-normal'

// Label/value pair used in the mobile card view of a table row
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className={fieldLabel}>{label}</div>
      <div>{children}</div>
    </div>
  )
}

export async function TicketTabs({ tickets, luggage, rulesNote, rulesUrl, currency }: Props) {
  const t = await getTranslations('TicketTabs')
  const tCommon = await getTranslations('Common')
  const format = await getFormatter()

  const price = (value: number | null | undefined) =>
    value == null ? '—' : format.number(value, { style: 'currency', currency })
  const fee = (row: Luggage) => row.feeText || (row.fee == null || row.fee === 0 ? t('free') : price(row.fee))

  const empty = <p className="text-muted-foreground">{t('empty')}</p>

  const ticketPanel = (rows: Ticket[]) =>
    rows.length === 0 ? (
      empty
    ) : (
      <>
        <div className="hidden overflow-hidden rounded-lg border md:block">
          <Table className="text-base">
            <TableHeader className="bg-muted">
              <TableRow className="hover:bg-transparent">
                <TableHead className={tableHead}>{t('columns.ticket')}</TableHead>
                <TableHead className={tableHead}>{t('columns.validity')}</TableHead>
                <TableHead className={tableHead}>{t('columns.scope')}</TableHead>
                <TableHead className={tableHead}>{t('columns.modes')}</TableHead>
                <TableHead className={`${tableHead} text-right`}>{t('columns.normal')}</TableHead>
                <TableHead className={`${tableHead} text-right`}>{t('columns.reduced')}</TableHead>
                <TableHead className={tableHead}>{t('columns.whereToBuy')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((ticket, index) => (
                <TableRow key={ticket.id ?? index}>
                  <TableHead scope="row" className={`${tableCell} font-semibold`}>
                    {ticket.name}
                  </TableHead>
                  <TableCell className={tableCell}>{ticket.validity}</TableCell>
                  <TableCell className={tableCell}>{ticket.scope}</TableCell>
                  <TableCell className={tableCell}>
                    <ModeBadges modes={ticket.transportModes} />
                  </TableCell>
                  <TableCell className={`${tableCell} text-right font-semibold tabular-nums`}>
                    {price(ticket.priceNormal)}
                  </TableCell>
                  <TableCell className={`${tableCell} text-right font-semibold tabular-nums`}>
                    {price(ticket.priceReduced)}
                  </TableCell>
                  <TableCell className={`${tableCell} text-sm`}>{ticket.whereToBuy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile: each row becomes a card with the price first */}
        <div className="grid gap-3 md:hidden">
          {rows.map((ticket, index) => (
            <Card key={ticket.id ?? index} className="gap-3 px-4">
              <h3 className="border-b pb-3 text-lg font-semibold">
                {ticket.name}
              </h3>
              <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-base">
                <Field label={t('columns.normal')}>
                  <span className="text-xl font-semibold tabular-nums">{price(ticket.priceNormal)}</span>
                </Field>
                <Field label={t('columns.reduced')}>
                  <span className="text-xl font-semibold tabular-nums">{price(ticket.priceReduced)}</span>
                </Field>
                <Field label={t('columns.validity')}>{ticket.validity}</Field>
                <Field label={t('columns.scope')}>{ticket.scope}</Field>
                <Field label={t('columns.modes')} className="col-span-2">
                  <ModeBadges modes={ticket.transportModes} />
                </Field>
                <Field label={t('columns.whereToBuy')} className="col-span-2">
                  {ticket.whereToBuy}
                </Field>
              </div>
            </Card>
          ))}
        </div>
      </>
    )

  const luggagePanel = (rows: Luggage[]) =>
    rows.length === 0 ? (
      empty
    ) : (
      <>
        <div className="hidden overflow-hidden rounded-lg border md:block">
          <Table className="text-base">
            <TableHeader className="bg-muted">
              <TableRow className="hover:bg-transparent">
                <TableHead className={tableHead}>{t('columns.item')}</TableHead>
                <TableHead className={tableHead}>{t('columns.modes')}</TableHead>
                <TableHead className={tableHead}>{t('columns.fee')}</TableHead>
                <TableHead className={tableHead}>{t('columns.conditions')}</TableHead>
                <TableHead className={tableHead}>{t('columns.whereToBuy')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={row.id ?? index}>
                  <TableHead scope="row" className={tableCell}>
                    <span className="block font-semibold">{row.item}</span>
                    {row.note && <span className="block text-sm font-normal text-muted-foreground">{row.note}</span>}
                  </TableHead>
                  <TableCell className={tableCell}>
                    <ModeBadges modes={row.transportModes} />
                  </TableCell>
                  <TableCell className={`${tableCell} font-semibold`}>{fee(row)}</TableCell>
                  <TableCell className={`${tableCell} text-sm`}>{row.conditions}</TableCell>
                  <TableCell className={`${tableCell} text-sm`}>{row.whereToBuy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile: expandable list; collapsed row shows the item and its fee */}
        <Card className="py-0 md:hidden">
          <Accordion defaultValue={[rows[0].id ?? 0]}>
            {rows.map((row, index) => (
              <AccordionItem key={row.id ?? index} value={row.id ?? index}>
                <AccordionTrigger className="min-h-14 items-center gap-3 rounded-none px-4 py-3 text-base hover:no-underline">
                  <span className="grid flex-1 gap-0.5">
                    <span className="font-semibold">{row.item}</span>
                    {row.note && <span className="text-sm font-normal text-muted-foreground">{row.note}</span>}
                  </span>
                  <span className="font-semibold">{fee(row)}</span>
                </AccordionTrigger>
                <AccordionContent className="grid gap-3 px-4 pb-4 text-base">
                  <Field label={t('columns.modes')}>
                    <ModeBadges modes={row.transportModes} />
                  </Field>
                  {row.conditions && <Field label={t('columns.conditions')}>{row.conditions}</Field>}
                  {row.whereToBuy && <Field label={t('columns.whereToBuy')}>{row.whereToBuy}</Field>}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </>
    )

  return (
    <Section id="tickets" title={t('title')} lead={t('lead')}>
      <Tabs defaultValue="single" className="gap-5">
        <TabsList
          aria-label={t('tabsLabel')}
          className="grid w-full grid-cols-2 group-data-horizontal/tabs:h-auto sm:flex sm:w-fit sm:flex-wrap"
        >
          {tabOrder.map((id) => (
            <TabsTrigger key={id} value={id} className="min-h-11 px-4 text-[0.9375rem] whitespace-normal">
              {t(`tabs.${id}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabOrder.map((id) => (
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
