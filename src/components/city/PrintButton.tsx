'use client'

import { PrinterIcon } from 'lucide-react'
import React from 'react'

import { Button } from '@/components/ui/button'

export function PrintButton({ label }: { label: string }) {
  return (
    <Button variant="outline" size="lg" onClick={() => window.print()}>
      <PrinterIcon data-icon="inline-start" aria-hidden="true" />
      {label}
    </Button>
  )
}
