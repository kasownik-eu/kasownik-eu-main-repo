import 'dotenv/config'

import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

import { checkOperators, GOOD_STATUSES } from '@/check/checkOperator'

// Usage: npm run check:operators -- [<slug>] [--no-llm]
// Re-reads the pages behind each operator's evidence.json and reports facts that are no longer on them. The small model
// (CHECK_LLM_PROVIDER) only judges facts whose quote vanished; --no-llm skips it. Never edits data/: a stale operator is
// re-researched with the operator-research skill. Exit code 1 when any operator is stale or unreachable.
const args = process.argv.slice(2)
const llm = !args.includes('--no-llm')
const slug = args.find((arg) => !arg.startsWith('--'))

const results = await checkOperators({ slug, llm })

for (const r of results) {
  console.log(`\n=== ${r.slug}: ${r.status}${r.error ? ` (${r.error})` : ''}`)
  if (r.status === 'no_evidence') continue
  for (const p of r.pages) {
    const mark = p.error
      ? 'unreachable'
      : p.changed === null
        ? 'first check'
        : p.changed
          ? 'changed'
          : 'unchanged'
    console.log(`  ${mark.padEnd(12)} ${p.url}${p.xpath ? ` (XPath)` : ''}`)
    for (const line of p.removed) console.log(`      - ${line}`)
    for (const line of p.added) console.log(`      + ${line}`)
  }
  const ok = r.facts.filter((f) => GOOD_STATUSES.includes(f.status)).length
  console.log(`  facts: ${ok}/${r.facts.length} ok`)
  for (const f of r.facts.filter((f) => !GOOD_STATUSES.includes(f.status)))
    console.log(
      `  ${f.status.toUpperCase()} ${f.file}: ${f.path} = ${JSON.stringify(f.value)}${f.detail ? ` (${f.detail})` : ''}${f.newQuote ? `\n      page now says: ${f.newQuote}` : ''}`,
    )
  for (const w of r.warnings) console.log(`  Warning: ${w}`)
}

const reportFile = path.resolve(process.env.CHECK_CACHE_DIR || '.tmp/check', 'report.json')
await mkdir(path.dirname(reportFile), { recursive: true })
await writeFile(
  reportFile,
  `${JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2)}\n`,
)
console.log(`\nReport: ${path.relative(process.cwd(), reportFile)}`)

process.exit(
  results.some((r) => r.status === 'stale' || r.status === 'unreachable' || r.status === 'failed')
    ? 1
    : 0,
)
