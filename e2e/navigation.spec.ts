import { expect, test } from '@playwright/test'

test.describe('primary navigation', () => {
  test('home page renders hero and latest highlights', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', {
        name: 'Notes on good food, good drinks, and the places that make them.',
      }),
    ).toBeVisible()

    await expect(
      page.getByRole('heading', { level: 2, name: 'Coffee' }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Ethiopia Direct Trade' }),
    ).toBeVisible()

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://sergn.io/',
    )
  })

  test('home page shows only the single most recently published document per collection', async ({
    page,
  }) => {
    await page.goto('/')

    const coffeeSection = page.locator('section', {
      has: page.getByRole('heading', { level: 2, name: 'Coffee' }),
    })
    await expect(
      coffeeSection.getByRole('link', { name: 'Ethiopia Direct Trade' }),
    ).toBeVisible()
    await expect(
      coffeeSection.getByRole('link', { name: 'Colombia Perky' }),
    ).toHaveCount(0)
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
