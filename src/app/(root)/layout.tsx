import React from 'react'

export const metadata = { title: 'Kasownik.eu' }

// Bare root layout for "/" only; the site itself lives under /pl and /en (app/(frontend)/<locale>)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  )
}
