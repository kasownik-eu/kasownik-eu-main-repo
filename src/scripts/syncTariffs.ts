import 'dotenv/config'

import { syncAllTariffs } from '@/tariffs/syncTariffs'

// Usage: npm run sync:tariffs -- [<slug>] [dry-run] [force]   (--dry-run / --force work too)
const args = process.argv.slice(2).map((arg) => arg.replace(/^--/, ''))
const dryRun = args.includes('dry-run')
const force = args.includes('force')
const slug = args.find((arg) => arg !== 'dry-run' && arg !== 'force')

const summary = await syncAllTariffs({ slug, dryRun, force })

for (const r of summary.results) {
  console.log(`\n=== ${r.slug}: ${r.status}${r.error ? ` at ${r.failedStage} (${r.error})` : ''}`)
  for (const p of r.pages) {
    console.log(`  ${p.changed ? 'changed  ' : 'unchanged'} ${p.url} (${p.text.length} chars)`)
    if (dryRun) console.log(p.text.slice(0, 800).replace(/^/gm, '    | '))
  }
  if (r.skipped?.length) console.log(`  Skipped, not tickets (${r.skipped.length}): ${r.skipped.map((x) => `${x.name} [${x.kind}]`).join('; ')}`)
  if (r.changes?.length) {
    console.log(`  ${dryRun ? 'Would change' : 'Changed'} (${r.changes.length}):`)
    for (const c of r.changes) {
      console.log(
        `    ${c.major ? '!' : ' '} ${c.kind} ${c.path}: ${JSON.stringify(c.before)} -> ${JSON.stringify(c.after)}`,
      )
    }
  }
}
console.log('\nSummary:', summary.counts)
if (!dryRun && summary.counts.applied)
  console.log('Review the changes with `git diff data/` and commit them.')

process.exit(summary.failed.length ? 1 : 0)
