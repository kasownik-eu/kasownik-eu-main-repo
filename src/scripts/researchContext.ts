import { contentDir, ContentError, loadCatalog } from '@/content/load'
import { operatorContext } from '@/research/operatorContext'

// Usage: npm run research:context -- <operator website URL>
// Prints JSON for the operator-research skill: verify (operator with this host exists) or discover, plus
// the cities, voivodeships and operators it must stay consistent with
const url = process.argv[2]
if (!url) {
  console.error('Usage: npm run research:context -- <operator website URL>')
  process.exit(1)
}

try {
  console.log(JSON.stringify(operatorContext(loadCatalog(), url, contentDir()), null, 2))
} catch (err) {
  console.error(err instanceof ContentError ? err.message : (err as Error).message)
  process.exit(1)
}
