import { cp, mkdtemp, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadCatalog } from '@/content/load'
import { applyTariff, toTariffData } from '@/tariffs/applyTariff'
import { diffTariff } from '@/tariffs/diffTariff'
import { extractContent, TariffXPathError } from '@/tariffs/extractContent'
import { isUnchanged, promote, storeFetched } from '@/tariffs/pageCache'
import { tariffSchema, tariffSchemaFor } from '@/tariffs/schema'
import { syncAllTariffs } from '@/tariffs/syncTariffs'
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
  tariffSchema.parse(
    JSON.parse(await readFile('tests/fixtures/tariffs/mzt-przykladowe.json', 'utf8')),
  )

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
    expect(() => extractContent(html, 'https://example.com', "//div[@id='gone']")).toThrow(
      TariffXPathError,
    )
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

  it("rejects modes the operator doesn't run", async () => {
    const data = await fixture()
    expect(tariffSchemaFor(['tram', 'bus', 'metro']).safeParse(data).success).toBe(true)
    expect(tariffSchemaFor(['tram', 'bus']).safeParse(data).success).toBe(false)
  })
})

describe('diffTariff', () => {
  it('finds no changes for identical data', async () => {
    const data = await fixture()
    expect(diffTariff(data, structuredClone(data))).toEqual([])
  })

  it('marks translation tweaks as minor', async () => {
    const data = await fixture()
    const next = structuredClone(data)
    next.tickets[0].name.en = '20 minute ticket'
    expect(diffTariff(data, next)).toEqual([
      expect.objectContaining({ path: 'tickets[single:bilet 20-minutowy].name.en', major: false }),
    ])
  })

  it('marks price changes as major', async () => {
    const data = await fixture()
    const next = structuredClone(data)
    next.tickets[1].priceNormal = 5.2
    const changes = diffTariff(data, next)
    expect(changes).toHaveLength(1)
    expect(changes[0].major).toBe(true)
  })

  it('reports a removed ticket', async () => {
    const data = await fixture()
    const next = structuredClone(data)
    next.tickets.pop()
    expect(diffTariff(data, next)).toEqual([
      expect.objectContaining({
        kind: 'removed',
        path: 'tickets[long:bilet miesięczny]',
        major: true,
      }),
    ])
  })
})

describe('applyTariff', () => {
  let dir: string
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'tariff-apply-'))
    await cp('tests/fixtures/content', dir, { recursive: true })
  })
  afterEach(() => rm(dir, { recursive: true, force: true }))

  const operatorDir = () => path.join(dir, 'polska', 'slaskie', 'testowy')
  const readJson = async (file: string) =>
    JSON.parse(await readFile(path.join(operatorDir(), file), 'utf8'))

  it('writes the tariff files, keeps the zone map and the rest of the operator', async () => {
    const data = await fixture()
    const operator = loadCatalog(dir).operators.get('testowy')!
    await applyTariff(operator, data, { rulesUrl: 'https://example.com/cennik' })

    const tickets = await readJson('tickets.json')
    expect(tickets.tickets).toEqual(data.tickets)
    expect(tickets.rulesUrl).toBe('https://example.com/cennik')
    expect((await readJson('zones.json')).map).toEqual({
      file: 'map.svg',
      alt: { pl: 'Mapa stref' },
    })
    const info = await readJson('operator.json')
    expect(info.sources.aiAssisted).toBe(true)
    expect(Object.keys(info)[0]).toBe('name') // raw JSON edited in place, key order kept

    // The written files are valid content and read back as the same tariff
    const reloaded = loadCatalog(dir).operators.get('testowy')!
    expect(diffTariff(toTariffData(reloaded), data)).toEqual([])
  })

  it('reads English as Polish where the content has no translation', () => {
    const operator = loadCatalog(dir).operators.get('testowy')!
    expect(toTariffData(operator).tickets[0].name).toEqual({
      pl: 'Bilet jednorazowy',
      en: 'Bilet jednorazowy',
    })
  })
})

describe('syncAllTariffs', () => {
  let dir: string
  let cache: string
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'tariff-sync-'))
    cache = await mkdtemp(path.join(tmpdir(), 'tariff-sync-cache-'))
    await cp('tests/fixtures/content', dir, { recursive: true })
    process.env.TARIFF_CACHE_DIR = cache
    process.env.TARIFF_LLM_PROVIDER = 'fixture'
    // The fixture provider returns <dir>/<slug>.json
    process.env.TARIFF_LLM_FIXTURE_DIR = cache
    await cp('tests/fixtures/tariffs/mzt-przykladowe.json', path.join(cache, 'testowy.json'))
    vi.stubGlobal(
      'fetch',
      async () => new Response(html, { headers: { 'content-type': 'text/html' } }),
    )
  })
  afterEach(async () => {
    vi.unstubAllGlobals()
    await Promise.all([
      rm(dir, { recursive: true, force: true }),
      rm(cache, { recursive: true, force: true }),
    ])
  })

  it('applies the extracted tariff to the JSON files, then skips an unchanged page', async () => {
    const first = await syncAllTariffs({ contentDir: dir })
    expect(first.counts).toEqual({ applied: 1 })
    const written = JSON.parse(
      await readFile(path.join(dir, 'polska/slaskie/testowy/tickets.json'), 'utf8'),
    )
    expect(written.tickets).toEqual((await fixture()).tickets)

    const second = await syncAllTariffs({ contentDir: dir })
    expect(second.counts).toEqual({ unchanged_source: 1 })
  })

  it('writes nothing in dry-run mode', async () => {
    const before = await readFile(path.join(dir, 'polska/slaskie/testowy/tickets.json'), 'utf8')
    const summary = await syncAllTariffs({ contentDir: dir, dryRun: true })
    expect(summary.counts).toEqual({ applied: 1 })
    expect(await readFile(path.join(dir, 'polska/slaskie/testowy/tickets.json'), 'utf8')).toBe(
      before,
    )
  })
})
