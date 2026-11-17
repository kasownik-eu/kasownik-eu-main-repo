import { cp, mkdtemp, readFile, rm, unlink, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { getCities, getCity, getOperator, getOperatorSummaries, localize } from '@/content'
import { jsonSchemas } from '@/content/jsonSchemas'
import { ContentError, loadCatalog } from '@/content/load'

const FIXTURE = path.resolve('tests/fixtures/content')

describe('the real data folder', () => {
  it('is valid', () => {
    expect(loadCatalog(path.resolve('data')).operators.size).toBeGreaterThan(0)
  })
})

describe('content views', () => {
  beforeAll(() => {
    process.env.CONTENT_DIR = FIXTURE
  })

  it('falls back to Polish where English is missing', () => {
    expect(localize({ a: { pl: 'Tak', en: 'Yes' }, b: { pl: 'Tylko PL' }, n: 1 }, 'en')).toEqual({
      a: 'Yes',
      b: 'Tylko PL',
      n: 1,
    })
    expect(getCity('wspolne', 'en')?.name).toBe('Wspólne')
  })

  it('resolves an operator for one locale', () => {
    const operator = getOperator('testowy', 'en')!
    expect(operator.logo).toEqual({ url: '/media/testowy/map.svg', alt: null })
    expect(operator.zones?.map).toEqual({ url: '/media/testowy/map.svg', alt: 'Mapa stref' })
    expect(operator.zones?.items).toEqual([{ name: 'Zone A' }])
    expect(operator.tickets[0]).toMatchObject({ name: 'Bilet jednorazowy', priceNormal: 4 })
    expect(operator.sources?.items?.[0].label).toBe('Website')
    expect(operator.related[0].operator).toMatchObject({ slug: 'inny', name: 'Inny Przewoźnik' })
    expect(operator.cities.map((city) => city.name)).toEqual(['Testville', 'Wspólne'])
    expect(operator.cities[0].region).toBe('Silesian')
  })

  it('builds cities from the operators that list them, primary operator first', () => {
    expect(getCities('pl').map((city) => city.slug)).toEqual(['testowo', 'wspolne'])
    expect(getCity('wspolne', 'pl')?.operators).toEqual(['inny', 'testowy'])
    expect(getCity('testowo', 'pl')).toMatchObject({
      name: 'Testowo',
      region: 'Śląskie',
      operators: ['testowy'],
    })
    expect(getOperatorSummaries('pl').map((operator) => operator.slug)).toEqual(['inny', 'testowy'])
  })

  it('returns null for unknown slugs', () => {
    expect(getOperator('nope', 'pl')).toBeNull()
    expect(getCity('nope', 'pl')).toBeNull()
  })
})

describe('content validation', () => {
  let dir: string
  const operatorDir = () => path.join(dir, 'polska', 'slaskie', 'testowy')
  const write = (file: string, data: unknown) =>
    writeFile(path.join(operatorDir(), file), JSON.stringify(data))
  const problems = () => {
    try {
      loadCatalog(dir)
    } catch (err) {
      if (err instanceof ContentError) return err.problems
      throw err
    }
    return []
  }

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'content-'))
    await cp(FIXTURE, dir, { recursive: true })
  })
  afterEach(() => rm(dir, { recursive: true, force: true }))

  it('accepts the fixture', () => {
    expect(problems()).toEqual([])
  })

  it('lists every problem at once, with file and field', async () => {
    await write('tickets.json', {
      tickets: [{ category: 'lifetime', name: { pl: 'X' }, colour: 'red' }],
    })
    await unlink(path.join(operatorDir(), 'images', 'map.svg'))
    await writeFile(path.join(operatorDir(), 'ticket.json'), '{}')

    const found = problems()
    expect(found).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/testowy\/tickets\.json at tickets\.0\.category:/),
        expect.stringMatching(/testowy\/tickets\.json at tickets\.0: Unrecognized key: "colour"/),
        expect.stringMatching(/testowy\/images\/map\.svg: image is missing/),
        expect.stringMatching(/testowy\/ticket\.json: unknown file/),
      ]),
    )
  })

  it('rejects broken JSON and a missing operator.json', async () => {
    await writeFile(path.join(operatorDir(), 'zones.json'), '{ "enabled": tru')
    await unlink(path.join(dir, 'polska', 'slaskie', 'inny', 'operator.json'))
    expect(problems()).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/testowy\/zones\.json: not valid JSON/),
        expect.stringMatching(/inny\/operator\.json: file is missing/),
      ]),
    )
  })

  it('checks references between files', async () => {
    await write('operator.json', {
      name: 'Testowy',
      related: [{ operator: 'ghost', relation: 'regional', ticketValidity: 'invalid' }],
    })
    await write('cities.json', [
      { slug: 'wspolne', name: { pl: 'Inna nazwa' }, primary: true },
      { slug: 'gdzies', name: { pl: 'Gdzieś' }, voivodeship: 'mazowieckie' },
    ])

    expect(problems()).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/related operator "ghost" does not exist/),
        expect.stringMatching(/city "wspolne" has a different name/),
        expect.stringMatching(/city "wspolne" is marked primary by several operators/),
        expect.stringMatching(/city "gdzies" points to unknown voivodeship "mazowieckie"/),
      ]),
    )
  })

  it('requires URL-safe folder names', async () => {
    await cp(operatorDir(), path.join(dir, 'polska', 'slaskie', 'Zły Folder'), { recursive: true })
    expect(problems()).toEqual([expect.stringMatching(/Zły Folder: folder names are URL slugs/)])
  })
})

describe('JSON schemas for editors', () => {
  it('are up to date (run `npm run generate:schemas`)', async () => {
    for (const [name, schema] of Object.entries(jsonSchemas())) {
      const file = path.resolve('schemas', `${name}.schema.json`)
      expect(JSON.parse(await readFile(file, 'utf8')), file).toEqual(schema)
    }
  })
})
