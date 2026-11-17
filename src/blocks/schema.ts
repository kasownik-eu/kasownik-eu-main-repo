import { z } from 'zod'

import { localizedText, optionalText, slug } from '@/content/primitives'

// Block and template definitions without React, so the content loader and CLI scripts can validate templates.
// A template (templates/<page>/<name>.json) lists blocks per slot; src/blocks/registry.tsx renders each type.

export const pageKinds = ['city', 'operator', 'cities', 'operators'] as const
export type PageKind = (typeof pageKinds)[number]

// Slots of the page shell (src/blocks/RenderTemplate.tsx): above <main>, inside <main>, full width below it
export const templateSlots = ['top', 'main', 'bottom'] as const
export type TemplateSlot = (typeof templateSlots)[number]

const OPERATOR_PAGES = ['city', 'operator'] as const
const LIST_PAGES = ['cities', 'operators'] as const
const ALL_PAGES = pageKinds

type BlockDefinition = {
  pages: readonly PageKind[]
  // Settings written next to "type" in the template, e.g. { "type": "relatedOperators", "visible": 3 }
  settings: z.ZodObject
  // Also allowed in an operator's own `blocks` (operator.json), placed by the template's "operatorBlocks"
  operatorContent?: boolean
}

const none = () => z.strictObject({})
const define = <P extends readonly PageKind[], S extends z.ZodObject>(
  pages: P,
  settings: S,
  options: { operatorContent?: boolean } = {},
) => ({ pages, settings, ...options }) satisfies BlockDefinition

export const blockDefinitions = {
  // Shared: "Cities › Poland › region › city" on detail pages, "Cities › Poland" on lists
  breadcrumbs: define(ALL_PAGES, none()),

  // City and operator pages (content of the page's operator; on a city page, the city's primary operator)
  sampleNotice: define(OPERATOR_PAGES, none()),
  operatorHeader: define(OPERATOR_PAGES, none()),
  purchaseMethods: define(OPERATOR_PAGES, none()),
  tickets: define(OPERATOR_PAGES, none()),
  zones: define(OPERATOR_PAGES, none()),
  servedCities: define(OPERATOR_PAGES, none()),
  relatedOperators: define(
    OPERATOR_PAGES,
    z.strictObject({
      // Cards shown before "Show all"
      visible: z.int().min(1).max(12).optional(),
    }),
  ),
  sourceFooter: define(OPERATOR_PAGES, none()),
  // Placeholder: the operator's own `blocks` from operator.json are rendered here
  operatorBlocks: define(OPERATOR_PAGES, none()),

  // List pages
  pageHeading: define(
    LIST_PAGES,
    z.strictObject({
      countrySelect: z.boolean().optional(),
    }),
  ),
  citiesBrowser: define(['cities'] as const, none()),
  operatorsBrowser: define(['operators'] as const, none()),
  listFooter: define(LIST_PAGES, none()),

  // Generic content parts, usable anywhere and in an operator's own blocks
  notice: define(
    ALL_PAGES,
    z.strictObject({
      tone: z.enum(['info', 'warning']).optional(),
      title: optionalText,
      text: localizedText,
    }),
    { operatorContent: true },
  ),
  text: define(
    ALL_PAGES,
    z.strictObject({
      // Section anchor (#id); defaults to the block's position
      id: slug.optional(),
      title: localizedText,
      lead: optionalText,
      // Paragraphs are separated by a blank line
      body: localizedText,
    }),
    { operatorContent: true },
  ),
} as const

export type BlockType = keyof typeof blockDefinitions
export type BlockPages<T extends BlockType> = (typeof blockDefinitions)[T]['pages'][number]
export type BlockOf<T extends BlockType> = { type: T } & z.infer<
  (typeof blockDefinitions)[T]['settings']
>
export type Block = { [T in BlockType]: BlockOf<T> }[BlockType]

export const blockTypes = Object.keys(blockDefinitions) as BlockType[]

const blockSchemaOf = (types: BlockType[]) =>
  z.discriminatedUnion(
    'type',
    types.map((type) =>
      blockDefinitions[type].settings.extend({ type: z.literal(type) }),
    ) as unknown as [z.ZodObject, ...z.ZodObject[]],
  ) as unknown as z.ZodType<Block>

export const blockSchema = blockSchemaOf(blockTypes)

export const operatorBlockTypes = blockTypes.filter(
  (type) => (blockDefinitions[type] as BlockDefinition).operatorContent,
)
export const operatorBlockSchema = blockSchemaOf(operatorBlockTypes)

export const templateFile = z.strictObject({
  // What the template is for; not rendered
  description: z.string().optional(),
  top: z.array(blockSchema).optional(),
  main: z.array(blockSchema).optional(),
  bottom: z.array(blockSchema).optional(),
})
export type Template = z.infer<typeof templateFile>

export const allowsPage = (type: BlockType, page: PageKind) =>
  (blockDefinitions[type].pages as readonly PageKind[]).includes(page)
