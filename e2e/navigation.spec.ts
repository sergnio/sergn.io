import { expect, test } from '@playwright/test'

test.describe('primary navigation', () => {
  test('home page renders a short index of every section', async ({ page }) => {
    await page.goto('/')

    const sections = page.getByRole('navigation', { name: 'Sections' })
    await expect(sections.getByRole('listitem')).toHaveCount(5)
    for (const name of ['Coffee', 'Wings', 'N/A beers', 'Reubens', 'Blog']) {
      await expect(
        sections.getByRole('link', { name, exact: true }),
      ).toHaveCount(1)
    }

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://sergn.io/',
    )
  })

  test('a collection index lists every document in it', async ({ page }) => {
    await page.goto('/coffee')

    await expect(
      page.getByRole('link', { name: 'Ethiopia Direct Trade' }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Colombia Perky' }).first(),
    ).toBeVisible()
  })

  test('the footer sits on the bottom of the viewport on a short page', async ({
    page,
  }) => {
    // The home page is shorter than the viewport, so without a layout that
    // gives the footer the slack it creeps up under the content.
    await page.setViewportSize({ height: 900, width: 1200 })
    await page.goto('/')

    const box = await page.locator('.site-footer').boundingBox()
    const viewport = page.viewportSize()
    expect(box).not.toBeNull()
    expect(viewport).not.toBeNull()
    expect(box!.y + box!.height).toBeCloseTo(viewport!.height, -1)
  })

  test('a page taller than the viewport pushes the footer below the fold', async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 1200 })
    await page.goto('/coffee')

    // The footer must flow after the content, never overlay or pin above it.
    const box = await page.locator('.site-footer').boundingBox()
    const contentBottom = await page
      .locator('main')
      .evaluate((element) => element.getBoundingClientRect().bottom)
    expect(box!.y).toBeGreaterThanOrEqual(Math.floor(contentBottom))
  })

  test('root layout renders global meta tags and the site footer', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(page.locator('meta[charset]')).toHaveAttribute(
      'charset',
      'utf-8',
    )
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      'content',
      'width=device-width, initial-scale=1',
    )
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
      'content',
      'sergn.io',
    )
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
      'href',
      '/favicon.svg',
    )

    await expect(
      page
        .locator('footer.site-footer')
        .getByText(new RegExp(`© ${new Date().getFullYear()} sergn\\.io`)),
    ).toBeVisible()
  })

  test('visiting each nav link lands on the matching collection page', async ({
    page,
  }) => {
    await page.goto('/')

    const nav = page.getByRole('navigation', { name: 'Primary navigation' })

    for (const { label, path, heading } of [
      { label: 'Coffee', path: '/coffee', heading: 'Coffee' },
      { label: 'Wings', path: '/wings', heading: 'Wings' },
      { label: 'N/A Beers', path: '/na-beers', heading: 'N/A Beers' },
      { label: 'Reubens', path: '/reubens', heading: 'Reubens' },
      { label: 'Blog', path: '/blog', heading: 'Blog' },
    ]) {
      await nav.getByRole('link', { name: label }).click()
      await expect(page).toHaveURL(new RegExp(`${path}/?$`))
      await expect(
        page.getByRole('heading', { level: 1, name: heading }),
      ).toBeVisible()
      await page.goto('/')
    }
  })

  test('the current section is marked as active in the nav', async ({
    page,
  }) => {
    await page.goto('/wings')

    const nav = page.getByRole('navigation', { name: 'Primary navigation' })

    await expect(nav.getByRole('link', { name: 'Wings' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(nav.getByRole('link', { name: 'Coffee' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  test('wordmark link returns to the home page', async ({ page }) => {
    await page.goto('/coffee')
    await page.getByRole('link', { name: 'sergn.io home' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('unknown route shows the styled 404 page', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist')

    expect(response?.status()).toBe(404)
    await expect(
      page.getByRole('heading', { name: 'That page is not here.' }),
    ).toBeVisible()

    await page.getByRole('link', { name: 'Back home' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('unknown slug within a valid collection shows the styled 404 page', async ({
    page,
  }) => {
    const response = await page.goto('/coffee/this-slug-does-not-exist')

    expect(response?.status()).toBe(404)
    await expect(
      page.getByRole('heading', { name: 'That page is not here.' }),
    ).toBeVisible()
  })

  test('retired content route shows the retirement notice', async ({
    page,
  }) => {
    const response = await page.goto('/retired-content')

    expect(response?.status()).toBe(200)
    await expect(
      page.getByRole('heading', { name: 'Syrup reviews have retired.' }),
    ).toBeVisible()

    await expect(page).toHaveTitle('Retired content | sergn.io')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex',
    )
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://sergn.io/retired-content',
    )

    await page.getByRole('link', { name: 'Explore current notes' }).click()
    await expect(page).toHaveURL(/\/$/)
  })
})

test.describe('mobile navigation menu', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('menu button toggles the primary nav open and closed', async ({
    page,
  }) => {
    await page.goto('/')

    const menuButton = page.getByRole('button', { name: 'Menu' })
    const nav = page.getByRole('navigation', { name: 'Primary navigation' })

    await expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    await menuButton.click()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    await expect(nav.getByRole('link', { name: 'Coffee' })).toBeVisible()

    await page.getByRole('button', { name: 'Close menu' }).click()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })

  test('choosing a link from the open menu navigates and closes it', async ({
    page,
  }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Menu' }).click()
    await page
      .getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('link', { name: 'Wings' })
      .click()

    await expect(page).toHaveURL(/\/wings\/?$/)
    await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  test('pressing Escape closes the open menu', async ({ page }) => {
    await page.goto('/')

    const menuButton = page.getByRole('button', { name: 'Menu' })

    await menuButton.click()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true')

    await page.keyboard.press('Escape')
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })
})

test.describe('crawler files', () => {
  test('robots.txt allows crawling and points at the sitemap', async ({
    request,
  }) => {
    const response = await request.get('/robots.txt')

    expect(response.status()).toBe(200)
    const body = await response.text()
    expect(body).toContain('Allow: /')
    expect(body).toContain('Sitemap: https://sergn.io/sitemap.xml')
  })

  test('sitemap.xml lists the home page and every collection index', async ({
    request,
  }) => {
    const response = await request.get('/sitemap.xml')

    expect(response.status()).toBe(200)
    const body = await response.text()
    expect(body).toContain('<loc>https://sergn.io/</loc>')
    for (const collection of [
      'coffee',
      'wings',
      'na-beers',
      'reubens',
      'blog',
    ]) {
      expect(body).toContain(`<loc>https://sergn.io/${collection}</loc>`)
    }
  })

  test('sitemap.xml also lists every detail page permalink', async ({
    request,
  }) => {
    const response = await request.get('/sitemap.xml')

    expect(response.status()).toBe(200)
    const body = await response.text()
    for (const permalink of [
      'coffee/ethiopia-direct-trade',
      'coffee/colombia-perky',
      'wings/neighborhood-buffalo-wings',
      'na-beers/bright-lager',
      'reubens/the-rye-house-reuben',
      'blog/small-rituals-better-cups',
      'blog/a-table-for-two',
    ]) {
      expect(body).toContain(`<loc>https://sergn.io/${permalink}</loc>`)
    }
  })

  test('sitemap.xml omits noindex pages and trailing-slash duplicates', async ({
    request,
  }) => {
    const response = await request.get('/sitemap.xml')

    expect(response.status()).toBe(200)
    const body = await response.text()
    expect(body).not.toContain('https://sergn.io/retired-content')
    expect(body).not.toContain('https://sergn.io/not-found')
    for (const collection of [
      'coffee',
      'wings',
      'na-beers',
      'reubens',
      'blog',
    ]) {
      expect(body).not.toContain(`<loc>https://sergn.io/${collection}/</loc>`)
    }
  })

  test('feed.xml is a valid RSS channel listing every blog post', async ({
    request,
  }) => {
    const response = await request.get('/feed.xml')

    expect(response.status()).toBe(200)
    const body = await response.text()
    expect(body).toContain('<rss version="2.0"')
    expect(body).toContain('<title>sergn.io blog</title>')
    expect(body).toContain('<link>https://sergn.io/blog</link>')
    expect(body).toContain(
      '<atom:link href="https://sergn.io/feed.xml" rel="self"',
    )

    const links = [
      ...body.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g),
    ].map((match) => match[1])
    expect(links).toEqual([
      'https://sergn.io/blog/small-rituals-better-cups',
      'https://sergn.io/blog/a-table-for-two',
    ])
    for (const item of body.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      expect(
        new Date(item[1].match(/<pubDate>([^<]+)<\/pubDate>/)![1]).getTime(),
      ).not.toBeNaN()
    }
  })

  test('every page template advertises the feed for autodiscovery', async ({
    page,
  }) => {
    for (const path of ['/', '/blog', '/blog/a-table-for-two']) {
      await page.goto(path)
      await expect(
        page.locator('link[rel="alternate"][type="application/rss+xml"]'),
      ).toHaveAttribute('href', '/feed.xml')
    }
  })

  test('the retired-content page is still reachable and marked noindex', async ({
    page,
  }) => {
    await page.goto('/retired-content')

    await expect(
      page.getByRole('heading', { name: 'Syrup reviews have retired.' }),
    ).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex',
    )
  })
})

test.describe('link integrity', () => {
  // Crawls the served site the way a link checker would. The build asserts the
  // same graph over dist/client, but only a real HTTP crawl proves the host
  // actually serves those URLs (extensionless paths included) rather than
  // falling through to the 404 shell.
  test('every internal link resolves to a served page', async ({ request }) => {
    const queue = ['/']
    const visited = new Set<string>()

    while (queue.length > 0) {
      const target = queue.shift()!
      if (visited.has(target)) continue
      visited.add(target)

      const response = await request.get(target)
      expect(response.status(), `${target} should be served`).toBe(200)

      const html = await response.text()
      if (!response.headers()['content-type'].includes('text/html')) continue
      expect(
        html,
        `${target} should not fall through to the 404 page`,
      ).not.toContain('<title>404 | sergn.io</title>')

      const body = html.split('<body')[1] ?? ''
      for (const match of body.matchAll(/<a\b[^>]*\shref="([^"]*)"/g)) {
        const href = match[1]
        if (href.startsWith('#')) {
          expect(html, `${target} links to ${href}`).toContain(
            `id="${href.slice(1)}"`,
          )
          continue
        }
        if (!href.startsWith('/') || href.startsWith('//')) continue
        queue.push(href)
      }
    }

    // Guards against a crawl that silently walks nothing.
    for (const path of [
      '/coffee',
      '/wings',
      '/na-beers',
      '/reubens',
      '/blog',
      '/blog/a-table-for-two',
    ]) {
      expect([...visited]).toContain(path)
    }
  })
})
