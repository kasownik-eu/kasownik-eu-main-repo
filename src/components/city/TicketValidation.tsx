'use client'

import {
  ChevronDownIcon,
  CreditCardIcon,
  Maximize2Icon,
  XIcon,
  IdCardIcon,
  type LucideIcon,
  SmartphoneIcon,
  TicketIcon,
} from 'lucide-react'
import React, { useState } from 'react'

import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { TicketMediaType } from '@/content/enums'

export type ValidationOption = {
  type: TicketMediaType
  label: string
  action: string
  when: string | null
  steps: string[]
  // What the validator / reader looks like
  photo: { src: string; alt: string; caption: string } | null
}

type Props = {
  ticketName: string
  options: ValidationOption[]
  labels: {
    heading: string
    group: string
    showSteps: string
    hideSteps: string
    popupTitle: string
    have: string
    close: string
  }
  // The ticket's validity, scope, prices and modes, rendered on the server for the side panel of the popup
  summary: React.ReactNode
  // Rendered at the bottom of the panel (where to buy)
  children?: React.ReactNode
}

const icons: Record<TicketMediaType, LucideIcon> = {
  paper: TicketIcon,
  app: SmartphoneIcon,
  paymentCard: CreditCardIcon,
  cityCard: IdCardIcon,
}

// "How to validate?" under a ticket: pick the form of the ticket you have, see the action, open the steps
export function TicketValidation({ ticketName, options, labels, summary, children }: Props) {
  const [selected, setSelected] = useState(options[0].type)
  const [open, setOpen] = useState(false)
  const current = options.find((option) => option.type === selected) ?? options[0]
  const Icon = icons[current.type]

  return (
    <section
      aria-label={`${labels.heading} ${ticketName}`}
      className="flex-1 border-t-2 bg-highlight px-5 pt-4 pb-5"
    >
      <p className="mb-2.5 text-[0.8125rem] font-bold tracking-wider uppercase">{labels.heading}</p>
      {
        <ToggleGroup
          aria-label={labels.group}
          value={[selected]}
          onValueChange={(value: string[]) => {
            // A single-choice group: clicking the pressed option keeps it
            if (value[0]) setSelected(value[0] as TicketMediaType)
            setOpen(false)
          }}
          className="flex w-full flex-wrap"
        >
          {options.map((option) => {
            const OptionIcon = icons[option.type]
            return (
              <ToggleGroupItem
                key={option.type}
                value={option.type}
                className="h-11 rounded-full border-2 border-foreground bg-background px-3.5 text-sm font-semibold hover:bg-highlight-hover aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-[2px_2px_0_0_var(--foreground)]"
              >
                <OptionIcon aria-hidden="true" />
                {option.label}
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
      }

      <div aria-live="polite" className="mt-3.5 flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-lg border-2 border-foreground bg-primary text-primary-foreground"
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[1.0625rem] leading-snug font-bold">{current.action}</p>
          {current.when && <p className="mt-0.5 text-sm text-muted-foreground">{current.when}</p>}
        </div>
      </div>

      {current.steps.length > 0 && (
        <Dialog>
          {/* From md up the steps open in a popup next to the ticket's prices; on phones they unfold in the card */}
          <DialogTrigger
            render={
              <Button
                variant="link"
                className="mt-3 hidden h-11 px-0 text-[0.9375rem] font-semibold text-foreground underline underline-offset-4 md:inline-flex"
              />
            }
          >
            {labels.showSteps}
            <Maximize2Icon aria-hidden="true" />
          </DialogTrigger>
          <DialogContent
            closeLabel={labels.close}
            showCloseButton={false}
            className="gap-0 overflow-hidden rounded-2xl border-2 border-foreground p-0 shadow-[8px_8px_0_0_var(--foreground)] ring-0 md:max-w-4xl md:flex-row"
          >
            <div className="grid min-w-0 flex-[3_1_0] content-start gap-5 p-8">
              <div>
                <p className="text-[0.8125rem] font-bold tracking-wider text-muted-foreground uppercase">
                  {labels.popupTitle}
                </p>
                <DialogTitle className="mt-0.5 text-3xl leading-tight font-extrabold">
                  {ticketName}
                </DialogTitle>
              </div>
              {
                <div className="grid gap-2.5">
                  <p className="text-[0.8125rem] font-bold tracking-wider uppercase">
                    {labels.have}
                  </p>
                  <ToggleGroup
                    aria-label={labels.group}
                    value={[selected]}
                    onValueChange={(value: string[]) => {
                      if (value[0]) setSelected(value[0] as TicketMediaType)
                    }}
                    className="flex w-full flex-wrap"
                  >
                    {options.map((option) => {
                      const OptionIcon = icons[option.type]
                      return (
                        <ToggleGroupItem
                          key={option.type}
                          value={option.type}
                          className="h-11 rounded-full border-2 border-foreground bg-background px-3.5 text-sm font-semibold hover:bg-highlight-hover aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-[2px_2px_0_0_var(--foreground)]"
                        >
                          <OptionIcon aria-hidden="true" />
                          {option.label}
                        </ToggleGroupItem>
                      )
                    })}
                  </ToggleGroup>
                </div>
              }
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-lg border-2 border-foreground bg-primary text-primary-foreground"
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[1.0625rem] leading-snug font-bold">{current.action}</p>
                  {current.when && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{current.when}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-start gap-6">
                <ol className="grid min-w-[17.5rem] flex-[1_1_17.5rem] gap-3.5">
                  {current.steps.map((step, index) => (
                    <li
                      key={`${current.type}-${index}`}
                      className="grid grid-cols-[2.25rem_1fr] items-start gap-3 text-[1.0625rem]"
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-9 place-items-center rounded-full border-2 border-foreground bg-background text-sm font-bold"
                      >
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                {current.photo && (
                  <figure className="grid min-w-44 flex-[0_1_13.75rem] gap-2.5">
                    <AspectRatio
                      ratio={4 / 3}
                      className="overflow-hidden rounded-lg border-2 border-foreground bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={current.photo.src}
                        alt={current.photo.alt}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover"
                      />
                    </AspectRatio>
                    <figcaption className="text-sm">{current.photo.caption}</figcaption>
                  </figure>
                )}
              </div>
            </div>
            <aside className="relative flex flex-[0_0_18.75rem] flex-col gap-5 border-t-2 border-dashed border-foreground bg-primary p-6 text-primary-foreground md:border-t-0 [&_p]:text-primary-foreground md:border-l-2">
              {/* Punched holes where the tear line meets the edges of the ticket (same grey as the dimmed page) */}
              {['-top-2.5', '-bottom-2.5'].map((edge) => (
                <span
                  key={edge}
                  aria-hidden="true"
                  className={`absolute -left-[11px] hidden size-[18px] rounded-full border-2 border-foreground bg-[#6b6b6b] md:block ${edge}`}
                />
              ))}
              <DialogClose
                render={
                  <Button
                    variant="outline"
                    size="lg"
                    className="self-end border-2 border-foreground bg-background font-bold text-foreground"
                  />
                }
              >
                <XIcon aria-hidden="true" />
                {labels.close}
              </DialogClose>
              {summary}
              <div className="mt-auto [&_p]:mt-0 [&_p]:border-t-2 [&_p]:border-foreground [&_p]:font-medium">
                {children}
              </div>
            </aside>
          </DialogContent>
        </Dialog>
      )}

      {current.steps.length > 0 && (
        <Collapsible open={open} onOpenChange={setOpen} className="md:hidden">
          <CollapsibleTrigger
            render={
              <Button
                variant="link"
                className="mt-3 h-11 px-0 text-[0.9375rem] font-semibold text-foreground underline underline-offset-4"
              />
            }
          >
            {open ? labels.hideSteps : labels.showSteps}
            <ChevronDownIcon
              aria-hidden="true"
              className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ol className="mt-1 grid gap-2.5">
              {current.steps.map((step, index) => (
                <li
                  key={`${current.type}-${index}`}
                  className="grid grid-cols-[1.625rem_1fr] items-start gap-2.5 text-[0.9375rem]"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-6.5 place-items-center rounded-full border-2 border-foreground bg-background text-xs font-bold"
                  >
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </CollapsibleContent>
        </Collapsible>
      )}
      {children}
    </section>
  )
}
