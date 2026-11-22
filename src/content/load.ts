import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import path from 'path'
import { z } from 'zod'

import { allowsPage, pageKinds, type PageKind, type Template, templateFile, templateSlots } from '@/blocks/schema'

import {
  citiesFile,
  countryFile,
  evidenceFile,
  type EvidenceFile,
  type CitiesFile,
  type CountryFile,
  type ImageRef,
  operatorFile,
  type OperatorFile,
  purchaseFile,
  type PurchaseFile,
  ticketsFile,
  type TicketsFile,
  voivodeshipFile,
  type VoivodeshipFile,
  zonesFile,
  type ZonesFile,
} from './schema'

// data/<country>/<voivodeship>/<operator>/{operator,cities,purchase,tickets,zones,evidence}.json + images/
export const OPERATOR_FILES = {
  info: 'operator.json',
  cities: 'cities.json',
  purchase: 'purchase.json',
  tickets: 'tickets.json',
  zones: 'zones.json',
  evidence: 'evidence.json',
} as const
export const IMAGES_DIR = 'images'
const COUNTRY_FILE = 'country.json'
const VOIVODESHIP_FILE = 'voivodeship.json'

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

export type Country = CountryFile & { slug: string }
export type Voivodeship = VoivodeshipFile & { slug: string; country: string }

export type RawOperator = {
  slug: string
  // Absolute path of the operator folder
  dir: string
  country: string
  voivodeship: string
  info: OperatorFile
  cities: CitiesFile
  purchase: PurchaseFile
  tickets: TicketsFile | null
  zones: ZonesFile | null
  // Quotes backing the facts, written by the operator-research skill, read by the checker
  evidence: EvidenceFile | null
}

export type RawCity = {
  slug: string
  name: CitiesFile[number]['name']
  country: string
  voivodeship: string
  // Primary operator first, then by name
  operators: string[]
}

export type Catalog = {
  countries: Country[]
  voivodeships: Map<string, Voivodeship>
  operators: Map<string, RawOperator>
  cities: Map<string, RawCity>
  // templates/<page>/<name>.json
  templates: Record<PageKind, Map<string, Template>>
}

export const DEFAULT_TEMPLATE = 'default'

export class ContentError extends Error {
  constructor(readonly problems: string[]) {
    super(`Invalid content or templates:\n${problems.map((p) => `  - ${p}`).join('\n')}`)
    this.name = 'ContentError'
  }
}

export const contentDir = () => path.resolve(process.env.CONTENT_DIR || 'data')
export const templatesDir = () => path.resolve(process.env.TEMPLATES_DIR || 'templates')

const subdirs = (dir: string) =>
  readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort()

// Collects every problem instead of stopping at the first one, so one build run lists all of them
// Problems name files relative to `root`, after `label` (e.g. "templates/city/default.json")
const createReader = (root: string, problems: string[], label = '') => {
  const rel = (file: string) => label + path.relative(root, file) || '.'

  function read<S extends z.ZodType>(file: string, schema: S, optional: true): z.infer<S> | null
  function read<S extends z.ZodType>(
    file: string,
    schema: S,
    optional?: false,
  ): z.infer<S> | undefined
  function read<S extends z.ZodType>(file: string, schema: S, optional = false) {
    if (!existsSync(file)) {
      if (!optional) problems.push(`${rel(file)}: file is missing`)
      return optional ? null : undefined
    }
    let json: unknown
    try {
      json = JSON.parse(readFileSync(file, 'utf8'))
    } catch (err) {
      problems.push(`${rel(file)}: not valid JSON (${(err as Error).message})`)
      return undefined
    }
    const parsed = schema.safeParse(json)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const at = issue.path.length ? ` at ${issue.path.join('.')}` : ''
        problems.push(`${rel(file)}${at}: ${issue.message}`)
      }
      return undefined
    }
    return parsed.data
  }

  return { read, rel }
}

const imagesOf = (op: Pick<RawOperator, 'info' | 'purchase' | 'zones'>): ImageRef[] => [
  ...(op.info.logo ? [op.info.logo] : []),
  ...(op.zones?.map ? [op.zones.map] : []),
  ...op.purchase.flatMap((method) => (method.photos ?? []).map((photo) => photo.image)),
]

// templates/<page>/<name>.json; every page kind needs a "default"
const loadTemplates = (root: string, problems: string[]) => {
  const { read, rel } = createReader(root, problems, 'templates/')
  const templates = Object.fromEntries(
    pageKinds.map((page) => [page, new Map()]),
  ) as Catalog['templates']
  if (!existsSync(root)) {
    problems.push(`templates folder ${root} does not exist`)
    return templates
  }

  for (const page of subdirs(root)) {
    if (!(pageKinds as readonly string[]).includes(page)) {
      problems.push(
        `${rel(path.join(root, page))}: unknown page (expected ${pageKinds.join(', ')})`,
      )
      continue
    }
    const files = readdirSync(path.join(root, page)).filter((file) => file.endsWith('.json'))
    for (const file of files) {
      const name = path.basename(file, '.json')
      const location = path.join(root, page, file)
      if (!SLUG.test(name)) {
        problems.push(
          `${rel(location)}: template names are slugs (lowercase letters, digits and hyphens)`,
        )
        continue
      }
      const template = read(location, templateFile)
      if (!template) continue
      for (const slot of templateSlots) {
        template[slot]?.forEach((block, index) => {
          if (!allowsPage(block.type, page as PageKind)) {
            problems.push(
              `${rel(location)} at ${slot}.${index}: block "${block.type}" cannot be used on ${page} pages`,
            )
          }
        })
      }
      templates[page as PageKind].set(name, template)
    }
  }
  for (const page of pageKinds) {
    if (!templates[page].has(DEFAULT_TEMPLATE)) {
      problems.push(`${rel(path.join(root, page, `${DEFAULT_TEMPLATE}.json`))}: file is missing`)
    }
  }
  return templates
}

export const loadCatalog = (root = contentDir(), templatesRoot = templatesDir()): Catalog => {
  if (!existsSync(root)) throw new ContentError([`content folder ${root} does not exist`])

  const problems: string[] = []
  const { read, rel } = createReader(root, problems)
  const catalog: Catalog = {
    countries: [],
    voivodeships: new Map(),
    operators: new Map(),
    cities: new Map(),
    templates: loadTemplates(templatesRoot, problems),
  }
  const checkSlug = (dir: string) => {
    if (SLUG.test(path.basename(dir))) return true
    problems.push(`${rel(dir)}: folder names are URL slugs (lowercase letters, digits and hyphens)`)
    return false
  }

  for (const countrySlug of subdirs(root)) {
    const countryDir = path.join(root, countrySlug)
    if (!checkSlug(countryDir)) continue
    const country = read(path.join(countryDir, COUNTRY_FILE), countryFile)
    if (country) catalog.countries.push({ ...country, slug: countrySlug })

    for (const voivodeshipSlug of subdirs(countryDir)) {
      const voivodeshipDir = path.join(countryDir, voivodeshipSlug)
      if (!checkSlug(voivodeshipDir)) continue
      const voivodeship = read(path.join(voivodeshipDir, VOIVODESHIP_FILE), voivodeshipFile)
      if (voivodeship) {
        if (catalog.voivodeships.has(voivodeshipSlug)) {
          problems.push(
            `${rel(voivodeshipDir)}: voivodeship "${voivodeshipSlug}" also exists in another country`,
          )
        }
        catalog.voivodeships.set(voivodeshipSlug, {
          ...voivodeship,
          slug: voivodeshipSlug,
          country: countrySlug,
        })
      }

      for (const operatorSlug of subdirs(voivodeshipDir)) {
        const dir = path.join(voivodeshipDir, operatorSlug)
        if (!checkSlug(dir)) continue

        const known = new Set<string>([...Object.values(OPERATOR_FILES), IMAGES_DIR])
        for (const entry of readdirSync(dir)) {
          if (!known.has(entry) && !entry.startsWith('.')) {
            problems.push(
              `${rel(path.join(dir, entry))}: unknown file (expected ${[...known].join(', ')})`,
            )
          }
        }

        const info = read(path.join(dir, OPERATOR_FILES.info), operatorFile)
        const cities = read(path.join(dir, OPERATOR_FILES.cities), citiesFile, true) ?? []
        const purchase = read(path.join(dir, OPERATOR_FILES.purchase), purchaseFile, true) ?? []
        const tickets = read(path.join(dir, OPERATOR_FILES.tickets), ticketsFile, true)
        const zones = read(path.join(dir, OPERATOR_FILES.zones), zonesFile, true)
        const evidence = read(path.join(dir, OPERATOR_FILES.evidence), evidenceFile, true)
        if (!info) continue

        const existing = catalog.operators.get(operatorSlug)
        if (existing) {
          problems.push(
            `${rel(dir)}: operator "${operatorSlug}" already exists in ${rel(existing.dir)}`,
          )
          continue
        }
        const operator: RawOperator = {
          slug: operatorSlug,
          dir,
          country: countrySlug,
          voivodeship: voivodeshipSlug,
          info,
          cities,
          purchase,
          tickets,
          zones,
          evidence,
        }
        for (const image of imagesOf(operator)) {
          const file = path.join(dir, IMAGES_DIR, image.file)
          if (!existsSync(file) || !statSync(file).isFile())
            problems.push(`${rel(file)}: image is missing`)
        }
        catalog.operators.set(operatorSlug, operator)
      }
    }
  }

  // Cross-file checks: relations point to existing operators, a city looks the same in every operator listing it
  const primaries = new Map<string, string[]>()
  for (const operator of catalog.operators.values()) {
    const file = rel(path.join(operator.dir, OPERATOR_FILES.cities))

    for (const related of operator.info.related ?? []) {
      if (!catalog.operators.has(related.operator)) {
        problems.push(
          `${rel(path.join(operator.dir, OPERATOR_FILES.info))}: related operator "${related.operator}" does not exist`,
        )
      } else if (related.operator === operator.slug) {
        problems.push(
          `${rel(path.join(operator.dir, OPERATOR_FILES.info))}: an operator cannot be related to itself`,
        )
      }
    }

    for (const [page, name] of Object.entries(operator.info.templates ?? {})) {
      if (name && !catalog.templates[page as PageKind].has(name)) {
        problems.push(
          `${rel(path.join(operator.dir, OPERATOR_FILES.info))}: template "${name}" does not exist in templates/${page}/`,
        )
      }
    }

    // A ticket's forms are described once in the file's `media` list, each form at most once
    if (operator.tickets) {
      const ticketsRel = rel(path.join(operator.dir, OPERATOR_FILES.tickets))
      const described = new Set<string>()
      for (const entry of operator.tickets.media ?? []) {
        if (described.has(entry.type))
          problems.push(`${ticketsRel}: media "${entry.type}" is described twice`)
        described.add(entry.type)
      }
      operator.tickets.tickets.forEach((ticket, index) => {
        for (const type of ticket.media ?? []) {
          if (!described.has(type))
            problems.push(
              `${ticketsRel} at tickets.${index}: media "${type}" is not described in "media"`,
            )
        }
        if (new Set(ticket.media ?? []).size !== (ticket.media ?? []).length)
          problems.push(`${ticketsRel} at tickets.${index}: a media type is listed twice`)
      })
    }

    const seen = new Set<string>()
    for (const entry of operator.cities) {
      if (seen.has(entry.slug)) problems.push(`${file}: city "${entry.slug}" is listed twice`)
      seen.add(entry.slug)

      const voivodeship = entry.voivodeship ?? operator.voivodeship
      const country = catalog.voivodeships.get(voivodeship)?.country
      if (!country) {
        problems.push(
          `${file}: city "${entry.slug}" points to unknown voivodeship "${voivodeship}"`,
        )
        continue
      }
      const city = catalog.cities.get(entry.slug)
      if (!city) {
        catalog.cities.set(entry.slug, {
          slug: entry.slug,
          name: entry.name,
          country,
          voivodeship,
          operators: [operator.slug],
        })
      } else {
        if (JSON.stringify(city.name) !== JSON.stringify(entry.name)) {
          problems.push(
            `${file}: city "${entry.slug}" has a different name than in operator "${city.operators[0]}"`,
          )
        }
        if (city.voivodeship !== voivodeship) {
          problems.push(
            `${file}: city "${entry.slug}" is in "${voivodeship}" here but in "${city.voivodeship}" elsewhere`,
          )
        }
        city.operators.push(operator.slug)
      }
      if (entry.primary)
        primaries.set(entry.slug, [...(primaries.get(entry.slug) ?? []), operator.slug])
    }
  }

  const byName = (a: string, b: string) =>
    catalog.operators.get(a)!.info.name.localeCompare(catalog.operators.get(b)!.info.name, 'pl')
  for (const city of catalog.cities.values()) {
    const primary = primaries.get(city.slug) ?? []
    if (primary.length > 1) {
      problems.push(
        `city "${city.slug}" is marked primary by several operators: ${primary.join(', ')}`,
      )
    }
    city.operators.sort((a, b) => (a === primary[0] ? -1 : b === primary[0] ? 1 : byName(a, b)))
  }

  if (problems.length) throw new ContentError(problems)
  return catalog
}

// Built once per process for production builds; re-read on every request in `next dev` so JSON edits show up
let cached: { key: string; catalog: Catalog } | null = null
export const getCatalog = (): Catalog => {
  const root = contentDir()
  const templates = templatesDir()
  if (process.env.NODE_ENV === 'development') return loadCatalog(root, templates)
  const key = `${root}\0${templates}`
  if (cached?.key !== key) cached = { key, catalog: loadCatalog(root, templates) }
  return cached.catalog
}
