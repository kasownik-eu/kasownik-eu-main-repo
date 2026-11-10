import { readFile } from 'fs/promises'
import path from 'path'

import type { TariffExtractor } from '../types'

// Stand-in for a real LLM: returns <TARIFF_LLM_FIXTURE_DIR>/<slug>.json
export const fixtureExtractor: TariffExtractor = {
  name: 'fixture',
  async extract({ operator }) {
    const dir = path.resolve(process.env.TARIFF_LLM_FIXTURE_DIR || 'tests/fixtures/tariffs')
    const file = path.join(dir, `${operator.slug}.json`)
    try {
      return JSON.parse(await readFile(file, 'utf8'))
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(
          `No fixture for operator "${operator.slug}" (expected ${file}). The fixture provider does not read the ` +
            `fetched pages, it only returns prepared JSON: add this file or set TARIFF_LLM_PROVIDER to a real provider`,
        )
      }
      throw new Error(`Cannot load fixture ${file}: ${(err as Error).message}`)
    }
  },
}
