import type { AnyRouter } from '@tanstack/react-router'
import { lastAnimatedDecision } from './browser-animated-history'
import { activeNavVariants } from './nav-variants'

// Temporary: an on-screen log of the last navigations, on with ?navdebug.
const storageKey = 'navdebug'

type Entry = {
  action: string
  to: string
  index: unknown
  decision: string
  viewTransition: boolean
  dataRequests: number
  images: string
  decodeMs: number
  scroll: string
  ms: number
  renderMs: number
  framesBefore: number
  firstFrame: string
  sinceTouch: string
}

function enabled() {
  const param = new URLSearchParams(location.search).get('navdebug')
  if (param === '0') sessionStorage.removeItem(storageKey)
  else if (param !== null) sessionStorage.setItem(storageKey, '1')
  return sessionStorage.getItem(storageKey) === '1'
}

function visibleImages() {
  const images = [...document.querySelectorAll('main img')].filter((image) => {
    const box = image.getBoundingClientRect()
    return box.bottom > 0 && box.top < innerHeight && box.width > 0
  }) as HTMLImageElement[]
  const missing = images.filter(
    (image) => !image.complete || !image.naturalWidth,
  )
  return {
    images,
    loaded: `${images.length - missing.length}/${images.length}`,
  }
}

// What the first frame after a navigation showed before the new page rendered.
function mainContent() {
  const main = document.querySelector('main')
  return main?.querySelector('h1') ? 'old' : 'nil'
}

// Long for a photo Safari already showed means it threw the decoded pixels away.
async function slowestDecode(images: HTMLImageElement[]) {
  const times = await Promise.all(
    images.map(async (image) => {
      const start = performance.now()
      await image.decode().catch(() => undefined)
      return performance.now() - start
    }),
  )
  return Math.round(Math.max(0, ...times))
}

export function installNavDebug(router: AnyRouter) {
  if (typeof window === 'undefined' || !enabled()) return

  const panel = document.createElement('pre')
  panel.setAttribute('aria-hidden', 'true')
  panel.style.cssText =
    'position:fixed;left:4px;bottom:4px;z-index:9999;margin:0;padding:4px;max-width:calc(100vw - 8px);overflow:hidden;font:8px/1.25 ui-monospace,monospace;background:rgb(0 0 0/.8);color:#fff;pointer-events:none;white-space:pre'
  document.body.append(panel)

  const log: Entry[] = []
  const leftAt = new Map<string, number>()
  let action = 'LOAD'
  let startedAt = performance.now()
  let viewTransition = false
  let dataRequests = 0
  let renderedAt = 0
  let framesBefore = 0
  let firstFrame = ''
  let lastTouchEnd = -Infinity
  let sinceTouch = '-'
  addEventListener('touchend', () => (lastTouchEnd = performance.now()), {
    capture: true,
    passive: true,
  })

  if ('startViewTransition' in document) {
    const startViewTransition = document.startViewTransition.bind(document)
    document.startViewTransition = ((
      ...args: Parameters<Document['startViewTransition']>
    ) => {
      viewTransition = true
      return startViewTransition(...args)
    }) as Document['startViewTransition']
  }

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name.includes('/__tsr/staticServerFnCache/')) dataRequests++
    }
  }).observe({ type: 'resource' })

  router.history.subscribe(
    ({ action: historyAction }: { action: { type: string } }) => {
      action = historyAction.type
      startedAt = performance.now()
      viewTransition = false
      dataRequests = 0
      renderedAt = 0
      framesBefore = 0
      firstFrame = ''
      const touchGap = Math.round(startedAt - lastTouchEnd)
      sinceTouch = touchGap < 2000 ? String(touchGap) : '-'
      lastAnimatedDecision.signal = 'notcalled'
      const navigationStart = startedAt
      const countFramesUntilRendered = () => {
        if (navigationStart !== startedAt || renderedAt) return
        if (!firstFrame) firstFrame = mainContent()
        framesBefore++
        requestAnimationFrame(countFramesUntilRendered)
      }
      requestAnimationFrame(countFramesUntilRendered)
    },
  )

  router.subscribe('onBeforeNavigate', ({ fromLocation }) => {
    const key = fromLocation?.state.__TSR_key
    if (key) leftAt.set(key, Math.round(scrollY))
  })

  router.subscribe('onRendered', ({ toLocation }) => {
    renderedAt = performance.now()
    const renderMs = Math.round(renderedAt - startedAt)
    const firstFrameImages = new Promise<ReturnType<typeof visibleImages>>(
      (resolve) => requestAnimationFrame(() => resolve(visibleImages())),
    )
    void firstFrameImages.then(async ({ images, loaded }) => {
      const ms = Math.round(performance.now() - startedAt)
      const decodeMs = await slowestDecode(images)
      const left = leftAt.get(toLocation.state.__TSR_key ?? '')
      log.unshift({
        action,
        to: toLocation.pathname.slice(0, 16),
        index: toLocation.state.__TSR_index,
        decision: lastAnimatedDecision.signal,
        viewTransition,
        dataRequests,
        images: loaded,
        decodeMs,
        scroll: `${Math.round(scrollY)}${left === undefined ? '' : `/${left}`}`,
        ms,
        renderMs,
        framesBefore,
        firstFrame: firstFrame || 'new',
        sinceTouch,
      })
      log.length = Math.min(log.length, 10)
      panel.textContent = [
        `len ${history.length} uaFlag ${'hasUAVisualTransition' in PopStateEvent.prototype} ${/(?:OS|Version)\/[\d._]+/.exec(navigator.userAgent)?.[0] ?? ''} ${activeNavVariants().join(' ') || 'default'}`,
        'act idx to           dec   v r img dcd scroll      ms  rnd fr 1st  tch',
        ...log.map((e) =>
          [
            e.action.slice(0, 3),
            String(e.index).padStart(3),
            e.to.slice(0, 12).padEnd(12),
            e.decision.replace('touch', 'tch').slice(0, 5).padEnd(5),
            e.viewTransition ? 'Y' : '-',
            String(e.dataRequests).slice(0, 1),
            e.images.padEnd(3),
            String(e.decodeMs).padStart(3),
            e.scroll.padEnd(9),
            String(e.ms).padStart(4),
            String(e.renderMs).padStart(4),
            String(e.framesBefore).padStart(2),
            e.firstFrame,
            e.sinceTouch.padStart(4),
          ].join(' '),
        ),
      ].join('\n')
    })
  })
}
