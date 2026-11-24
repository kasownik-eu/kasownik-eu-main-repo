import type { Options, SearchOptions } from 'minisearch'

// Shared by the build (src/content/search.ts writes the data) and the browser (engine.ts indexes it).
// No Node or React imports here: both sides bundle this file.

// Bump when the document shape or the options below change: it is part of every data version,
// so browsers drop their stored copy even if the content itself did not change
export const SEARCH_FORMAT = 1

export type SearchKind = 'city' | 'operator'

export type SearchDocument = {
  // "city:<slug>" / "operator:<slug>": a city and an operator may share a slug
  id: string
  kind: SearchKind
  slug: string
  name: string
  country: string | null
  // Cities: their voivodeship, so "śląskie" finds every Silesian city
  region: string | null
  // Operators: short name and the cities they serve, so "Katowice" finds the operators there
  keywords: string
}

// What /search/<locale>.json holds
export type SearchData = {
  version: string
  locale: string
  docs: SearchDocument[]
  // Ids shown before anything is typed ("Popular places")
  popular: string[]
}

// Where the browser finds the data and which version the page was built with
export type SearchSource = {
  locale: string
  version: string
  url: string
}

export const searchDataPath = (locale: string) => `/search/${locale}.json`

// Case- and diacritic-insensitive, so "lodz" finds "Łódź" ("ł" has no NFD decomposition).
// Character by character and length-preserving, so an index in the normalized text is the same
// index in the original (highlighting relies on it)
export const normalize = (value: string) =>
  Array.from(value, (char) => {
    const folded = char
      .toLowerCase()
      .replace(/ł/g, 'l')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
    if (folded.length === char.length) return folded
    const lower = char.toLowerCase()
    return lower.length === char.length ? lower : char
  }).join('')

export const miniSearchOptions: Options<SearchDocument> = {
  fields: ['name', 'region', 'keywords'],
  storeFields: ['kind', 'slug', 'name', 'country'],
  processTerm: (term) => normalize(term) || null,
}

export const searchOptions: SearchOptions = {
  boost: { name: 3 },
  prefix: true,
  // Typos only in longer words: "kat" must not match "kot"
  fuzzy: (term) => (term.length > 4 ? 0.2 : false),
  combineWith: 'AND',
}
