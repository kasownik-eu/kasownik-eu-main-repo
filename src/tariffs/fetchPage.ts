const TIMEOUT_MS = 20_000

export const fetchPage = async (url: string): Promise<string> => {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'transport-helper-tariff-sync/0.1', Accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`Fetching ${url} failed: HTTP ${res.status}`)

  const type = res.headers.get('content-type') ?? ''
  if (!/text\/html|application\/xhtml\+xml/.test(type)) {
    throw new Error(`Fetching ${url} failed: unsupported content type "${type}"`)
  }
  return res.text()
}
