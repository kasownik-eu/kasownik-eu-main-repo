'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import type { SearchSource } from './config'
import { getSearchEngine, type SearchEngine, type SearchHit } from './engine'

// The locale layout provides where the search data lives and which version this build has;
// every search bar on the page reads it from here
const SearchSourceContext = createContext<SearchSource | null>(null)

export function SearchSourceProvider({
  source,
  children,
}: {
  source: SearchSource
  children: React.ReactNode
}) {
  return React.createElement(SearchSourceContext.Provider, { value: source }, children)
}

export type SearchStatus = 'idle' | 'loading' | 'ready' | 'error'

// The data is fetched on first use (focus, hover, typing), not with the page
export function useSearchEngine() {
  const source = useContext(SearchSourceContext)
  if (!source) throw new Error('useSearchEngine needs a SearchSourceProvider')
  const [engine, setEngine] = useState<SearchEngine | null>(null)
  const [status, setStatus] = useState<SearchStatus>('idle')

  const load = useCallback(() => {
    if (engine && engine.version === source.version) return
    setStatus((current) => (current === 'ready' ? current : 'loading'))
    getSearchEngine(source).then(
      (loaded) => {
        setEngine(loaded)
        setStatus('ready')
      },
      () => setStatus('error'),
    )
  }, [engine, source])

  return { engine, status, load }
}

// Hits for a query; starts loading as soon as there is something to search for
export function useSearch(query: string) {
  const { engine, status, load } = useSearchEngine()
  const trimmed = query.trim()

  useEffect(() => {
    if (trimmed) load()
  }, [trimmed, load])

  const hits = useMemo<SearchHit[] | null>(
    () => (trimmed && engine ? engine.search(trimmed) : null),
    [engine, trimmed],
  )

  return { engine, status, load, hits, active: trimmed.length > 0 }
}
