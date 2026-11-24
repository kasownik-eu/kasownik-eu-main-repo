import { ContentError, contentDir, loadCatalog } from '@/content/load'

// Checks every JSON file under data/ (also done by `next build`, but this is faster and lists every problem)
try {
  const { countries, voivodeships, operators, cities } = loadCatalog()
  console.log(
    `${contentDir()}: OK (${countries.length} countries, ${voivodeships.size} voivodeships, ` +
      `${operators.size} operators, ${cities.size} cities)`,
  )
} catch (err) {
  console.error(err instanceof ContentError ? err.message : err)
  process.exit(1)
}
