import { BreadcrumbsBlock } from './BreadcrumbsBlock'
import { NoticeBlock, TextBlock } from './ContentBlocks'
import {
  CitiesBrowserBlock,
  ListFooterBlock,
  OperatorsBrowserBlock,
  PageHeadingBlock,
} from './ListBlocks'
import {
  OperatorHeaderBlock,
  PurchaseMethodsBlock,
  RelatedOperatorsBlock,
  ServedCitiesBlock,
  SourceFooterBlock,
  TicketsBlock,
  ZonesBlock,
} from './OperatorBlocks'
import { SampleNoticeBlock } from './SampleNoticeBlock'
import type { BlockType } from './schema'
import type { BlockComponent } from './types'

// Block type -> component. TypeScript fails here until a type added to blockDefinitions (schema.ts) gets one.
// "operatorBlocks" has no component: RenderTemplate replaces it with the operator's own blocks
export const blockRegistry: { [T in Exclude<BlockType, 'operatorBlocks'>]: BlockComponent<T> } = {
  breadcrumbs: BreadcrumbsBlock,
  sampleNotice: SampleNoticeBlock,
  operatorHeader: OperatorHeaderBlock,
  purchaseMethods: PurchaseMethodsBlock,
  tickets: TicketsBlock,
  zones: ZonesBlock,
  servedCities: ServedCitiesBlock,
  relatedOperators: RelatedOperatorsBlock,
  sourceFooter: SourceFooterBlock,
  pageHeading: PageHeadingBlock,
  citiesBrowser: CitiesBrowserBlock,
  operatorsBrowser: OperatorsBrowserBlock,
  listFooter: ListFooterBlock,
  notice: NoticeBlock,
  text: TextBlock,
}
