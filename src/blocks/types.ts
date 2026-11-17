import type React from 'react'

import type { CityRef, CityView, Localized, OperatorSummary, OperatorView } from '@/content'
import type { Locale } from '@/i18n/routing'

import type { BlockOf, BlockPages, BlockType, PageKind } from './schema'

// What each page kind hands to its blocks
type PageContexts = {
  city: {
    page: 'city'
    locale: Locale
    city: CityView
    // The city's primary operator
    operator: OperatorView
    // The city's other operators
    sameCity: OperatorSummary[]
  }
  operator: { page: 'operator'; locale: Locale; operator: OperatorView }
  cities: { page: 'cities'; locale: Locale; cities: CityRef[] }
  operators: { page: 'operators'; locale: Locale; operators: OperatorSummary[] }
}

export type PageContext<K extends PageKind = PageKind> = PageContexts[K]

export type BlockProps<T extends BlockType> = {
  // Narrowed to the pages the block is allowed on (blockDefinitions[T].pages)
  ctx: PageContext<BlockPages<T>>
  // The block's settings from the template, texts resolved to the page's locale
  block: Localized<BlockOf<T>>
  // Unique within the page, e.g. "main-3"; usable as a section anchor
  id: string
}

export type BlockComponent<T extends BlockType> = (
  props: BlockProps<T>,
) => React.ReactNode | Promise<React.ReactNode>
