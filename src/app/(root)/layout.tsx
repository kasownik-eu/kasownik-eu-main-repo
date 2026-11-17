import React from 'react'

// Bare root layout for "/" only; the site itself lives under /pl and /en (app/(frontend)/<locale>)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  )
}
