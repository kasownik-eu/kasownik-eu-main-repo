import path from 'path'
import { describe, expect, it } from 'vitest'

import { loadCatalog } from '@/content/load'
import { operatorFile } from '@/content/schema'
import { findOperatorsByUrl, operatorContext } from '@/research/operatorContext'

const FIXTURE = path.resolve('tests/fixtures/content')
const catalog = loadCatalog(FIXTURE)

describe('findOperatorsByUrl', () => {
  it('matches the host with or without www and ignores the path', () => {
    for (const url of [
      'https://example.com',
      'https://www.example.com/cennik',
      'http://EXAMPLE.com/a?b=1',
    ]) {
      expect(findOperatorsByUrl(catalog, url).map((o) => o.slug)).toEqual(['testowy'])
    }
  })

  it('does not match other hosts or subdomains', () => {
    expect(findOperatorsByUrl(catalog, 'https://example.org')).toEqual([])
    expect(findOperatorsByUrl(catalog, 'https://bilety.example.com')).toEqual([])
  })

  it('rejects an invalid URL', () => {
    expect(() => findOperatorsByUrl(catalog, 'example.com')).toThrow('not a valid URL')
  })
})

describe('operatorContext', () => {
  it('verifies a known operator and lists what the research must stay consistent with', () => {
    const context = operatorContext(catalog, 'https://example.com', FIXTURE)
    expect(context.mode).toBe('verify')
    expect(context.matches[0]).toMatchObject({
      slug: 'testowy',
      voivodeship: 'slaskie',
      logoExists: true,
    })
    expect(context.operators.map((o) => o.slug)).toEqual(
      expect.arrayContaining(['testowy', 'inny']),
    )
    expect(context.voivodeships.map((v) => v.slug)).toContain('slaskie')
    expect(context.cities.length).toBe(catalog.cities.size)
  })

  it('discovers an unknown operator', () => {
    expect(operatorContext(catalog, 'https://example.org', FIXTURE)).toMatchObject({
      mode: 'discover',
      matches: [],
    })
  })
})

describe('operator source pages', () => {
  const base = { name: 'X' }

  it('accepts purchase and zone pages next to tariff pages', () => {
    const parsed = operatorFile.safeParse({
      ...base,
      tariffSources: [{ url: 'https://example.com/cennik' }],
      purchaseSources: [{ url: 'https://example.com/bilety', xpath: '//main' }],
      zoneSources: [],
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects unknown keys and invalid URLs', () => {
    expect(
      operatorFile.safeParse({
        ...base,
        purchaseSources: [{ url: 'https://example.com', note: 'x' }],
      }).success,
    ).toBe(false)
    expect(operatorFile.safeParse({ ...base, zoneSources: [{ url: 'strefy' }] }).success).toBe(
      false,
    )
  })
})
