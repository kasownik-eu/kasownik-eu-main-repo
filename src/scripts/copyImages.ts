import { cp, mkdir, rm } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

import { getCatalog, IMAGES_DIR } from '@/content/load'
import { MEDIA_DIR } from '@/content'

// Copies data/<country>/<voivodeship>/<operator>/images/ to public/media/<operator>/, where pages link them
// (mediaPath). Runs before `next dev` and `next build`; re-run it (or restart dev) after adding images.
const target = path.resolve('public', MEDIA_DIR)

await rm(target, { recursive: true, force: true })
await mkdir(target, { recursive: true })

let count = 0
for (const operator of getCatalog().operators.values()) {
  const source = path.join(operator.dir, IMAGES_DIR)
  if (!existsSync(source)) continue
  await cp(source, path.join(target, operator.slug), { recursive: true })
  count++
}
console.log(`Copied images of ${count} operator(s) to ${path.relative(process.cwd(), target)}/`)
