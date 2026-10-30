import type { Payload } from 'payload'
import { z } from 'zod'

import type { Operator, TariffSync } from '@/payload-types'
import { applyTariff } from './applyTariff'
import { loadCurrentTariff } from './currentState'
import { diffTariff, type TariffChange } from './diffTariff'
import { extractContent } from './extractContent'
import { fetchPage } from './fetchPage'
import { getTariffExtractor } from './llm'
import { notifyFailure, notifyReview } from './notify'
import { hashText, isUnchanged, promote, storeFetched } from './pageCache'
import { tariffInstructions } from './prompt'
import { reviewReasons } from './reviewPolicy'
import { tariffJsonSchema, tariffSchema } from './schema'
import type { TariffData } from './types'

export type SyncStatus = TariffSync['status']
export type SyncStage = NonNullable<TariffSync['failedStage']>
export type SyncOptions = { dryRun?: boolean; force?: boolean }

export type OperatorSyncResult = {
  slug: string
  status: SyncStatus
  error?: string
  failedStage?: SyncStage
  pages: { url: string; textHash: string; changed: boolean; text: string }[]
  changes?: TariffChange[]
  reasons?: string[]
  proposed?: TariffData
}

const context = { tariffSync: true }

const recordRun = (payload: Payload, operator: Operator, result: OperatorSyncResult, appliedVersion?: string | null) =>
  payload.create({
    collection: 'tariff-syncs',
    context,
    depth: 0,
    data: {
      title: `${operator.slug} · ${new Date().toISOString()}`,
      operator: operator.id,
      status: result.status,
      pages: result.pages.map(({ url, textHash, changed }) => ({ url, textHash, changed })),
      changes: result.changes,
      reviewReasons: result.reasons?.map((text) => ({ text })),
      proposed: result.proposed,
      error: result.error,
      failedStage: result.failedStage,
      appliedVersion,
    },
  })

// Older pending proposals are based on an outdated source once a newer run has been handled
const supersedePending = (payload: Payload, operator: Operator) =>
  payload.update({
    collection: 'tariff-syncs',
    where: { and: [{ operator: { equals: operator.id } }, { status: { equals: 'pending_review' } }] },
    data: { status: 'superseded' },
    context,
    depth: 0,
  })

export const syncOperatorTariff = async (
  payload: Payload,
  operator: Operator,
  { dryRun = false, force = false }: SyncOptions = {},
): Promise<OperatorSyncResult> => {
  const result: OperatorSyncResult = { slug: operator.slug, status: 'failed', pages: [] }
  let stage: SyncStage = 'fetch'

  try {
    // Any page failure (HTTP, content type, XPath) aborts the operator before anything is written
    for (const page of operator.tariffSources?.pages ?? []) {
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
      if (!dryRun) await recordRun(payload, operator, result)
      return result
    }

    stage = 'llm'
    const raw = await getTariffExtractor().extract({
      pages: result.pages.map(({ url, text }) => ({ url, text })),
      operator: { slug: operator.slug, name: operator.name },
      jsonSchema: tariffJsonSchema,
      instructions: tariffInstructions,
    })
    stage = 'validate'
    const parsed = tariffSchema.safeParse(raw)
    if (!parsed.success) throw new Error(`LLM output failed validation:\n${z.prettifyError(parsed.error)}`)

    stage = 'compare'
    const current = await loadCurrentTariff(payload, operator.id)
    result.proposed = parsed.data
    result.changes = diffTariff(current, parsed.data)
    result.reasons = result.changes.length ? reviewReasons(current, result.changes) : []
    result.status = !result.changes.length ? 'no_changes' : result.reasons.length ? 'pending_review' : 'applied'
    if (dryRun) return result

    stage = 'apply'
    await supersedePending(payload, operator)
    const version =
      result.status === 'applied'
        ? await applyTariff(payload, operator.id, parsed.data, { rulesUrl: result.pages[0]?.url })
        : null
    const run = await recordRun(payload, operator, result, version)
    await Promise.all(result.pages.map((p) => promote(operator.slug, p.url)))
    if (result.status === 'pending_review') await notifyReview(payload, operator, run)
    return result
  } catch (err) {
    result.status = 'failed'
    result.failedStage = stage
    result.error = (err as Error).message
    payload.logger.error({ err, slug: operator.slug, stage }, `Tariff sync failed for ${operator.slug} at ${stage}`)
    if (!dryRun) await notifyFailure(payload, operator, await recordRun(payload, operator, result))
    return result
  }
}

export type SyncSummary = {
  counts: Partial<Record<SyncStatus, number>>
  failed: { slug: string; error: string }[]
  results: OperatorSyncResult[]
}

export const syncAllTariffs = async (
  payload: Payload,
  { slug, ...options }: SyncOptions & { slug?: string | null } = {},
): Promise<SyncSummary> => {
  const { docs: operators } = await payload.find({
    collection: 'operators',
    where: {
      and: [{ 'tariffSources.pages.url': { exists: true } }, ...(slug ? [{ slug: { equals: slug } }] : [])],
    },
    locale: 'pl',
    depth: 0,
    pagination: false,
  })

  const summary: SyncSummary = { counts: {}, failed: [], results: [] }
  // Sequential on purpose: keeps load on operator sites and the LLM predictable
  for (const operator of operators) {
    const result = await syncOperatorTariff(payload, operator, options)
    summary.results.push(result)
    summary.counts[result.status] = (summary.counts[result.status] ?? 0) + 1
    if (result.status === 'failed') summary.failed.push({ slug: operator.slug, error: result.error ?? 'unknown' })
  }
  return summary
}
