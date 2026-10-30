import { InfoIcon, MapIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Operator } from '@/payload-types'

import { mediaUrl } from './format'
import { Section } from './Section'

type Props = {
  zones: Operator['zones']
}

// Optional module: skipped for single-fare cities. Map first, then the same info as a table
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
          <div className="self-start overflow-hidden rounded-lg border">
            <Table className="text-base">
              <TableHeader className="bg-muted">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-11 px-3 text-muted-foreground">{t('zone')}</TableHead>
                  <TableHead className="h-11 px-3 text-muted-foreground">{t('covers')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.items.map((zone, index) => (
                  <TableRow key={zone.id ?? index}>
                    <TableHead scope="row" className="px-3 py-3 font-semibold whitespace-normal">
                      {zone.name}
                    </TableHead>
                    <TableCell className="px-3 py-3 whitespace-normal">{zone.covers}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
