import type { AnyRouter } from '@tanstack/react-router'
import { lastAnimatedDecision } from './browser-animated-history'

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
  scroll: string
  ms: number
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
  return `${images.length - missing.length}/${images.length}`
}

export function installNavDebug(router: AnyRouter) {
  if (typeof window === 'undefined' || !enabled()) return

  const panel = document.createElement('pre')
  panel.setAttribute('aria-hidden', 'true')
  panel.style.cssText =
    'position:fixed;left:4px;bottom:4px;z-index:9999;margin:0;padding:4px;max-width:calc(100vw - 8px);overflow:hidden;font:9px/1.25 ui-monospace,monospace;background:rgb(0 0 0/.8);color:#fff;pointer-events:none;white-space:pre'
  document.body.append(panel)

  const log: Entry[] = []
  const leftAt = new Map<string, number>()
  let action = 'LOAD'
  let startedAt = performance.now()
  let viewTransition = false
  let dataRequests = 0

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
      lastAnimatedDecision.signal = 'notcalled'
    },
  )

  router.subscribe('onBeforeNavigate', ({ fromLocation }) => {
    const key = fromLocation?.state.__TSR_key
    if (key) leftAt.set(key, Math.round(scrollY))
  })

  router.subscribe('onRendered', ({ toLocation }) => {
    const firstFrameImages = new Promise<string>((resolve) =>
      requestAnimationFrame(() => resolve(visibleImages())),
    )
    void firstFrameImages.then((images) => {
      const left = leftAt.get(toLocation.state.__TSR_key ?? '')
      log.unshift({
        action,
        to: toLocation.pathname.slice(0, 22),
        index: toLocation.state.__TSR_index,
        decision: lastAnimatedDecision.signal,
        viewTransition,
        dataRequests,
        images,
        scroll: `${Math.round(scrollY)}${left === undefined ? '' : `/${left}`}`,
        ms: Math.round(performance.now() - startedAt),
      })
      log.length = Math.min(log.length, 10)
      panel.textContent = [
        `len ${history.length} uaFlag ${'hasUAVisualTransition' in PopStateEvent.prototype}`,
        'act  idx to                     dec       vt req img   scroll    ms',
        ...log.map((e) =>
          [
            e.action.padEnd(4).slice(0, 4),
            String(e.index).padStart(3),
            e.to.padEnd(22),
            e.decision.padEnd(9),
            e.viewTransition ? 'Y ' : '- ',
            String(e.dataRequests).padStart(3),
            e.images.padEnd(5),
            e.scroll.padEnd(9),
            String(e.ms).padStart(4),
          ].join(' '),
        ),
      ].join('\n')
    })
  })
}
