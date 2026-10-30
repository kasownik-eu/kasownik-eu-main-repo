import { JSDOM } from 'jsdom'

export class TariffXPathError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TariffXPathError'
  }
}

const NOISE = 'script, style, noscript, svg, iframe, nav, header, footer, form, template'
const BLOCKS = 'p, div, section, article, li, h1, h2, h3, h4, h5, h6, dt, dd, caption, br'

const selectRoots = (document: Document, url: string, xpath?: string | null): Element[] => {
  if (!xpath) return [document.querySelector('main') ?? document.body]

  let snapshot: XPathResult
  try {
    snapshot = document.evaluate(xpath, document, null, 7 /* ORDERED_NODE_SNAPSHOT_TYPE */, null)
  } catch (err) {
    throw new TariffXPathError(`Invalid XPath "${xpath}" for ${url}: ${(err as Error).message}`)
  }

  const roots: Element[] = []
  for (let i = 0; i < snapshot.snapshotLength; i++) {
    const node = snapshot.snapshotItem(i)
    if (node && node.nodeType === 1) roots.push(node as Element)
  }
  if (roots.length === 0) throw new TariffXPathError(`XPath "${xpath}" matched nothing on ${url}`)
  return roots
}

// Turns the tariff block into plain text that keeps table rows and paragraphs readable for the LLM
const toText = (root: Element): string => {
  root.querySelectorAll(NOISE).forEach((el) => el.remove())
  root.querySelectorAll('tr').forEach((tr) => {
    const cells = Array.from(tr.querySelectorAll('th, td')).map((cell) => cell.textContent?.replace(/\s+/g, ' ').trim())
    tr.textContent = `\n${cells.join(' | ')}\n`
  })
  root.querySelectorAll(BLOCKS).forEach((el) => el.append('\n'))

  return (root.textContent ?? '')
    .split('\n')
    .map((line) => line.replace(/[ \t ]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}

export const extractContent = (html: string, url: string, xpath?: string | null): string => {
  const { document } = new JSDOM(html, { url }).window
  return selectRoots(document, url, xpath).map(toText).join('\n\n')
}
