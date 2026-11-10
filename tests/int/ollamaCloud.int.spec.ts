import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ollamaCloudExtractor } from '@/tariffs/llm/ollama-cloud'

const args = {
  pages: [{ url: 'https://example.com/cennik', text: 'Bilet 20 min | 3,40 zł' }],
  operator: { slug: 'mzt', name: 'MZT' },
  jsonSchema: { type: 'object' },
  instructions: 'Extract tariffs.',
}

const reply = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('ollamaCloudExtractor', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('OLLAMA_API_KEY', 'test-key')
    vi.stubEnv('OLLAMA_MODEL', 'test-model')
    vi.stubEnv('OLLAMA_RETRY_DELAY_MS', '0')
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('sends the schema as structured output format and parses the JSON reply', async () => {
    fetchMock.mockResolvedValue(reply({ done: true, done_reason: 'stop', message: { content: '{"tickets":[]}' } }))

    await expect(ollamaCloudExtractor.extract(args)).resolves.toEqual({ tickets: [] })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }]
    const body = JSON.parse(init.body as string)
    expect(new URL(url).hostname).toBe('ollama.com')
    expect(new URL(url).pathname).toBe('/api/chat')
    expect(init.headers.Authorization).toBe('Bearer test-key')
    expect(body).toMatchObject({ model: 'test-model', stream: false, format: args.jsonSchema })
    expect(body.messages[1].content).toContain('Bilet 20 min')
  })

  it('fails without an API key', async () => {
    vi.stubEnv('OLLAMA_API_KEY', '')
    await expect(ollamaCloudExtractor.extract(args)).rejects.toThrow('OLLAMA_API_KEY')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects non-JSON and truncated output', async () => {
    fetchMock.mockResolvedValueOnce(reply({ done: true, message: { content: 'Here is the tariff' } }))
    await expect(ollamaCloudExtractor.extract(args)).rejects.toThrow('non-JSON')

    fetchMock.mockResolvedValueOnce(reply({ done: true, done_reason: 'length', message: { content: '{"ti' } }))
    await expect(ollamaCloudExtractor.extract(args)).rejects.toThrow('OLLAMA_NUM_PREDICT')
  })

  it('retries 5xx but not 4xx', async () => {
    fetchMock
      .mockResolvedValueOnce(reply({ error: 'overloaded' }, 503))
      .mockResolvedValueOnce(reply({ done: true, message: { content: '{}' } }))
    await expect(ollamaCloudExtractor.extract(args)).resolves.toEqual({})
    expect(fetchMock).toHaveBeenCalledTimes(2)

    fetchMock.mockReset()
    fetchMock.mockResolvedValue(reply({ error: 'unauthorized' }, 401))
    await expect(ollamaCloudExtractor.extract(args)).rejects.toThrow('HTTP 401: unauthorized')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
