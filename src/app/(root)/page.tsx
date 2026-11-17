import { MetaRedirect } from '@/components/site/MetaRedirect'
import { routing } from '@/i18n/routing'

export default function RootPage() {
  return <MetaRedirect locale={routing.defaultLocale} />
}
