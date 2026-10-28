import { redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'

type Props = {
  params: Promise<{ locale: Locale }>
}

// The city list is the entry point of the site
export default async function HomePage({ params }: Props) {
  const { locale } = await params
  redirect({ href: '/cities', locale })
}
