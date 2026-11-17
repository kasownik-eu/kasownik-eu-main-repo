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
      <Card className="gap-0 py-0 shadow-xs md:max-w-xl">
        <ul>
          {cities.map((city) => (
            <li key={city.slug} className="border-b last:border-b-0">
              <Link
                href={{ pathname: '/city/[slug]', params: { slug: city.slug } }}
                className="group flex min-h-14 items-center justify-between gap-3 px-5 py-2 text-lg font-medium hover:bg-highlight"
              >
                <span>
                  {city.name}
                  {city.region && (
                    <span className="block text-sm font-normal text-muted-foreground">
                      {city.region}
                    </span>
                  )}
                </span>
                <ChevronRightIcon
                  aria-hidden="true"
                  className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </Section>
  )
}
