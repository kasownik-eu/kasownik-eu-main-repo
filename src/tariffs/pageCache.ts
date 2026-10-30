import { createHash } from 'crypto'
import { mkdir, readFile, rename, writeFile } from 'fs/promises'
import path from 'path'

// Last processed copy: <slug>/<key>.{html,txt}; current fetch: <slug>/<key>.fetched.{html,txt}
const cacheDir = () => path.resolve(process.env.TARIFF_CACHE_DIR || '.tmp/tariffs')

export const hashText = (text: string) => createHash('sha1').update(text).digest('hex')

const base = (slug: string, url: string) => path.join(cacheDir(), slug, hashText(url))

export const storeFetched = async (slug: string, url: string, html: string, text: string) => {
  const file = base(slug, url)
  await mkdir(path.dirname(file), { recursive: true })
  await Promise.all([writeFile(`${file}.fetched.html`, html), writeFile(`${file}.fetched.txt`, text)])
}

// Compares extracted text, not raw HTML: markup carries tokens and timestamps that change on every request
export const isUnchanged = async (slug: string, url: string, text: string): Promise<boolean> => {
  try {
    return hashText(await readFile(`${base(slug, url)}.txt`, 'utf8')) === hashText(text)
  } catch {
    return false
  }
}

// Called only after the run was handled (applied, no changes or queued for review)
export const promote = async (slug: string, url: string) => {
  const file = base(slug, url)
  await rename(`${file}.fetched.html`, `${file}.html`)
  await rename(`${file}.fetched.txt`, `${file}.txt`)
}
