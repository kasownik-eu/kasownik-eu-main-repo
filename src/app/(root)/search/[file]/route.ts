import { getSearchData } from '@/content'
import { routing, type Locale } from '@/i18n/routing'

// The site search data, one static file per locale: out/search/pl.json, out/search/en.json.
// Pages ask for it with ?v=<version>, so a new build is never served from an old HTTP cache
export const dynamic = 'force-static'
export const dynamicParams = false

export const generateStaticParams = () => routing.locales.map((locale) => ({ file: `${locale}.json` }))

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const locale = file.replace(/\.json$/, '') as Locale
  return Response.json(getSearchData(locale))
}
