import React from 'react'

import { LineMark } from '@/components/site/decor'

type Props = {
  id: string
  title: string
  lead?: string
  children: React.ReactNode
}

// Module shell: h2 + lead, labelled for assistive tech
export function Section({ id, title, lead, children }: Props) {
  const headingId = `${id}-title`

  return (
    <section aria-labelledby={headingId} className="mt-12">
      <h2 id={headingId} className="flex items-center gap-3 text-2xl font-semibold tracking-tight sm:text-3xl">
        <LineMark />
        <span>{title}</span>
      </h2>
      {lead && <p className="mt-2 text-lg text-muted-foreground">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  )
}
