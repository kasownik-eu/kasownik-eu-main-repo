'use client'

import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

type Props = {
  visible: React.ReactNode[]
  hidden: React.ReactNode[]
  showAllLabel: string
  showLessLabel: string
  className?: string
}

// Server-rendered items; only the expand/collapse state lives on the client
export function ShowMoreList({ visible, hidden, showAllLabel, showLessLabel, className }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={className}>{visible}</div>
      {hidden.length > 0 && (
        <>
          <CollapsibleContent>
            <div className={`mt-4 ${className ?? ''}`}>{hidden}</div>
          </CollapsibleContent>
          <div className="mt-4 flex justify-center">
            <CollapsibleTrigger render={<Button variant="outline" size="lg" />}>
              {open ? showLessLabel : showAllLabel}
            </CollapsibleTrigger>
          </div>
        </>
      )}
    </Collapsible>
  )
}
