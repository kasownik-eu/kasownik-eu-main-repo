import React from 'react'

import { localize } from '@/content'

import { blockRegistry } from './registry'
import { resolveSlot } from './resolve'
import type { Template, TemplateSlot } from './schema'
import type { BlockComponent, PageContext } from './types'

type Props = {
  template: Template
  ctx: PageContext
}

function Slot({ template, ctx, slot }: Props & { slot: TemplateSlot }) {
  return resolveSlot(template, slot, ctx).map((block, index) => {
    // The loader only lets a template use blocks allowed on its page kind, so ctx matches the block's pages
    const Component = blockRegistry[block.type as keyof typeof blockRegistry] as BlockComponent<
      typeof block.type
    >
    const id = `${slot}-${index}`
    return (
      <Component key={id} id={id} ctx={ctx as never} block={localize(block, ctx.locale) as never} />
    )
  })
}

// Page shell shared by every page: top (breadcrumbs) in the content column, then <main> with the full-width
// hero bands and the content column, and bottom full width
export function RenderTemplate({ template, ctx }: Props) {
  return (
    <>
      {template.top?.length ? (
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Slot template={template} ctx={ctx} slot="top" />
        </div>
      ) : null}
      <main id="main" tabIndex={-1} className="outline-none">
        <Slot template={template} ctx={ctx} slot="hero" />
        <div className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6">
          <Slot template={template} ctx={ctx} slot="main" />
        </div>
      </main>
      <Slot template={template} ctx={ctx} slot="bottom" />
    </>
  )
}
