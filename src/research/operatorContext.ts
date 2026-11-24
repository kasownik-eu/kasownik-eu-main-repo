import { existsSync } from 'fs'
import path from 'path'

import { transportModes } from '@/content/enums'
import { type Catalog, IMAGES_DIR, type RawOperator } from '@/content/load'

// Facts the operator-research skill (.claude/skills/operator-research) needs before it searches the web:
// whether the operator already exists, and the slugs/names it must reuse so the loader's cross-file checks pass

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
}

// Operators whose websiteUrl is on the same host (ignoring "www."); the path does not matter
export const findOperatorsByUrl = (catalog: Catalog, url: string): RawOperator[] => {
  const host = hostOf(url)
  if (!host) throw new Error(`"${url}" is not a valid URL`)
  return [...catalog.operators.values()].filter(
    (operator) => operator.info.websiteUrl && hostOf(operator.info.websiteUrl) === host,
  )
}

export const operatorContext = (catalog: Catalog, url: string, root: string) => {
  const matches = findOperatorsByUrl(catalog, url)
  return {
    url,
    mode: matches.length ? ('verify' as const) : ('discover' as const),
    // Local date, as written to verifiedAt
    today: new Date().toLocaleDateString('sv-SE'),
    matches: matches.map((operator) => ({
      slug: operator.slug,
      dir: path.relative(process.cwd(), operator.dir),
      country: operator.country,
      voivodeship: operator.voivodeship,
      logoExists: operator.info.logo
        ? existsSync(path.join(operator.dir, IMAGES_DIR, operator.info.logo.file))
        : false,
      operator: operator.info,
      cities: operator.cities,
    })),
    contentDir: path.relative(process.cwd(), root),
    transportModes,
    voivodeships: [...catalog.voivodeships.values()].map(({ slug, country, code, name }) => ({
      slug,
      country,
      code,
      name: name.pl,
    })),
    operators: [...catalog.operators.values()].map((operator) => ({
      slug: operator.slug,
      name: operator.info.name,
      websiteUrl: operator.info.websiteUrl ?? null,
    })),
    cities: [...catalog.cities.values()].map(({ slug, name, voivodeship, operators }) => ({
      slug,
      name,
      voivodeship,
      operators,
    })),
  }
}
