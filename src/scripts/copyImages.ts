import { cp, mkdir, readFile, rm, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import sharp from 'sharp'

import { getCatalog, IMAGES_DIR } from '@/content/load'
import { MEDIA_DIR } from '@/content'
import type { LogoBackground } from '@/content/enums'

// Copies data/<country>/<voivodeship>/<operator>/images/ to public/media/<operator>/, where pages link them
// (mediaPath). Runs before `next dev` and `next build`; re-run it (or restart dev) after adding images.
// It also decides the plaque behind each logo (`logo.background` in operator.json, see OperatorLogo).
// The logo sits on a white plaque unless its opaque pixels contrast with white below 3:1 (WCAG non-text minimum)
const MIN_CONTRAST = 3

const channel = (value: number) => {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const logoBackground = async (file: string): Promise<LogoBackground> => {
  const { data } = await sharp(file, { density: 144 })
    .resize({ width: 256, height: 256, fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let sum = 0
  let count = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    sum += 0.2126 * channel(data[i]) + 0.7152 * channel(data[i + 1]) + 0.0722 * channel(data[i + 2])
    count++
  }
  if (count === 0) return 'light'
  return 1.05 / (sum / count + 0.05) < MIN_CONTRAST ? 'dark' : 'light'
}

const target = path.resolve('public', MEDIA_DIR)

await rm(target, { recursive: true, force: true })
await mkdir(target, { recursive: true })

let count = 0
for (const operator of getCatalog().operators.values()) {
  const source = path.join(operator.dir, IMAGES_DIR)
  if (!existsSync(source)) continue
  await cp(source, path.join(target, operator.slug), { recursive: true })
  count++

  const { logo } = operator.info
  if (!logo) continue
  const background = await logoBackground(path.join(source, logo.file))
  if (logo.background === background) continue
  const infoFile = path.join(operator.dir, 'operator.json')
  const raw = JSON.parse(await readFile(infoFile, 'utf8'))
  raw.logo.background = background
  await writeFile(infoFile, JSON.stringify(raw, null, 2) + '\n')
  console.log(`${operator.slug}: logo plaque ${background}`)
}
console.log(`Copied images of ${count} operator(s) to ${path.relative(process.cwd(), target)}/`)
