import { expect, test } from './tracker-stub'

test.describe('Performance', () => {
  test('the font stylesheet is requested without waiting for the app CSS', async ({
    page,
  }) => {
    // An @import inside styles.css used to hide the font stylesheet from the
    // preload scanner, so the woff2 files could not start until styles.css had
    // been downloaded and parsed. Both stylesheets must now start together.
    const requestedAt = new Map<string, number>()
    const start = Date.now()
    page.on('request', (request) => {
      const url = request.url()
      if (!requestedAt.has(url)) requestedAt.set(url, Date.now() - start)
    })

    const response = await page.goto('/')
    expect(response?.status()).toBe(200)

    const appCss = [...requestedAt].find(([url]) =>
      /\/assets\/styles-[^/]+\.css$/.test(url),
    )
    const fontCss = [...requestedAt].find(([url]) =>
      /\/assets\/fonts-[^/]+\.css$/.test(url),
    )

    expect(appCss, 'the app stylesheet was never requested').toBeDefined()
    expect(fontCss, 'the font stylesheet was never requested').toBeDefined()

    const appCssResponse = await page.request.get(appCss![0])
    expect(await appCssResponse.text()).not.toMatch(
      /@import\s+url\(\s*['"]?https?:/i,
    )
  })

  test('fonts are served from this origin and preloaded, never from Google', async ({
    page,
  }) => {
    const requestedHosts = new Set<string>()
    page.on('request', (request) => {
      requestedHosts.add(new URL(request.url()).host)
    })

    for (const path of ['/', '/coffee', '/coffee/colombia-perky']) {
      await page.goto(path)

      await expect(
        page.locator('link[rel="stylesheet"][href^="/assets/fonts-"]'),
      ).toHaveCount(1)
      await expect(
        page.locator('link[rel="preload"][as="font"]'),
      ).not.toHaveCount(0)
      await expect(
        page.locator('link[href*="fonts.googleapis.com"]'),
      ).toHaveCount(0)
      await expect(page.locator('link[href*="fonts.gstatic.com"]')).toHaveCount(
        0,
      )
    }

    expect(
      [...requestedHosts].filter((host) => host.endsWith('gstatic.com')),
    ).toEqual([])
    expect(
      [...requestedHosts].filter((host) => host.endsWith('googleapis.com')),
    ).toEqual([])
  })

  test('every preloaded font is served as woff2 and actually loads', async ({
    page,
  }) => {
    await page.goto('/')

    const hrefs = await page
      .locator('link[rel="preload"][as="font"]')
      .evaluateAll((links) =>
        links.map((link) => (link as HTMLLinkElement).getAttribute('href')!),
      )
    expect(hrefs.length).toBeGreaterThan(0)

    for (const href of hrefs) {
      const response = await page.request.get(href)
      expect(response.status(), `${href} was not served`).toBe(200)
      expect(response.headers()['content-type']).toContain('font/woff2')
    }

    // A preload the page never uses is a wasted download on every visit.
    const loadedFamilies = await page.evaluate(async () => {
      await document.fonts.ready
      return [...document.fonts]
        .filter((face) => face.status === 'loaded')
        .map((face) => face.family)
    })
    expect(loadedFamilies).toContain('Newsreader')
    expect(loadedFamilies).toContain('DM Mono')
  })

  test('the detail hero loads eagerly at high priority', async ({ page }) => {
    await page.goto('/coffee/colombia-perky')
    const hero = page.locator('.detail-hero__image img')
    await expect(hero).toHaveAttribute('loading', 'eager')
    await expect(hero).toHaveAttribute('fetchpriority', 'high')
    await expect(hero).toHaveAttribute('decoding', 'async')
    // Intrinsic dimensions must be present or the hero shifts layout on load.
    await expect(hero).toHaveAttribute('width', /\d+/)
    await expect(hero).toHaveAttribute('height', /\d+/)
    await expect(hero).toHaveAttribute('srcset', /400w.*800w.*1200w/)
  })

  test('a collection index prioritises its topmost card image only', async ({
    page,
  }) => {
    await page.goto('/coffee')
    const images = page.locator('.content-card img')
    const count = await images.count()
    test.skip(count === 0, 'The dataset has no coffee card with an image.')

    await expect(images.first()).toHaveAttribute('loading', 'eager')
    await expect(images.first()).toHaveAttribute('fetchpriority', 'high')
    for (let index = 1; index < count; index += 1) {
      // Everything below the first card is off-screen on load; prioritising
      // it would only take bandwidth away from the LCP image.
      await expect(images.nth(index)).toHaveAttribute('loading', 'lazy')
      await expect(images.nth(index)).not.toHaveAttribute(
        'fetchpriority',
        'high',
      )
    }
  })

  test('a collection index paints its LCP with the prioritised image', async ({
    page,
  }) => {
    // The attribute tests above pin the markup; this pins the consequence -
    // that the element the browser actually reports as Largest Contentful
    // Paint is the one image the page chose to prioritise.
    await page.addInitScript(() => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const last = entries[entries.length - 1] as
          (PerformanceEntry & { element?: Element }) | undefined
        if (last?.element) {
          Object.assign(window, { __lcpElement: last.element })
        }
      }).observe({ buffered: true, type: 'largest-contentful-paint' })
    })

    await page.goto('/wings')
    const hasCardImage = (await page.locator('.content-card img').count()) > 0
    test.skip(!hasCardImage, 'The dataset has no wings card with an image.')

    await expect
      .poll(async () =>
        page.evaluate(() => {
          const element = (window as unknown as { __lcpElement?: Element })
            .__lcpElement
          if (!element) return null
          return {
            fetchpriority: element.getAttribute('fetchpriority'),
            loading: element.getAttribute('loading'),
            tag: element.tagName,
          }
        }),
      )
      .toEqual({ fetchpriority: 'high', loading: 'eager', tag: 'IMG' })
  })
})
