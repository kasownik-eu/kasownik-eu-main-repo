import { z } from 'zod'

import { loadCatalog, type RawOperator } from '@/content/load'

import { extractContent } from './extractContent'
import { type Fact, resolveFact } from './evidencePath'
import { fetchPage } from './fetchPage'
import { getLlmExtractor } from './llm'
import { hashText, promote, readBaseline, storeFetched } from './pageCache'
import { judgeInstructions, judgeSchema, type Judgement } from './prompt'

// Report only: the checker never edits data/. A stale operator is re-researched with the operator-research skill
export const factStatuses = [
  'ok', // the quote is still on the page and the data still holds the value
  'confirmed', // the quote is gone, the model found the fact elsewhere on the page (code checked its quote)
  'changed', // the page states it with another value
  'not_found', // the page no longer mentions it
  'drift', // the data no longer holds the value the evidence was written for (edited by hand, rows moved)
  'quote_inconsistent', // the evidence itself is wrong: the quote does not contain the number
  'unreachable', // the page could not be fetched or the XPath matched nothing
  'unverified', // the quote is gone and the model could not judge it (no model, failure, unverifiable answer)
] as const
export type FactStatus = (typeof factStatuses)[number]

export const GOOD_STATUSES: readonly FactStatus[] = ['ok', 'confirmed']

export const operatorStatuses = ['ok', 'stale', 'unreachable', 'no_evidence', 'failed'] as const
export type OperatorStatus = (typeof operatorStatuses)[number]

export type FactResult = {
  file: Fact['file']
  path: string
  value: Fact['value']
  status: FactStatus
  url: string
  detail?: string
  // A quote copied from the page that backs the new state, to paste into evidence.json after a re-research
  newQuote?: string
}

export type PageResult = {
  url: string
  xpath?: string | null
  error?: string
  // null: no earlier copy to compare with
  changed: boolean | null
  added: string[]
  removed: string[]
}

export type OperatorCheck = {
  slug: string
  status: OperatorStatus
  error?: string
  pages: PageResult[]
  facts: FactResult[]
  warnings: string[]
}

export type CheckOptions = { llm?: boolean; slug?: string | null; contentDir?: string }

const MAX_DIFF_LINES = 15

const squash = (text: string) => text.replace(/\u00ad/g, '').replace(/[\s ]+/g, ' ').trim()
export const containsQuote = (pageText: string, quote: string) =>
  squash(pageText).includes(squash(quote))

// 3.4 as "3,40", "3,4", "3.40", "3.4" not glued to other digits
export const numberAppears = (text: string, value: number) => {
  const forms = new Set([value.toFixed(2), String(value)].flatMap((n) => [n, n.replace('.', ',')]))
  return [...forms].some((form) =>
    new RegExp(`(?<![\\d.,])${form.replace(/[.,]/g, '[.,]')}(?!\\d)`).test(text),
  )
}

const lineDiff = (before: string, after: string) => {
  const old = new Set(before.split('\n'))
  const next = new Set(after.split('\n'))
  return {
    added: [...next].filter((l) => !old.has(l)).slice(0, MAX_DIFF_LINES),
    removed: [...old].filter((l) => !next.has(l)).slice(0, MAX_DIFF_LINES),
  }
}

const show = (value: unknown) => (typeof value === 'string' ? JSON.stringify(value) : String(value))

// Deterministic part: is the data as the evidence says, is the quote consistent, is it on the page
const checkFact = (
  operator: RawOperator,
  fact: Fact,
  text: string,
): FactResult & { missing?: true } => {
  const base = { file: fact.file, path: fact.path, value: fact.value, url: fact.url }
  const current = resolveFact(operator, fact)
  if (current !== fact.value)
    return {
      ...base,
      status: 'drift',
      detail: `data has ${current === undefined ? 'nothing' : show(current)}, evidence was written for ${show(fact.value)}`,
    }
  if (typeof fact.value === 'number' && !numberAppears(fact.quote, fact.value))
    return {
      ...base,
      status: 'quote_inconsistent',
      detail: `the quote does not contain ${fact.value}`,
    }
  if (containsQuote(text, fact.quote)) return { ...base, status: 'ok' }
  return {
    ...base,
    status: 'unverified',
    detail: 'the quote is no longer on the page',
    missing: true,
  }
}

// The small model only says whether a fact is on the page; its answer counts only when the quote it gives is really there
const applyJudgement = (
  result: FactResult,
  judgement: Judgement | undefined,
  text: string,
): FactResult => {
  if (!judgement) return { ...result, detail: 'the model gave no answer' }
  if (judgement.verdict === 'not_found')
    return { ...result, status: 'not_found', detail: 'the page no longer mentions it' }

  const quote = judgement.quote?.trim()
  if (!quote || !containsQuote(text, quote))
    return {
      ...result,
      detail: `the model said "${judgement.verdict}" but its quote is not on the page`,
    }
  if (judgement.verdict === 'confirmed') {
    if (typeof result.value === 'number' && !numberAppears(quote, result.value))
      return {
        ...result,
        detail: `the model said "confirmed" but its quote does not contain ${result.value}`,
      }
    return {
      ...result,
      status: 'confirmed',
      newQuote: quote,
      detail: 'found elsewhere on the page',
    }
  }
  return { ...result, status: 'changed', newQuote: quote, detail: 'the page states another value' }
}

type Pending = { fact: Fact; result: FactResult }

// One model call per page: the facts whose quote vanished, judged against the page text
const judgePage = async (
  operator: RawOperator,
  url: string,
  text: string,
  pending: Pending[],
): Promise<Map<number, Judgement>> => {
  const claims = pending.map(({ fact }, id) => ({
    id,
    claim: `${fact.file}: ${fact.path} = ${show(fact.value)}`,
    earlierQuote: fact.quote,
  }))
  const raw = await getLlmExtractor().extract({
    pages: [{ url, text }],
    operator: { slug: operator.slug, name: operator.info.name },
    jsonSchema: z.toJSONSchema(judgeSchema),
    instructions: judgeInstructions(),
    pass: 'check',
    task: `Check these claims against the page above:\n${JSON.stringify(claims)}`,
  })
  const parsed = judgeSchema.safeParse(raw)
  if (!parsed.success)
    throw new Error(`the model's answer failed validation: ${z.prettifyError(parsed.error)}`)
  return new Map(parsed.data.results.map((r) => [r.id, r]))
}

const keyOf = (fact: Pick<Fact, 'url' | 'xpath'>) => `${fact.url}\n${fact.xpath ?? ''}`

export const checkOperator = async (
  operator: RawOperator,
  { llm = true }: Pick<CheckOptions, 'llm'> = {},
): Promise<OperatorCheck> => {
  const check: OperatorCheck = {
    slug: operator.slug,
    status: 'ok',
    pages: [],
    facts: [],
    warnings: [],
  }
  const facts = operator.evidence?.facts ?? []
  if (!facts.length) return { ...check, status: 'no_evidence' }

  try {
    const sources = new Set(
      Object.entries(operator.info)
        .filter(([key]) => key.endsWith('Sources'))
        .flatMap(([, pages]) => (pages as { url: string; xpath?: string | null }[]).map(keyOf)),
    )

    const groups = new Map<string, Fact[]>()
    for (const fact of facts) groups.set(keyOf(fact), [...(groups.get(keyOf(fact)) ?? []), fact])

    for (const [key, group] of groups) {
      const { url, xpath } = group[0]
      if (!sources.has(key))
        check.warnings.push(
          `${url}${xpath ? ` (${xpath})` : ''} is not in the operator's *Sources lists`,
        )

      let text: string
      try {
        const html = await fetchPage(url)
        text = extractContent(html, url, xpath)
        await storeFetched(operator.slug, url, html, text, xpath)
      } catch (err) {
        const error = (err as Error).message
        check.pages.push({ url, xpath, error, changed: null, added: [], removed: [] })
        check.facts.push(
          ...group.map((fact) => ({
            file: fact.file,
            path: fact.path,
            value: fact.value,
            url,
            status: 'unreachable' as const,
            detail: error,
          })),
        )
        continue
      }

      const baseline = await readBaseline(operator.slug, url, xpath)
      const changed = baseline === null ? null : hashText(baseline) !== hashText(text)
      check.pages.push({
        url,
        xpath,
        changed,
        ...(changed ? lineDiff(baseline!, text) : { added: [], removed: [] }),
      })

      const results: FactResult[] = []
      const pending: Pending[] = []
      for (const fact of group) {
        const { missing, ...result } = checkFact(operator, fact, text)
        results.push(result)
        if (missing) pending.push({ fact, result })
      }

      if (pending.length && llm) {
        try {
          const judgements = await judgePage(operator, url, text, pending)
          pending.forEach((item, id) => {
            Object.assign(item.result, applyJudgement(item.result, judgements.get(id), text))
          })
        } catch (err) {
          check.warnings.push(`model check of ${url} failed: ${(err as Error).message}`)
        }
      }

      check.facts.push(...results)
      if (results.every((r) => GOOD_STATUSES.includes(r.status)))
        await promote(operator.slug, url, xpath)
    }

    const unreachable = check.facts.some((f) => f.status === 'unreachable')
    const stale = check.facts.some(
      (f) => !GOOD_STATUSES.includes(f.status) && f.status !== 'unreachable',
    )
    check.status = stale ? 'stale' : unreachable ? 'unreachable' : 'ok'
    return check
  } catch (err) {
    return { ...check, status: 'failed', error: (err as Error).message }
  }
}

// Sequential on purpose: keeps the load on operator sites and the model predictable
export const checkOperators = async ({ slug, contentDir, llm }: CheckOptions = {}): Promise<
  OperatorCheck[]
> => {
  const catalog = loadCatalog(contentDir)
  if (slug && !catalog.operators.has(slug))
    throw new Error(`Operator "${slug}" does not exist in the data folder`)
  const results: OperatorCheck[] = []
  for (const operator of catalog.operators.values()) {
    if (slug && operator.slug !== slug) continue
    results.push(await checkOperator(operator, { llm }))
  }
  return results
}
