import { z } from 'zod'

import { loadCatalog, type RawOperator } from '@/content/load'

import { applyTariff, toTariffData } from './applyTariff'
import { diffTariff, type TariffChange } from './diffTariff'
import { extractContent } from './extractContent'
import { fetchPage } from './fetchPage'
import { getTariffExtractor } from './llm'
import { hashText, isUnchanged, promote, storeFetched } from './pageCache'
import { tariffInstructions } from './prompt'
import { tariffSchemaFor } from './schema'
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
  pages: { url: string; textHash: string; changed: boolean; text: string }[]
  changes?: TariffChange[]
  proposed?: TariffData
}

export const syncOperatorTariff = async (
  operator: RawOperator,
  { dryRun = false, force = false }: SyncOptions = {},
): Promise<OperatorSyncResult> => {
  const result: OperatorSyncResult = { slug: operator.slug, status: 'failed', pages: [] }
  let stage: SyncStage = 'fetch'

  try {
    // Any page failure (HTTP, content type, XPath) aborts the operator before anything is written
    for (const page of operator.info.tariffSources ?? []) {
      stage = 'fetch'
      const html = await fetchPage(page.url)
      stage = 'extract'
      const text = extractContent(html, page.url, page.xpath)
      await storeFetched(operator.slug, page.url, html, text)
      const changed = !(await isUnchanged(operator.slug, page.url, text))
      result.pages.push({ url: page.url, textHash: hashText(text), changed, text })
    }

    if (!force && result.pages.every((p) => !p.changed)) {
      result.status = 'unchanged_source'
      return result
    }

    stage = 'llm'
    // The LLM may only assign the operator's own modes
    const modes = operator.info.transportModes
    if (!modes?.length) throw new Error(`Operator "${operator.slug}" has no transport modes set`)
    const schema = tariffSchemaFor(modes)
    const extractor = getTariffExtractor()
    const raw = await extractor
      .extract({
        pages: result.pages.map(({ url, text }) => ({ url, text })),
        operator: { slug: operator.slug, name: operator.info.name },
        jsonSchema: z.toJSONSchema(schema),
        instructions: tariffInstructions(modes),
      })
      .catch((err: Error) => {
        throw new Error(`LLM provider "${extractor.name}": ${err.message}`, { cause: err })
      })
    stage = 'validate'
    const parsed = schema.safeParse(raw)
    if (!parsed.success)
      throw new Error(`LLM output failed validation:\n${z.prettifyError(parsed.error)}`)

    stage = 'compare'
    result.proposed = parsed.data
    result.changes = diffTariff(toTariffData(operator), parsed.data)
    result.status = result.changes.length ? 'applied' : 'no_changes'
    if (dryRun) return result

    stage = 'apply'
    if (result.status === 'applied')
      await applyTariff(operator, parsed.data, { rulesUrl: result.pages[0]?.url })
    // Only now is the fetched page the new baseline; a failed run is retried on the next sync
    await Promise.all(result.pages.map((p) => promote(operator.slug, p.url)))
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
    (operator) => operator.info.tariffSources?.length && (!slug || operator.slug === slug),
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
