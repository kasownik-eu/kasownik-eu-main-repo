import { getPayload } from 'payload'

import config from '@payload-config'
import { syncAllTariffs } from '@/tariffs/syncTariffs'

// Usage: npm run sync:tariffs -- [<slug>] [dry-run] [force]
// `payload run` drops --flags and only forwards positional arguments, hence plain words
const args = process.argv.slice(2)
const dryRun = args.includes('dry-run')
const force = args.includes('force')
const slug = args.find((arg) => arg !== 'dry-run' && arg !== 'force')

const payload = await getPayload({ config })
const summary = await syncAllTariffs(payload, { slug, dryRun, force })

for (const r of summary.results) {
  console.log(`\n=== ${r.slug}: ${r.status}${r.error ? ` (${r.error})` : ''}`)
  for (const p of r.pages) {
    console.log(`  ${p.changed ? 'changed  ' : 'unchanged'} ${p.url} (${p.text.length} chars)`)
    if (dryRun) console.log(p.text.slice(0, 800).replace(/^/gm, '    | '))
  }
  if (r.reasons?.length) console.log('  Review needed:\n' + r.reasons.map((x) => `    - ${x}`).join('\n'))
  if (r.changes?.length) {
    console.log(`  Changes (${r.changes.length}):`)
    for (const c of r.changes) {
      console.log(`    ${c.major ? '!' : ' '} ${c.kind} ${c.path}: ${JSON.stringify(c.before)} -> ${JSON.stringify(c.after)}`)
    }
  }
}
console.log('\nSummary:', summary.counts)

process.exit(summary.failed.length ? 1 : 0)
