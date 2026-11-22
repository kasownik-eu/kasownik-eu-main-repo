'use client'

import {
  ChevronDownIcon,
  CreditCardIcon,
  IdCardIcon,
  type LucideIcon,
  SmartphoneIcon,
  TicketIcon,
} from 'lucide-react'
import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { TicketMediaType } from '@/content/enums'

export type ValidationOption = {
  type: TicketMediaType
  label: string
  action: string
  when: string | null
  steps: string[]
}

type Props = {
  ticketName: string
  options: ValidationOption[]
  labels: { heading: string; group: string; showSteps: string; hideSteps: string }
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
export function TicketValidation({ ticketName, options, labels, children }: Props) {
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
      {options.length > 1 && (
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
      )}

      <div aria-live="polite" className="mt-3.5 flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-lg border-2 border-foreground bg-primary text-primary-foreground"
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[1.0625rem] leading-snug font-bold">
            {options.length === 1 && <span className="sr-only">{current.label}: </span>}
            {current.action}
          </p>
          {current.when && <p className="mt-0.5 text-sm text-muted-foreground">{current.when}</p>}
        </div>
      </div>

      {current.steps.length > 0 && (
        <Collapsible open={open} onOpenChange={setOpen}>
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
