import { getPayload, type Where } from 'payload'
import { cache } from 'react'

import type { Locale } from '@/i18n/routing'
import config from '@/payload.config'

// Depth 2 reaches related operators' logos and the cities they serve ("Jeździ też w")
export const findOperator = async (where: Where, locale: Locale) => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'operators', where, locale, limit: 1, depth: 2 })

  return docs[0] ?? null
}

export const getOperatorBySlug = cache((slug: string, locale: Locale) => findOperator({ slug: { equals: slug } }, locale))

export const getOperatorById = cache((id: number, locale: Locale) => findOperator({ id: { equals: id } }, locale))
