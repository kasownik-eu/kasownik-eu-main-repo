import { extractContent } from '@/check/extractContent'
import { fetchPage } from '@/check/fetchPage'

// Usage: npm run research:check-source -- <url> [xpath] [--full]
// Fetches and extracts a page exactly like the checker does, so a page that would fail there (not HTML, JS-rendered,
// XPath matching nothing) is caught before it is saved to *Sources. --full prints the whole text: evidence.json quotes
// are copied from it word for word (the checker compares them after collapsing whitespace)
const args = process.argv.slice(2)
const full = args.includes('--full')
const [url, xpath] = args.filter((arg) => arg !== '--full')
if (!url) {
  console.error('Usage: npm run research:check-source -- <url> [xpath] [--full]')
  process.exit(1)
}

try {
  const text = extractContent(await fetchPage(url), url, xpath || null)
  console.log(`OK ${url}${xpath ? ` (XPath ${xpath})` : ''}: ${text.length} chars\n`)
  const shown = full ? text : text.slice(0, 1500)
  console.log(shown)
  if (shown.length < text.length)
    console.log(`\n… (${text.length - shown.length} more chars, --full prints all)`)
} catch (err) {
  console.error(`FAILED ${url}: ${(err as Error).message}`)
  process.exit(1)
}
