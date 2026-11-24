import { createHash } from 'crypto'
import { mkdir, readFile, rename, writeFile } from 'fs/promises'
import path from 'path'

// Last accepted copy: <slug>/<key>.{html,txt}; current fetch: <slug>/<key>.fetched.{html,txt}
const cacheDir = () => path.resolve(process.env.CHECK_CACHE_DIR || '.tmp/check')

export const hashText = (text: string) => createHash('sha1').update(text).digest('hex')

// The same URL can be read with different XPaths (e.g. for tickets and for luggage): each gets its own entry
const base = (slug: string, url: string, xpath?: string | null) =>
  path.join(cacheDir(), slug, hashText(xpath ? `${url}\n${xpath}` : url))

export const storeFetched = async (
  slug: string,
  url: string,
  html: string,
  text: string,
  xpath?: string | null,
) => {
  const file = base(slug, url, xpath)
  await mkdir(path.dirname(file), { recursive: true })
  await Promise.all([
    writeFile(`${file}.fetched.html`, html),
    writeFile(`${file}.fetched.txt`, text),
  ])
}

// Extracted text of the last accepted check, null on the first run. Text, not raw HTML: markup carries tokens and
// timestamps that change on every request
export const readBaseline = async (
  slug: string,
  url: string,
  xpath?: string | null,
): Promise<string | null> => {
  try {
    return await readFile(`${base(slug, url, xpath)}.txt`, 'utf8')
  } catch {
    return null
  }
}

// Called only for pages whose facts all checked out, so a page with open problems is reported again on the next run
export const promote = async (slug: string, url: string, xpath?: string | null) => {
  const file = base(slug, url, xpath)
  await rename(`${file}.fetched.html`, `${file}.html`)
  await rename(`${file}.fetched.txt`, `${file}.txt`)
}
