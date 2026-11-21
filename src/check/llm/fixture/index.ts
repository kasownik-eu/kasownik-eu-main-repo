import { readFile } from 'fs/promises'
import path from 'path'

import type { LlmExtractor } from '../types'

// Stand-in for a real LLM: returns <CHECK_LLM_FIXTURE_DIR>/<slug>[.<pass>].json
export const fixtureExtractor: LlmExtractor = {
  name: 'fixture',
  async extract({ operator, pass }) {
    const dir = path.resolve(process.env.CHECK_LLM_FIXTURE_DIR || 'tests/fixtures/check')
    const file = path.join(dir, pass ? `${operator.slug}.${pass}.json` : `${operator.slug}.json`)
    try {
      return JSON.parse(await readFile(file, 'utf8'))
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(
          `No fixture for operator "${operator.slug}" (expected ${file}). The fixture provider does not read the ` +
            `fetched pages, it only returns prepared JSON: add this file or set CHECK_LLM_PROVIDER to a real provider`,
        )
      }
      throw new Error(`Cannot load fixture ${file}: ${(err as Error).message}`)
    }
  },
}
