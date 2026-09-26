// Short links for printed QR codes. The QR encodes the sergn.io URL, so the
// destination can change here without reprinting it. QR images live in docs/qr/.
export const SHORT_LINKS: Record<string, string> = {
  '/ai':
    'https://minneapolis.arux.app/course/67744/adult-enrichment-fall-2026/beware-the-ai-southwest',
}

// Netlify reads this statically, so it must list SHORT_LINKS' keys literally.
export const config = { path: ['/ai'] }

const GOATCOUNTER_COUNT_API = 'https://sergnio.goatcounter.com/api/v0/count'

export interface EdgeContext {
  ip: string
  waitUntil: (promise: Promise<unknown>) => void
}

declare const Netlify: { env: { get: (name: string) => string | undefined } }

export default function redirectShortLink(
  request: Request,
  context: EdgeContext,
): Response | undefined {
  const { pathname } = new URL(request.url)
  const destination = SHORT_LINKS[pathname]
  if (!destination) return undefined

  // Counted after the response goes out, so a slow or failing GoatCounter
  // never delays the scan's redirect.
  context.waitUntil(countScan(request, context.ip, pathname))

  // 302 and no-store, so no browser or scanner caches the destination and
  // every scan reaches this function to be counted.
  return new Response(null, {
    status: 302,
    headers: { Location: destination, 'Cache-Control': 'no-store' },
  })
}

async function countScan(request: Request, ip: string, path: string) {
  const token = Netlify.env.get('GOATCOUNTER_API_TOKEN')
  if (!token) {
    console.error('GOATCOUNTER_API_TOKEN is not set; scan not counted')
    return
  }

  try {
    const response = await fetch(GOATCOUNTER_COUNT_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hits: [
          {
            path,
            title: `QR: ${path}`,
            ip,
            user_agent: request.headers.get('user-agent') ?? '',
            ref: request.headers.get('referer') ?? '',
          },
        ],
      }),
    })
    if (!response.ok) {
      console.error(`GoatCounter rejected scan of ${path}: ${response.status}`)
    }
  } catch (error) {
    console.error(`GoatCounter unreachable for scan of ${path}`, error)
  }
}
