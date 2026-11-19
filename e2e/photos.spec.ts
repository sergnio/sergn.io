import type { Page } from '@playwright/test'
import { awaitClientRouter } from './client-router'
import { expect, test } from './tracker-stub'

// Fixture photos point at Unsplash. Served locally, cacheable like the Sanity
// CDN, and slow enough that a photo nobody preloaded cannot finish between the
// page swap and the check.
async function servePhotos(page: Page, { delayMs }: { delayMs: number }) {
  const requested: string[] = []
  await page.route('https://images.unsplash.com/**', async (route) => {
    requested.push(route.request().url())
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    await route
      .fulfill({
        // Big enough to keep a nonzero width once srcset density scales it.
        path: 'public/icon-192.png',
        headers: { 'cache-control': 'public, max-age=31536000' },
      })
      .catch(() => undefined)
  })
  return requested
}

async function trackLayoutShifts(page: Page) {
  await page.addInitScript(() => {
    const shifts: { value: number; moved: string[] }[] = []
    Object.assign(window, { layoutShifts: shifts })
    const describe = (node: Node | null) =>
      node instanceof Element
        ? `${node.tagName.toLowerCase()}.${node.className}`
        : String(node?.nodeName)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as {
        value: number
        hadRecentInput: boolean
        sources: { node: Node | null }[]
      }[]) {
        if (entry.hadRecentInput) continue
        shifts.push({
          value: entry.value,
          moved: entry.sources.map((source) => describe(source.node)),
        })
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })
}

type Shifts = { layoutShifts: { value: number; moved: string[] }[] }

/** Counts only what moves from here on. */
const forgetLayoutShifts = (page: Page) =>
  page.evaluate(() => {
    ;(window as unknown as Shifts).layoutShifts.length = 0
  })

const layoutShifts = (page: Page) =>
  page.evaluate(() => (window as unknown as Shifts).layoutShifts)

// Read once, not retried: the question is whether each photo on screen is
// already painted at the moment the page appears.
const unpaintedPhotos = (page: Page) =>
  page
    .getByRole('main')
    .getByRole('img')
    .evaluateAll((images) =>
      images
        .filter(
          (image): image is HTMLImageElement =>
            image instanceof HTMLImageElement &&
            image.getBoundingClientRect().top < window.innerHeight,
        )
        .filter((image) => !(image.complete && image.naturalWidth > 0))
        .map((image) => image.alt),
    )

async function openHomeAndSettle(page: Page) {
  await page.goto('/')
  await awaitClientRouter(page)
  // Preloading starts once the browser is idle after load.
  await page.waitForLoadState('networkidle')
}

for (const width of [390, 1280]) {
  test(`after the home page, Wings and a wing open with every photo painted at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 })
    await servePhotos(page, { delayMs: 500 })
    await trackLayoutShifts(page)
    await openHomeAndSettle(page)
    await forgetLayoutShifts(page)

    await page
      .getByRole('navigation', { name: 'Sections' })
      .getByRole('link', { name: 'Wings', exact: true })
      .click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Wings' }),
    ).toBeVisible()
    expect(await unpaintedPhotos(page)).toEqual([])

    await page
      .getByRole('main')
      .getByRole('link', { name: /^The Corner Bar/ })
      .first()
      .click()
    await expect(page).toHaveURL(/\/wings\/corner-bar-buffalo$/)
    expect(await unpaintedPhotos(page)).toEqual([])

    expect(await layoutShifts(page)).toEqual([])
  })
}

test('a reader who asked to save data downloads no photos ahead of time', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', {
      value: { saveData: true, effectiveType: '4g' },
    })
  })
  const requested = await servePhotos(page, { delayMs: 0 })

  await openHomeAndSettle(page)

  expect(requested).toEqual([])
})

test('a photo still downloading shows a blurred copy of itself', async ({
  page,
}) => {
  // Never answered, so every photo stays mid-download.
  await page.route('https://images.unsplash.com/**', () => undefined)
  await page.goto('/wings', { waitUntil: 'domcontentloaded' })

  // The placeholder is the requirement itself, so the test reads the style.
  const topPhoto = page
    .getByRole('main')
    .getByRole('img', { name: 'A plate of sauced chicken wings' })
  await expect(topPhoto).toHaveCSS(
    'background-image',
    /^url\("data:image\/jpeg;base64,/,
  )
  await expect(topPhoto).toHaveCSS('background-size', 'cover')
})
