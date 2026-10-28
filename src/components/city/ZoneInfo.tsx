import { InfoIcon, MapIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import type { City } from '@/payload-types'

import { mediaUrl } from './format'
import { Section } from './Section'

type Props = {
  zones: City['zones']
}

// Optional module: skipped for single-fare cities. Map first, then the same info as a list
export async function ZoneInfo({ zones }: Props) {
  if (!zones?.enabled) return null

  const t = await getTranslations('ZoneInfo')
  const map = mediaUrl(zones.map)

  return (
    <Section id="zones" title={t('title')} lead={t('lead')}>
      <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
        {map ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="w-full rounded-xl border bg-muted object-contain"
            src={map.url!}
            alt={map.alt || t('mapAlt')}
          />
        ) : (
          <div className="grid min-h-64 place-items-center rounded-xl border bg-muted text-muted-foreground">
            <span className="flex items-center gap-2">
              <MapIcon aria-hidden="true" className="size-5" />
              {t('map')}
            </span>
          </div>
        )}

        {zones.items && zones.items.length > 0 && (
          <Card className="gap-0 py-0">
            <dl className="divide-y">
              {zones.items.map((zone, index) => (
                <div key={zone.id ?? index} className="px-4 py-5 sm:px-6">
                  <dt className="font-semibold">{zone.name}</dt>
                  {zone.covers && <dd className="text-muted-foreground">{zone.covers}</dd>}
                </div>
              ))}
            </dl>
          </Card>
        )}
      </div>

      {zones.note && (
        <Alert role="note" className="mt-4 px-4 py-3">
          <InfoIcon aria-hidden="true" />
          <AlertTitle>{zones.noteTitle || t('noteTitle')}</AlertTitle>
          <AlertDescription>{zones.note}</AlertDescription>
        </Alert>
      )}
    </Section>
  )
}
