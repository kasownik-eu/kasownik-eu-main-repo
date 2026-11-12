import { ExternalLinkIcon } from 'lucide-react'
import { getFormatter, getTranslations } from 'next-intl/server'
import React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { TicketArt } from '@/components/site/decor'
import { Card } from '@/components/ui/card'
import type { Operator } from '@/payload-types'

import { initials, mediaUrl } from './format'
import { ModeBadges } from './ModeBadges'

type Props = {
  operator: Operator
  // Replaces the operator's own label, e.g. with the city the page was opened for
  label?: string | null
}

export async function OperatorHeader({ operator, label = operator.label }: Props) {
  const t = await getTranslations('OperatorHeader')
  const tCommon = await getTranslations('Common')
  const format = await getFormatter()
  const logo = mediaUrl(operator.logo)

  const links = [
    { href: operator.websiteUrl, label: t('officialWebsite'), variant: 'default' as const },
    { href: operator.timetableUrl, label: t('timetables'), variant: 'outline' as const },
  ].filter((link) => link.href)

  const facts = [
    {
      label: t('factModes'),
      value: operator.transportModes?.length ? <ModeBadges modes={operator.transportModes} /> : null,
    },
    { label: t('factZones'), value: operator.zoneCount },
    { label: t('factPayment'), value: operator.paymentInfo || operator.currency || null },
    {
      label: t('factVerified'),
      value: operator.verifiedAt ? format.dateTime(new Date(operator.verifiedAt), { dateStyle: 'medium' }) : null,
    },
  ]

  return (
    <Card className="gap-0 py-0">
      <div className="relative isolate flex flex-wrap items-start gap-4 overflow-hidden bg-highlight p-4 sm:gap-6 sm:p-6">
        <TicketArt />
        <Avatar className="size-16 rounded-xl after:rounded-xl sm:size-24">
          {logo && (
            <AvatarImage
              src={logo.url!}
              alt={logo.alt || t('logoAlt', { operator: operator.name })}
              className="rounded-xl object-contain"
            />
          )}
          <AvatarFallback
            className="rounded-xl bg-primary text-xl font-bold text-primary-foreground ring-2 ring-border ring-inset sm:text-3xl"
            role="img"
            aria-label={t('logoAlt', { operator: operator.name })}
          >
            {operator.shortName || initials(operator.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-[1_1_16rem]">
          {label && <p className="text-sm text-muted-foreground">{label}</p>}
          <h1 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{operator.name}</h1>
          {operator.description && (
            <p className="mt-2 max-w-[68ch] text-lg text-muted-foreground">{operator.description}</p>
          )}
          {links.length > 0 && (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {links.map((link) => (
                <Button
                  key={link.label}
                  variant={link.variant}
                  size="lg"
                  className="w-full sm:w-auto"
                  nativeButton={false}
                  render={<a href={link.href!} target="_blank" rel="noopener noreferrer" />}
                >
                  {link.label}
                  <ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
                  <span className="sr-only"> {tCommon('opensInNewTab')}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      <dl aria-label={t('facts')} className="grid grid-cols-2 gap-px border-t-2 bg-border lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="bg-card px-4 py-4 sm:px-6">
            <dt className="text-[0.8125rem] font-medium text-muted-foreground">{fact.label}</dt>
            <dd className="mt-1 font-semibold">{fact.value ?? t('unknown')}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
