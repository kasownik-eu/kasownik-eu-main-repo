import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ollamaLocalExtractor } from '@/check/llm/ollama-local'

const args = {
  pages: [{ url: 'https://example.com/cennik', text: 'Bilet 20 min | 3,40 zł' }],
  operator: { slug: 'mzt', name: 'MZT' },
  jsonSchema: { type: 'object' },
  instructions: 'Check facts.',
}

const reply = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('ollamaLocalExtractor', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('OLLAMA_LOCAL_MODEL', 'test-model')
    vi.stubEnv('OLLAMA_LOCAL_RETRY_DELAY_MS', '0')
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('sends the schema as structured output format and parses the JSON reply', async () => {
    fetchMock.mockResolvedValue(reply({ done: true, done_reason: 'stop', message: { content: '{"tickets":[]}' } }))

    await expect(ollamaLocalExtractor.extract(args)).resolves.toEqual({ tickets: [] })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }]
    const body = JSON.parse(init.body as string)
    expect(new URL(url).origin).toBe('http://localhost:11434')
    expect(new URL(url).pathname).toBe('/api/chat')
    expect(init.headers.Authorization).toBeUndefined()
    expect(body).toMatchObject({ model: 'test-model', stream: false, format: args.jsonSchema })
    expect(body.messages[1].content).toContain('Bilet 20 min')
  })

  it('reports an unreachable server and a missing model', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))
    await expect(ollamaLocalExtractor.extract(args)).rejects.toThrow('cannot reach Ollama at http://localhost:11434')

    fetchMock.mockReset()
    fetchMock.mockResolvedValue(reply({ error: 'model not found' }, 404))
    await expect(ollamaLocalExtractor.extract(args)).rejects.toThrow('ollama pull test-model')
  })

  it('rejects non-JSON and truncated output', async () => {
    fetchMock.mockResolvedValueOnce(reply({ done: true, message: { content: 'Here is the answer' } }))
    await expect(ollamaLocalExtractor.extract(args)).rejects.toThrow('non-JSON')

    fetchMock.mockResolvedValueOnce(reply({ done: true, done_reason: 'length', message: { content: '{"ti' } }))
    await expect(ollamaLocalExtractor.extract(args)).rejects.toThrow('OLLAMA_LOCAL_NUM_PREDICT')
  })

  it('retries 5xx but not 4xx', async () => {
    fetchMock
      .mockResolvedValueOnce(reply({ error: 'overloaded' }, 503))
      .mockResolvedValueOnce(reply({ done: true, message: { content: '{}' } }))
    await expect(ollamaLocalExtractor.extract(args)).resolves.toEqual({})
    expect(fetchMock).toHaveBeenCalledTimes(2)

    fetchMock.mockReset()
    fetchMock.mockResolvedValue(reply({ error: 'bad request' }, 400))
    await expect(ollamaLocalExtractor.extract(args)).rejects.toThrow('HTTP 400: bad request')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
