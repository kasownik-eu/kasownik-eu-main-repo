import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

import { jsonSchemas } from '@/content/jsonSchemas'

// Writes schemas/*.schema.json from the Zod schemas; .vscode/settings.json maps them onto data/ for autocomplete.
// Run after changing src/content/schema.ts (a test fails while they are out of date)
const dir = path.resolve('schemas')
await mkdir(dir, { recursive: true })
for (const [name, schema] of Object.entries(jsonSchemas())) {
  await writeFile(path.join(dir, `${name}.schema.json`), `${JSON.stringify(schema, null, 2)}\n`)
}
console.log(`Wrote ${Object.keys(jsonSchemas()).length} schemas to schemas/`)
