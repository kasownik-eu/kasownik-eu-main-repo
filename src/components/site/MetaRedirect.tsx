import React from 'react'

import { getPathname } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'

// A static host has no server to answer with a redirect, so the page does it: meta refresh (React hoists it
// into <head>) plus a plain link. The city list is the entry point of the site
export function MetaRedirect({ locale }: { locale: Locale }) {
  const href = getPathname({ href: '/cities', locale })

  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${href}`} />
      <link rel="canonical" href={href} />
      <a href={href}>Kasownik.eu</a>
    </>
  )
}
