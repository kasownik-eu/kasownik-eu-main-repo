import { InfoIcon, TriangleAlertIcon } from 'lucide-react'
import React from 'react'

import { Section } from '@/components/city/Section'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import type { BlockProps } from './types'

// Generic parts with their own texts: usable in any template and in an operator's own `blocks`

export function NoticeBlock({ block }: BlockProps<'notice'>) {
  const Icon = block.tone === 'warning' ? TriangleAlertIcon : InfoIcon

  return (
    <Alert role="note" className="mt-6 px-4 py-3">
      <Icon aria-hidden="true" />
      {block.title && <AlertTitle>{block.title}</AlertTitle>}
      <AlertDescription>{block.text}</AlertDescription>
    </Alert>
  )
}

export function TextBlock({ block, id }: BlockProps<'text'>) {
  return (
    <Section id={block.id ?? id} title={block.title} lead={block.lead ?? undefined}>
      <div className="grid max-w-[68ch] gap-4 text-lg">
        {block.body.split(/\n\s*\n/).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </Section>
  )
}
