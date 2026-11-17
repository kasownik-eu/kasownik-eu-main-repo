import { getTranslations } from 'next-intl/server'
import React from 'react'

import { CityBreadcrumbs } from '@/components/city'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Link } from '@/i18n/navigation'

import type { BlockProps } from './types'

export async function BreadcrumbsBlock({ ctx }: BlockProps<'breadcrumbs'>) {
  if (ctx.page === 'city') return <CityBreadcrumbs city={ctx.city.name} region={ctx.city.region} />
  if (ctx.page === 'operator')
    return <CityBreadcrumbs city={ctx.operator.name} section="operators" />

  // Lists: "Miasta › Polska" / "Przewoźnicy › Polska"
  const t = await getTranslations(ctx.page === 'cities' ? 'CitiesList' : 'OperatorsList')
  return (
    <Breadcrumb aria-label={t('breadcrumbs')} className="py-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href={ctx.page === 'cities' ? '/cities' : '/operators'} />}>
            {t('title')}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="font-medium">{t('countryPoland')}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
