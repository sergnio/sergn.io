import type { Page } from '@playwright/test'
import { awaitClientRouter } from './client-router'
import { expect, test } from './tracker-stub'

// Cacheable like the Sanity CDN, and too slow for a photo nobody preloaded to
// arrive before the check.
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
            image.isConnected &&
            image.getBoundingClientRect().top < window.innerHeight,
        )
        .filter(
          (image) =>
            !(image.complete && image.naturalWidth > 0) ||
            getComputedStyle(image).opacity !== '1',
        )
        .map((image) => image.alt),
    )

async function openHomeAndSettle(page: Page) {
  await page.goto('/')
  await awaitClientRouter(page)
  // Preloading starts once the browser is idle after load.
  await page.waitForLoadState('networkidle')
}

for (const { width, deviceScaleFactor } of [
  { width: 390, deviceScaleFactor: 3 },
  { width: 1280, deviceScaleFactor: 2 },
]) {
  test.describe(`at ${width}px and ${deviceScaleFactor}x`, () => {
    test.use({ viewport: { width, height: 844 }, deviceScaleFactor })

    test('after the home page, Wings and a wing open with every photo painted', async ({
      page,
    }) => {
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
  })
}

test.describe('a photo not downloaded ahead of time', () => {
  // Data Saver turns preloading off, so only the navigation can fetch it.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'connection', {
        value: { saveData: true, effectiveType: '4g' },
      })
    })
  })

  test('holds the next page briefly so it opens with the photo painted', async ({
    page,
  }) => {
    await servePhotos(page, { delayMs: 100 })
    await openHomeAndSettle(page)

    await page
      .getByRole('navigation', { name: 'Sections' })
      .getByRole('link', { name: 'Wings', exact: true })
      .click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Wings' }),
    ).toBeVisible()

    expect(await unpaintedPhotos(page)).toEqual([])
  })

  test('holds the next page too when a hover already loaded its data', async ({
    page,
  }) => {
    await servePhotos(page, { delayMs: 100 })
    await openHomeAndSettle(page)
    const wingsLink = page
      .getByRole('navigation', { name: 'Sections' })
      .getByRole('link', { name: 'Wings', exact: true })

    const pageData = page.waitForResponse(/staticServerFnCache/)
    await wingsLink.hover()
    await pageData
    await wingsLink.click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Wings' }),
    ).toBeVisible()

    expect(await unpaintedPhotos(page)).toEqual([])
  })

  test('opens the next page anyway when the photo is slow', async ({
    page,
  }) => {
    await servePhotos(page, { delayMs: 5_000 })
    await openHomeAndSettle(page)

    await page
      .getByRole('navigation', { name: 'Sections' })
      .getByRole('link', { name: 'Wings', exact: true })
      .click()

    await expect(
      page.getByRole('heading', { level: 1, name: 'Wings' }),
    ).toBeVisible({ timeout: 2_000 })
    expect(await unpaintedPhotos(page)).not.toEqual([])
  })
})

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

test('a browser that cannot report its connection, like Safari, still downloads photos ahead of time', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { value: undefined })
  })
  const requested = await servePhotos(page, { delayMs: 0 })

  await openHomeAndSettle(page)

  // The home page shows no photos, so every request is a preload.
  expect(requested).not.toEqual([])
})

test.describe('a photo on a fresh visit', () => {
  const topPhoto = (page: Page) =>
    page
      .getByRole('main')
      .getByRole('img', { name: 'A plate of sauced chicken wings' })

  // Held until the test lets them through, so it sees both sides of the arrival.
  async function holdPhotos(page: Page) {
    const held: (() => void)[] = []
    await page.route('https://images.unsplash.com/**', (route) => {
      held.push(() => {
        void route
          .fulfill({ path: 'public/icon-192.png' })
          .catch(() => undefined)
      })
    })
    return () => held.splice(0).forEach((release) => release())
  }

  test('shows a soft blur of itself while it downloads', async ({ page }) => {
    await holdPhotos(page)
    await page.goto('/wings', { waitUntil: 'domcontentloaded' })

    // The placeholder is the requirement itself, so the test reads the style.
    const frame = topPhoto(page).locator('..')
    const blur = await frame.evaluate((element) => {
      const style = getComputedStyle(element, '::before')
      return { image: style.backgroundImage, filter: style.filter }
    })
    expect(blur.image).toMatch(/^url\("data:image\/jpeg;base64,/)
    expect(blur.filter).toMatch(/^blur\(/)
    await expect(topPhoto(page)).toHaveCSS('opacity', '0')
  })

  test('fades in over the blur once it arrives', async ({ page }) => {
    const releasePhotos = await holdPhotos(page)
    await page.goto('/wings', { waitUntil: 'domcontentloaded' })
    await expect(topPhoto(page)).toHaveCSS('opacity', '0')

    releasePhotos()

    await expect(topPhoto(page)).toHaveCSS('transition-duration', '0.25s')
    await expect(topPhoto(page)).toHaveCSS('opacity', '1')
  })

  test('appears without a fade for a reader who asked for less motion', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const releasePhotos = await holdPhotos(page)
    await page.goto('/wings', { waitUntil: 'domcontentloaded' })

    releasePhotos()

    const fadeSeconds = await topPhoto(page).evaluate((image) =>
      parseFloat(getComputedStyle(image).transitionDuration),
    )
    expect(fadeSeconds).toBeLessThan(0.001)
    await expect(topPhoto(page)).toHaveCSS('opacity', '1')
  })

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false })

    test('is never hidden, since nothing could reveal it', async ({ page }) => {
      await holdPhotos(page)
      await page.goto('/wings', { waitUntil: 'domcontentloaded' })

      await expect(topPhoto(page)).toHaveCSS('opacity', '1')
    })
  })
})
