import { z } from 'zod'

import { loadCatalog, type RawOperator } from '@/content/load'

import { applyTariff, toTariffData } from './applyTariff'
import { classifyTariff } from './classify'
import { diffTariff, type TariffChange } from './diffTariff'
import { extractContent } from './extractContent'
import { fetchPage } from './fetchPage'
import { keepTranslations, keepWhereToBuy } from './keepTranslations'
import { getTariffExtractor } from './llm'
import { normalizeLlmOutput } from './normalizeOutput'
import { hashText, isUnchanged, promote, storeFetched } from './pageCache'
import { luggageInstructions, tariffInstructions } from './prompt'
import { luggageExtractionSchemaFor, ticketsExtractionSchemaFor } from './schema'
import type { TariffData } from './types'

// Writes straight into data/: there is no review queue, the git diff of the JSON files is the review
export const syncStatuses = ['failed', 'unchanged_source', 'no_changes', 'applied'] as const
export const syncStages = ['fetch', 'extract', 'llm', 'validate', 'compare', 'apply'] as const

export type SyncStatus = (typeof syncStatuses)[number]
export type SyncStage = (typeof syncStages)[number]
export type SyncOptions = { dryRun?: boolean; force?: boolean }

export type OperatorSyncResult = {
  slug: string
  status: SyncStatus
  error?: string
  failedStage?: SyncStage
  pages: { url: string; xpath?: string | null; textHash: string; changed: boolean; text: string }[]
  changes?: TariffChange[]
  // Rows the model reported that are not tickets (events, fees, luggage): left out of the tariff
  skipped?: { name: string; kind: string }[]
  proposed?: TariffData
}

type Page = OperatorSyncResult['pages'][number]
type Source = NonNullable<RawOperator['info']['tariffSources']>[number]

// Fetches the pages of one pass; any page failure (HTTP, content type, XPath) aborts the operator before anything is written
const fetchPages = async (slug: string, sources: Source[], onStage: (stage: SyncStage) => void): Promise<Page[]> => {
  const pages: Page[] = []
  for (const source of sources) {
    onStage('fetch')
    const html = await fetchPage(source.url)
    onStage('extract')
    const text = extractContent(html, source.url, source.xpath)
    await storeFetched(slug, source.url, html, text, source.xpath)
    const changed = !(await isUnchanged(slug, source.url, text, source.xpath))
    pages.push({ url: source.url, xpath: source.xpath, textHash: hashText(text), changed, text })
  }
  return pages
}

// One LLM call: the pass's pages in, validated data out
const runPass = async <T extends z.ZodType>(
  extractor: ReturnType<typeof getTariffExtractor>,
  operator: RawOperator,
  pages: Page[],
  schema: T,
  instructions: string,
  onStage: (stage: SyncStage) => void,
): Promise<z.infer<T>> => {
  onStage('llm')
  const raw = await extractor
    .extract({
      pages: pages.map(({ url, text }) => ({ url, text })),
      operator: { slug: operator.slug, name: operator.info.name },
      jsonSchema: z.toJSONSchema(schema),
      instructions,
    })
    .catch((err: Error) => {
      throw new Error(`LLM provider "${extractor.name}": ${err.message}`, { cause: err })
    })
  onStage('validate')
  const parsed = schema.safeParse(normalizeLlmOutput(raw))
  if (!parsed.success) throw new Error(`LLM output failed validation:\n${z.prettifyError(parsed.error)}`)
  return parsed.data
}

// Two independent passes: tickets (tariffSources) and luggage rules (luggageSources). A pass runs only when its pages
// changed (or with force); a pass that did not run, or has no sources, keeps what is in the content now
export const syncOperatorTariff = async (
  operator: RawOperator,
  { dryRun = false, force = false }: SyncOptions = {},
): Promise<OperatorSyncResult> => {
  const result: OperatorSyncResult = { slug: operator.slug, status: 'failed', pages: [] }
  let stage: SyncStage = 'fetch'
  const onStage = (next: SyncStage) => {
    stage = next
  }

  try {
    const ticketPages = await fetchPages(operator.slug, operator.info.tariffSources ?? [], onStage)
    const luggagePages = await fetchPages(operator.slug, operator.info.luggageSources ?? [], onStage)
    result.pages = [...ticketPages, ...luggagePages]

    const needsRun = (pages: Page[]) => pages.length > 0 && (force || pages.some((p) => p.changed))
    const runTickets = needsRun(ticketPages)
    const runLuggage = needsRun(luggagePages)
    if (!runTickets && !runLuggage) {
      result.status = 'unchanged_source'
      return result
    }

    // The LLM may only assign the operator's own modes
    const modes = operator.info.transportModes
    if (!modes?.length) throw new Error(`Operator "${operator.slug}" has no transport modes set`)
    const extractor = getTariffExtractor()
    const current = toTariffData(operator)
    let data: TariffData = current

    if (runTickets) {
      const extracted = await runPass(
        extractor,
        operator,
        ticketPages,
        ticketsExtractionSchemaFor(modes),
        tariffInstructions(modes),
        onStage,
      )
      const { data: classified, skipped } = classifyTariff(extracted)
      result.skipped = skipped
      data = { ...data, ...classified }
    }
    if (runLuggage) {
      const { luggage } = await runPass(
        extractor,
        operator,
        luggagePages,
        luggageExtractionSchemaFor(modes),
        luggageInstructions(modes),
        onStage,
      )
      data = { ...data, luggage }
    }

    stage = 'compare'
    const proposed = keepWhereToBuy(current, keepTranslations(current, data))
    result.proposed = proposed
    result.changes = diffTariff(current, proposed)
    result.status = result.changes.length ? 'applied' : 'no_changes'
    if (dryRun) return result

    stage = 'apply'
    if (result.status === 'applied')
      await applyTariff(operator, proposed, { rulesUrl: ticketPages[0]?.url ?? operator.tickets?.rulesUrl })
    // Only now are the fetched pages the new baseline; a failed run is retried on the next sync
    await Promise.all(result.pages.map((p) => promote(operator.slug, p.url, p.xpath)))
    return result
  } catch (err) {
    result.status = 'failed'
    result.failedStage = stage
    result.error = (err as Error).message
    return result
  }
}

export type SyncSummary = {
  counts: Partial<Record<SyncStatus, number>>
  failed: { slug: string; error: string }[]
  results: OperatorSyncResult[]
}

export const syncAllTariffs = async ({
  slug,
  contentDir,
  ...options
}: SyncOptions & { slug?: string | null; contentDir?: string } = {}): Promise<SyncSummary> => {
  const catalog = loadCatalog(contentDir)
  if (slug && !catalog.operators.has(slug))
    throw new Error(`Operator "${slug}" does not exist in the data folder`)
  const operators = [...catalog.operators.values()].filter(
    (operator) => (operator.info.tariffSources?.length || operator.info.luggageSources?.length) && (!slug || operator.slug === slug),
  )

  const summary: SyncSummary = { counts: {}, failed: [], results: [] }
  // Sequential on purpose: keeps load on operator sites and the LLM predictable
  for (const operator of operators) {
    const result = await syncOperatorTariff(operator, options)
    summary.results.push(result)
    summary.counts[result.status] = (summary.counts[result.status] ?? 0) + 1
    if (result.status === 'failed')
      summary.failed.push({ slug: operator.slug, error: result.error ?? 'unknown' })
  }
  return summary
}
