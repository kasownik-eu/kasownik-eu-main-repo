import type { Block, Template, TemplateSlot } from './schema'
import type { PageContext } from './types'

// The blocks a slot renders, with "operatorBlocks" replaced by the page operator's own blocks
export const resolveSlot = (template: Template, slot: TemplateSlot, ctx: PageContext): Block[] =>
  (template[slot] ?? []).flatMap((block) =>
    block.type === 'operatorBlocks' ? ('operator' in ctx ? ctx.operator.blocks : []) : [block],
  )
