import { ChevronRightIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import React from 'react'

import { Card } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import type { CityRef } from '@/content'

import { Section } from './Section'

type Props = {
  cities: CityRef[]
}

// Every city that points to this operator; each opens the same content in that city's context
export async function ServedCities({ cities }: Props) {
  if (!cities.length) return null

  const t = await getTranslations('OperatorPage')

  return (
    <Section id="cities" title={t('servedCities')} lead={t('servedCitiesLead')}>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cities.map((city) => (
          <li key={city.slug}>
            <Card className="gap-0 py-0 shadow-xs transition-colors hover:bg-highlight">
              <Link
                href={{ pathname: '/city/[slug]', params: { slug: city.slug } }}
                className="group flex min-h-12 items-center justify-between gap-2 px-3 py-2 font-medium"
              >
                <span className="min-w-0">
                  <span className="block truncate">{city.name}</span>
                  {city.region && (
                    <span className="block truncate text-xs font-normal text-muted-foreground">
                      {city.region}
                    </span>
                  )}
                </span>
                <ChevronRightIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
                />
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  )
}
