import { getTranslations } from 'next-intl/server'
import React from 'react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Link } from '@/i18n/navigation'

type Props = {
  city: string
  region?: string | null
  // Which list the page was reached from: "Miasta › Polska › …" or "Przewoźnicy › Polska › …"
  section?: 'cities' | 'operators'
}

// Regions have no page of their own, so the region rides along with the city name.
// The full trail is always shown and wraps on narrow screens; it is never shortened
export async function CityBreadcrumbs({ city, region, section = 'cities' }: Props) {
  const t = await getTranslations('CityPage')
  const listHref = section === 'cities' ? '/cities' : '/operators'

  return (
    <Breadcrumb aria-label={t('breadcrumbs')} className="py-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href={listHref} />}>{t(section)}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href={listHref} />}>{t('countryPoland')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="font-medium">
            {region
              ? t.rich('cityInRegion', {
                  city,
                  region,
                  muted: (chunks) => <span className="font-normal text-muted-foreground">{chunks}</span>,
                })
              : city}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
