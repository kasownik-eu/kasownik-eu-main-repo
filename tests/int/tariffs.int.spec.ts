import { mkdtemp, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { diffTariff } from '@/tariffs/diffTariff'
import { extractContent, TariffXPathError } from '@/tariffs/extractContent'
import { isUnchanged, promote, storeFetched } from '@/tariffs/pageCache'
import { reviewReasons } from '@/tariffs/reviewPolicy'
import { tariffSchema } from '@/tariffs/schema'
import type { TariffData } from '@/tariffs/types'

const html = `<html><body>
  <nav>Menu Home Contact</nav>
  <script>var tracking = 1</script>
  <main>
    <h1>Cennik</h1>
    <div id="tariff"><table>
      <tr><th>Bilet</th><th>Normalny</th></tr>
      <tr><td>20 min</td><td>3,40 zł</td></tr>
    </table></div>
    <p>Inne informacje</p>
  </main>
</body></html>`

const fixture = async (): Promise<TariffData> =>
  tariffSchema.parse(JSON.parse(await readFile('tests/fixtures/tariffs/mzt-przykladowe.json', 'utf8')))

describe('extractContent', () => {
  it('selects only the XPath block and keeps table rows', () => {
    const text = extractContent(html, 'https://example.com', "//div[@id='tariff']")
    expect(text).toBe('Bilet | Normalny\n20 min | 3,40 zł')
  })

  it('strips noise when no XPath is given', () => {
    const text = extractContent(html, 'https://example.com')
    expect(text).toContain('Cennik')
    expect(text).toContain('Inne informacje')
    expect(text).not.toContain('tracking')
    expect(text).not.toContain('Menu')
  })

  it('fails when the XPath matches nothing', () => {
    expect(() => extractContent(html, 'https://example.com', "//div[@id='gone']")).toThrow(TariffXPathError)
  })

  it('fails on an invalid XPath', () => {
    expect(() => extractContent(html, 'https://example.com', '//div[')).toThrow(TariffXPathError)
  })
})

describe('pageCache', () => {
  let dir: string
  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'tariff-cache-'))
    process.env.TARIFF_CACHE_DIR = dir
  })
  afterAll(() => rm(dir, { recursive: true, force: true }))

  it('detects changes only against promoted copies', async () => {
    const url = 'https://example.com/cennik'
    await storeFetched('operator', url, '<p>a</p>', 'a')
    expect(await isUnchanged('operator', url, 'a')).toBe(false) // nothing promoted yet

    await promote('operator', url)
    expect(await isUnchanged('operator', url, 'a')).toBe(true)

    await storeFetched('operator', url, '<p>b</p>', 'b') // fetched but not promoted (e.g. LLM failed)
    expect(await isUnchanged('operator', url, 'b')).toBe(false)
    expect(await isUnchanged('operator', url, 'a')).toBe(true)
  })
})

describe('tariffSchema', () => {
  it('accepts the fixture', async () => {
    expect((await fixture()).tickets.length).toBeGreaterThan(0)
  })

  it('rejects an unknown ticket category', async () => {
    const data = await fixture()
    const bad = { ...data, tickets: [{ ...data.tickets[0], category: 'lifetime' }] }
    expect(tariffSchema.safeParse(bad).success).toBe(false)
  })
})

describe('diffTariff + reviewPolicy', () => {
  it('finds no changes for identical data', async () => {
    const data = await fixture()
    expect(diffTariff(data, structuredClone(data))).toEqual([])
  })

  it('applies translation tweaks without review', async () => {
    const data = await fixture()
    const next = structuredClone(data)
    next.tickets[0].name.en = '20 minute ticket'
    const changes = diffTariff(data, next)
    expect(changes).toEqual([expect.objectContaining({ path: 'tickets[single:bilet 20-minutowy].name.en', major: false })])
    expect(reviewReasons(data, changes)).toEqual([])
  })

  it('applies a small price change without review', async () => {
    const data = await fixture()
    const next = structuredClone(data)
    next.tickets[1].priceNormal = 5.2
    const changes = diffTariff(data, next)
    expect(changes).toHaveLength(1)
    expect(changes[0].major).toBe(true)
    expect(reviewReasons(data, changes)).toEqual([])
  })

  it('requires review for a large price jump', async () => {
    const data = await fixture()
    const next = structuredClone(data)
    next.tickets[1].priceNormal = 6.5
    expect(reviewReasons(data, diffTariff(data, next))).toEqual([expect.stringContaining('Prices changed')])
  })

  it('requires review for a removed ticket', async () => {
    const data = await fixture()
    const next = structuredClone(data)
    next.tickets.pop()
    const changes = diffTariff(data, next)
    expect(changes).toEqual([expect.objectContaining({ kind: 'removed', path: 'tickets[long:bilet miesięczny]' })])
    expect(reviewReasons(data, changes)).toEqual([expect.stringContaining('Tickets added or removed')])
  })

  it('requires review on first import', async () => {
    const data = await fixture()
    const empty: TariffData = {
      tickets: [],
      luggage: [],
      zones: { enabled: false, items: [], noteTitle: null, note: null },
      rulesNote: null,
    }
    expect(reviewReasons(empty, diffTariff(empty, data))[0]).toContain('First import')
  })
})
