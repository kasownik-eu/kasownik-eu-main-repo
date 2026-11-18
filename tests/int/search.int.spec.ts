import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SearchData, SearchDocument } from '@/search/config'
import { normalize } from '@/search/config'
import { buildEngine, getSearchEngine, highlight, resetEngines } from '@/search/engine'

// In-memory stand-in for IndexedDB (jsdom has none)
const stored = new Map<string, SearchData>()
vi.mock('@/search/storage', () => ({
  readStored: async (locale: string, version: string) => {
    const data = stored.get(locale)
    return data?.version === version ? data : null
  },
  writeStored: async (data: SearchData) => {
    stored.set(data.locale, data)
  },
}))

const doc = (doc: Partial<SearchDocument> & Pick<SearchDocument, 'kind' | 'slug' | 'name'>) => ({
  id: `${doc.kind}:${doc.slug}`,
  country: 'Polska',
  region: null,
  keywords: '',
  ...doc,
})

const docs: SearchDocument[] = [
  doc({ kind: 'city', slug: 'katowice', name: 'Katowice', region: 'Śląskie' }),
  doc({ kind: 'city', slug: 'gliwice', name: 'Gliwice', region: 'Śląskie' }),
  doc({ kind: 'city', slug: 'lodz', name: 'Łódź', region: 'Łódzkie' }),
  doc({ kind: 'city', slug: 'krakow', name: 'Kraków', region: 'Małopolskie' }),
  doc({
    kind: 'operator',
    slug: 'mzt',
    name: 'Miejski Zarząd Transportu',
    keywords: 'MZT Katowice Gliwice',
  }),
]

const data = (version: string, extra: SearchDocument[] = []): SearchData => ({
  version,
  locale: 'pl',
  docs: [...docs, ...extra],
  popular: ['city:krakow', 'city:missing'],
})

describe('search matching', () => {
  it('normalizes case and diacritics without changing the length', () => {
    expect(normalize('Łódź')).toBe('lodz')
    expect(normalize('ŚLĄSKIE')).toBe('slaskie')
    expect(normalize('Kraków 🚋').length).toBe('Kraków 🚋'.length)
  })

  it('finds by prefix, without diacritics, by region and by served city', async () => {
    const engine = await buildEngine(data('v1'))
    expect(engine.search('kat').map((hit) => hit.id)).toEqual(['city:katowice', 'operator:mzt'])
    expect(engine.search('lodz')[0].name).toBe('Łódź')
    expect(engine.search('slask').map((hit) => hit.slug).sort()).toEqual(['gliwice', 'katowice'])
    expect(engine.search('mzt')[0].id).toBe('operator:mzt')
    // Every word has to match
    expect(engine.search('miejski krakow')).toEqual([])
    expect(engine.search('   ')).toEqual([])
  })

  it('tolerates a typo in longer words only', async () => {
    const engine = await buildEngine(data('v1'))
    expect(engine.search('katowive')[0]?.slug).toBe('katowice')
    expect(engine.search('kot')).toEqual([])
  })

  it('marks the typed beginning of each word', () => {
    expect(highlight('Łódź', 'lo')).toEqual([[0, 2]])
    expect(highlight('Miejski Zarząd Transportu', 'zarza tr')).toEqual([
      [8, 13],
      [15, 17],
    ])
    expect(highlight('Katowice', '')).toEqual([])
  })

  it('lists the popular places that exist', async () => {
    const engine = await buildEngine(data('v1'))
    expect(engine.popular.map((hit) => hit.id)).toEqual(['city:krakow'])
  })
})

describe('search data loading', () => {
  const fetchMock = vi.fn()
  const source = (version: string) => ({
    locale: 'pl',
    version,
    url: `/search/pl.json?v=${version}`,
  })

  beforeEach(() => {
    stored.clear()
    resetEngines()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  const serve = (body: SearchData) =>
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status: 200 }))

  it('fetches once, stores the data and shares one engine', async () => {
    serve(data('v1'))
    const [a, b] = await Promise.all([getSearchEngine(source('v1')), getSearchEngine(source('v1'))])
    expect(a).toBe(b)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/search/pl.json?v=v1')
    expect(stored.get('pl')?.version).toBe('v1')
  })

  it('uses the stored copy when the version matches', async () => {
    stored.set('pl', data('v1'))
    const engine = await getSearchEngine(source('v1'))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(engine.version).toBe('v1')
  })

  it('replaces the stored copy when the page has a newer version', async () => {
    stored.set('pl', data('v1'))
    serve(data('v2', [doc({ kind: 'city', slug: 'gdansk', name: 'Gdańsk' })]))
    const engine = await getSearchEngine(source('v2'))
    expect(fetchMock).toHaveBeenCalledWith('/search/pl.json?v=v2')
    expect(engine.search('gdan')[0]?.slug).toBe('gdansk')
    expect(stored.get('pl')?.version).toBe('v2')
  })

  it('retries after a failed download', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 503 }))
    await expect(getSearchEngine(source('v1'))).rejects.toThrow('HTTP 503')
    serve(data('v1'))
    await expect(getSearchEngine(source('v1'))).resolves.toMatchObject({ version: 'v1' })
  })
})
