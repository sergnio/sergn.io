import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import redirectShortLink, { SHORT_LINKS, config } from './short-links'
import type { EdgeContext } from './short-links'

const fetchMock = vi.fn()

function scan(
  path: string,
  { token }: { token?: string } = { token: 'test-token' },
) {
  vi.stubGlobal('Netlify', { env: { get: () => token } })
  const pending: Array<Promise<unknown>> = []
  const context: EdgeContext = {
    ip: '203.0.113.7',
    waitUntil: (promise) => pending.push(promise),
  }
  const request = new Request(`https://sergn.io${path}`, {
    headers: { 'user-agent': 'iPhone Camera' },
  })
  const response = redirectShortLink(request, context)
  return { response, counted: Promise.all(pending) }
}

beforeEach(() => {
  fetchMock.mockResolvedValue(new Response(null, { status: 202 }))
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('short links', () => {
  it('routes every short link, and only those, to the edge function', () => {
    expect(config.path).toEqual(Object.keys(SHORT_LINKS))
  })

  it('redirects /ai to the class page without caching', () => {
    const { response } = scan('/ai')

    expect(response?.status).toBe(302)
    expect(response?.headers.get('location')).toBe(SHORT_LINKS['/ai'])
    expect(response?.headers.get('cache-control')).toBe('no-store')
  })

  it('counts the scan in GoatCounter with the visitor details', async () => {
    const { counted } = scan('/ai')
    await counted

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://sergnio.goatcounter.com/api/v0/count')
    expect(init.headers.Authorization).toBe('Bearer test-token')
    expect(JSON.parse(init.body)).toEqual({
      hits: [
        {
          path: '/ai',
          title: 'QR: /ai',
          ip: '203.0.113.7',
          user_agent: 'iPhone Camera',
          ref: '',
        },
      ],
    })
  })

  it('still redirects when GoatCounter is down', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))
    const { response, counted } = scan('/ai')

    expect(response?.status).toBe(302)
    await expect(counted).resolves.toBeDefined()
  })

  it('still redirects, without counting, when the token is missing', async () => {
    const { response, counted } = scan('/ai', {})
    await counted

    expect(response?.status).toBe(302)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('passes through paths that are not short links', () => {
    expect(scan('/coffee').response).toBeUndefined()
  })
})
