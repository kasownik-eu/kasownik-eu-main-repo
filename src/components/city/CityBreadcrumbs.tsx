import { ChevronLeftIcon } from 'lucide-react'
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
}

// Full trail on desktop; on mobile a single step back to the city list
export async function CityBreadcrumbs({ city, region }: Props) {
  const t = await getTranslations('CityPage')

  return (
    <Breadcrumb aria-label={t('breadcrumbs')} className="py-4">
      <BreadcrumbList className="hidden sm:flex">
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/cities" />}>{t('cities')}</BreadcrumbLink>
        </BreadcrumbItem>
        {region && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{region}</BreadcrumbItem>
          </>
        )}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="font-medium">{city}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>

      <BreadcrumbList className="sm:hidden">
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/cities" />} className="inline-flex min-h-11 items-center gap-1">
            <ChevronLeftIcon aria-hidden="true" className="size-4" />
            {t('cities')}
          </BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
