import { mkdtemp, rm } from 'fs/promises'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { checkOperator, containsQuote, numberAppears } from '@/check/checkOperator'
import { resolveFact } from '@/check/evidencePath'
import type { RawOperator } from '@/content/load'
import { evidenceFile } from '@/content/schema'

const URL_ = 'https://example.com/cennik'
const page = (rows: string) => `<html><body><main><table>${rows}</table></main></body></html>`
const row = (name: string, price: string) => `<tr><td>${name}</td><td>${price}</td></tr>`

const operator = (price = 3.4): RawOperator =>
  ({
    slug: 'test',
    info: { name: 'Test', tariffSources: [{ url: URL_ }] },
    tickets: {
      tickets: [{ category: 'single', name: { pl: 'Bilet 20-minutowy' }, priceNormal: price }],
    },
    purchase: [{ type: 'machine' }],
    zones: null,
    evidence: {
      verifiedAt: '2026-11-20',
      facts: [
        {
          file: 'tickets',
          path: 'tickets[0].priceNormal',
          value: 3.4,
          url: URL_,
          quote: 'Bilet 20-minutowy | 3,40',
        },
      ],
    },
  }) as unknown as RawOperator

const serve = (html: string) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(html, { headers: { 'Content-Type': 'text/html' } })),
  )

describe('operator check', () => {
  beforeEach(async () => {
    vi.stubEnv('CHECK_CACHE_DIR', await mkdtemp(path.join(os.tmpdir(), 'check-')))
    vi.stubEnv('CHECK_LLM_PROVIDER', 'fixture')
    vi.stubEnv('CHECK_LLM_FIXTURE_DIR', path.resolve('tests/fixtures/check'))
  })
  afterEach(async () => {
    await rm(process.env.CHECK_CACHE_DIR!, { recursive: true, force: true })
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('is ok while the quote is on the page', async () => {
    serve(page(row('Bilet 20-minutowy', '3,40 zł')))
    const result = await checkOperator(operator(), { llm: false })
    expect(result.status).toBe('ok')
    expect(result.facts.map((f) => f.status)).toEqual(['ok'])
  })

  it('reports a changed price, deterministically without a model', async () => {
    serve(page(row('Bilet 20-minutowy', '3,80 zł')))
    const result = await checkOperator(operator(), { llm: false })
    expect(result.status).toBe('stale')
    expect(result.facts[0]).toMatchObject({
      status: 'unverified',
      detail: 'the quote is no longer on the page',
    })
  })

  it('lets the model judge a vanished quote, but only trusts quotes found on the page', async () => {
    serve(page(row('Bilet 20-minutowy', '3,80 zł')))
    const result = await checkOperator(operator(), { llm: true })
    // tests/fixtures/check/test.check.json answers "changed" with a quote that is on the page
    expect(result.facts[0]).toMatchObject({
      status: 'changed',
      newQuote: 'Bilet 20-minutowy | 3,80 zł',
    })
    expect(result.status).toBe('stale')
  })

  it('reports data edited away from the evidence', async () => {
    serve(page(row('Bilet 20-minutowy', '3,40 zł')))
    const result = await checkOperator(operator(4), { llm: false })
    expect(result.facts[0].status).toBe('drift')
  })

  it('reports unreachable pages apart from stale data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 503 })),
    )
    const result = await checkOperator(operator(), { llm: false })
    expect(result.status).toBe('unreachable')
  })

  it('shows what changed on a page since the last good check', async () => {
    serve(page(row('Bilet 20-minutowy', '3,40 zł')))
    await checkOperator(operator(), { llm: false })
    serve(page(row('Bilet 20-minutowy', '3,40 zł') + row('Bilet 40-minutowy', '5,00 zł')))
    const result = await checkOperator(operator(), { llm: false })
    expect(result.status).toBe('ok')
    expect(result.pages[0]).toMatchObject({ changed: true, added: ['Bilet 40-minutowy | 5,00 zł'] })
  })

  it('has nothing to check without evidence', async () => {
    const result = await checkOperator({ ...operator(), evidence: null })
    expect(result.status).toBe('no_evidence')
  })
})

describe('helpers', () => {
  it('compares quotes ignoring whitespace', () => {
    expect(containsQuote('Bilet  20-minutowy\n| 3,40', 'Bilet 20-minutowy | 3,40')).toBe(true)
  })

  it('finds a price in Polish and English notation, not inside other numbers', () => {
    expect(numberAppears('3,40 zł', 3.4)).toBe(true)
    expect(numberAppears('3.4', 3.4)).toBe(true)
    expect(numberAppears('13,40 zł', 3.4)).toBe(false)
    expect(numberAppears('3,401', 3.4)).toBe(false)
  })

  it('resolves paths into every data file', () => {
    expect(resolveFact(operator(), { file: 'tickets', path: 'tickets[0].name.pl' })).toBe(
      'Bilet 20-minutowy',
    )
    expect(resolveFact(operator(), { file: 'purchase', path: 'purchase[0].type' })).toBe('machine')
    expect(
      resolveFact(operator(), { file: 'tickets', path: 'tickets[5].priceNormal' }),
    ).toBeUndefined()
  })

  it('validates the evidence file strictly', () => {
    expect(
      evidenceFile.safeParse({
        verifiedAt: '2026-11-20',
        facts: [{ file: 'tickets', path: 'a', value: 1, url: URL_, quote: 'x' }],
      }).success,
    ).toBe(false)
    expect(
      evidenceFile.safeParse({
        verifiedAt: '2026-11-20',
        facts: [{ file: 'tickets', path: 'a', value: 1, url: URL_, quote: 'abc', extra: 1 }],
      }).success,
    ).toBe(false)
  })
})
