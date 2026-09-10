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
      url.startsWith('https://fonts.googleapis.com/css2'),
    )

    expect(appCss, 'the app stylesheet was never requested').toBeDefined()
    expect(fontCss, 'the font stylesheet was never requested').toBeDefined()

    const appCssResponse = await page.request.get(appCss![0])
    expect(await appCssResponse.text()).not.toMatch(
      /@import\s+url\(\s*['"]?https?:/i,
    )
  })

  test('every page head links fonts directly and preconnects to gstatic', async ({
    page,
  }) => {
    for (const path of ['/', '/coffee', '/coffee/colombia-perky']) {
      await page.goto(path)

      await expect(
        page.locator(
          'link[rel="stylesheet"][href^="https://fonts.googleapis.com"]',
        ),
      ).toHaveCount(1)
      await expect(
        page.locator(
          'link[rel="preconnect"][href="https://fonts.gstatic.com"]',
        ),
      ).toHaveAttribute('crossorigin', 'anonymous')
      await expect(
        page.locator(
          'link[rel="preconnect"][href="https://fonts.googleapis.com"]',
        ),
      ).toHaveCount(1)
    }
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
