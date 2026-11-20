import { extractContent } from '@/tariffs/extractContent'
import { fetchPage } from '@/tariffs/fetchPage'

// Usage: npm run research:check-source -- <url> [xpath]
// Fetches and extracts a page exactly like the LLM pipelines do, so a page that would fail there (not HTML,
// JS-rendered, XPath matching nothing) is caught before it is saved to tariffSources/purchaseSources/zoneSources
const [url, xpath] = process.argv.slice(2)
if (!url) {
  console.error('Usage: npm run research:check-source -- <url> [xpath]')
  process.exit(1)
}

try {
  const text = extractContent(await fetchPage(url), url, xpath || null)
  console.log(`OK ${url}${xpath ? ` (XPath ${xpath})` : ''}: ${text.length} chars\n`)
  console.log(text.slice(0, 1500))
  if (text.length > 1500) console.log(`\n… (${text.length - 1500} more chars)`)
} catch (err) {
  console.error(`FAILED ${url}: ${(err as Error).message}`)
  process.exit(1)
}
