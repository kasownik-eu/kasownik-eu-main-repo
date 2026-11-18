import MiniSearch from 'minisearch'

import {
  miniSearchOptions,
  normalize,
  searchOptions,
  type SearchData,
  type SearchDocument,
  type SearchKind,
  type SearchSource,
} from './config'
import { readStored, writeStored } from './storage'

export type SearchHit = {
  id: string
  kind: SearchKind
  slug: string
  name: string
  country: string | null
  // [start, end) ranges of `name` to highlight
  marks: [number, number][]
}

export type SearchEngine = {
  version: string
  search: (query: string) => SearchHit[]
  popular: SearchHit[]
  // Every document, for the list pages
  size: number
}

// Above this many documents the index is built in chunks, so typing stays responsive while it builds
const ASYNC_INDEX_THRESHOLD = 2000

// One engine per locale and version for the whole page: every search bar shares it,
// and client-side navigation keeps it (the module stays loaded)
const engines = new Map<string, Promise<SearchEngine>>()

// Parts of the name that start with one of the typed words; same normalization as the index
export function highlight(name: string, query: string): [number, number][] {
  const words = normalize(query).split(/[\s\p{P}]+/u).filter(Boolean)
  if (!words.length) return []
  const haystack = normalize(name)
  const marks: [number, number][] = []
  for (const match of haystack.matchAll(/[\p{L}\p{N}]+/gu)) {
    const longest = words
      .filter((word) => match[0].startsWith(word))
      .sort((a, b) => b.length - a.length)[0]
    if (longest) marks.push([match.index, match.index + longest.length])
  }
  return marks
}

const toHit = (doc: Pick<SearchDocument, 'id' | 'kind' | 'slug' | 'name' | 'country'>, query: string): SearchHit => ({
  id: doc.id,
  kind: doc.kind,
  slug: doc.slug,
  name: doc.name,
  country: doc.country,
  marks: highlight(doc.name, query),
})

export async function buildEngine(data: SearchData): Promise<SearchEngine> {
  const index = new MiniSearch<SearchDocument>(miniSearchOptions)
  if (data.docs.length > ASYNC_INDEX_THRESHOLD) await index.addAllAsync(data.docs, { chunkSize: 500 })
  else index.addAll(data.docs)

  const byId = new Map(data.docs.map((doc) => [doc.id, doc]))
  return {
    version: data.version,
    size: data.docs.length,
    popular: data.popular.flatMap((id) => (byId.has(id) ? [toHit(byId.get(id)!, '')] : [])),
    search: (query) => {
      const trimmed = query.trim()
      if (!trimmed) return []
      return index
        .search(trimmed, searchOptions)
        .map((result) => toHit(result as unknown as SearchDocument, trimmed))
    },
  }
}

async function fetchData(source: SearchSource): Promise<SearchData> {
  const response = await fetch(source.url)
  if (!response.ok) throw new Error(`Search data: HTTP ${response.status}`)
  return (await response.json()) as SearchData
}

async function load(source: SearchSource): Promise<SearchEngine> {
  const stored = await readStored(source.locale, source.version)
  if (stored) return buildEngine(stored)

  const data = await fetchData(source)
  // Overwrites the previous version of this locale
  void writeStored(data)
  return buildEngine(data)
}

export function getSearchEngine(source: SearchSource): Promise<SearchEngine> {
  const key = `${source.locale}@${source.version}`
  let engine = engines.get(key)
  if (!engine) {
    engine = load(source)
    // A failed load (offline) may be retried on the next focus
    engine.catch(() => engines.delete(key))
    engines.set(key, engine)
  }
  return engine
}

// Tests only
export function resetEngines() {
  engines.clear()
}
