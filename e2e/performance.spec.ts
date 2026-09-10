import { expect, test } from '@playwright/test'

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

  test('card images stay lazy while the detail hero loads eagerly', async ({
    page,
  }) => {
    await page.goto('/coffee/colombia-perky')
    const hero = page.locator('.detail-hero__image img')
    await expect(hero).toHaveAttribute('loading', 'eager')
    await expect(hero).toHaveAttribute('decoding', 'async')
    // Intrinsic dimensions must be present or the hero shifts layout on load.
    await expect(hero).toHaveAttribute('width', /\d+/)
    await expect(hero).toHaveAttribute('height', /\d+/)
    await expect(hero).toHaveAttribute('srcset', /400w.*800w.*1200w/)
  })
})
