import type { Page } from '@playwright/test'
import { expect, test } from './tracker-stub'

async function jsonLdBlocks(page: Page) {
  const blocks = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents()
  return blocks.map((block) => JSON.parse(block))
}

async function articleJsonLd(page: Page) {
  const blocks = await jsonLdBlocks(page)
  return blocks.find((block) => block['@type'] === 'Article')
}

test.describe('collection browsing flow', () => {
  test('coffee index links into a detail page with brew recipes', async ({
    page,
  }) => {
    await page.goto('/coffee')

    await page.getByRole('link', { name: 'Colombia Perky' }).first().click()

    await expect(page).toHaveURL(/\/coffee\/colombia-perky\/?$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Colombia Perky' }),
    ).toBeVisible()
    await expect(page.getByText('Avo Coffee Roasters').first()).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Morning moka pot' }),
    ).toBeVisible()
    await expect(page.getByText('18g dose · 250g water · 1:14')).toBeVisible()
    await expect(
      page.getByRole('listitem').filter({ hasText: 'Fill the base' }),
    ).toBeVisible()
    await expect(
      page.getByRole('listitem').filter({ hasText: 'Add grounds' }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Avo Coffee Roasters' }),
    ).toHaveAttribute('href', 'https://avocoffeeroasters.example.com')
    await expect(
      page.getByRole('definition').filter({ hasText: 'Colombia' }),
    ).toBeVisible()
    await expect(
      page.getByRole('definition').filter({ hasText: '$15.43' }),
    ).toBeVisible()

    await expect(page).toHaveTitle('Colombia Perky | sergn.io')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://sergn.io/coffee/colombia-perky',
    )
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Avo Coffee Roasters · Colombia · Caramel, Citrus, Balanced',
    )
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      'content',
      'website',
    )
    // A rated entry carries Review markup alongside the breadcrumb trail
    // every detail page gets.
    await expect(
      page.locator('script[type="application/ld+json"]'),
    ).toHaveCount(2)

    const heroImage = page.locator('.detail-hero__image img')
    await expect(heroImage).toHaveAttribute('loading', 'eager')
    await expect(page.locator('.detail-hero__image figcaption')).toHaveText(
      'Brewed fresh at the counter.',
    )
  })

  test('wings index links into a detail page with the review', async ({
    page,
  }) => {
    await page.goto('/wings')

    await page
      .getByRole('link', { name: 'Neighborhood Buffalo Wings' })
      .first()
      .click()

    await expect(page).toHaveURL(/\/wings\/neighborhood-buffalo-wings\/?$/)
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Neighborhood Buffalo Wings',
      }),
    ).toBeVisible()
    await expect(page.getByText('Neighborhood Tavern')).toBeVisible()
    await expect(
      page.getByRole('definition').filter({ hasText: 'Medium' }),
    ).toBeVisible()
    await expect(
      page.getByRole('definition').filter({ hasText: '10' }),
    ).toBeVisible()
    await expect(
      page.getByRole('definition').filter({ hasText: /^A\+$/ }),
    ).toBeVisible()
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Neighborhood Tavern - Buffalo',
    )
  })

  test('coffee index card shows the roaster and published date', async ({
    page,
  }) => {
    await page.goto('/coffee')

    const card = page
      .locator('.content-card')
      .filter({ hasText: 'Colombia Perky' })

    await expect(card.getByText('Avo Coffee Roasters')).toBeVisible()
    await expect(card.locator('time')).toHaveText('Jan 10, 2025')
  })

  test('coffee index card falls back to origin when roaster is unset', async ({
    page,
  }) => {
    await page.goto('/coffee')

    const card = page
      .locator('.content-card')
      .filter({ hasText: 'Ethiopia Direct Trade' })

    await expect(card.getByText('Ethiopia', { exact: true })).toBeVisible()
  })

  test('wings index card shows the venue, grade, and visited date', async ({
    page,
  }) => {
    await page.goto('/wings')

    const card = page
      .locator('.content-card')
      .filter({ hasText: 'Neighborhood Buffalo Wings' })

    await expect(card.getByText('Neighborhood Tavern')).toBeVisible()
    await expect(card.locator('.content-card__grade')).toHaveText('Grade: A+')
    await expect(card.locator('time')).toHaveText('Feb 11, 2025')
  })

  test('na-beers index links into a detail page with the notes', async ({
    page,
  }) => {
    await page.goto('/na-beers')

    await page.getByRole('link', { name: 'Bright Lager' }).first().click()

    await expect(page).toHaveURL(/\/na-beers\/bright-lager\/?$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Bright Lager' }),
    ).toBeVisible()
    await expect(page.getByText('Good Times Brewing')).toBeVisible()
    await expect(
      page.getByRole('definition').filter({ hasText: 'Lager' }),
    ).toBeVisible()
    await expect(
      page.getByRole('definition').filter({ hasText: '0.5% ABV' }),
    ).toBeVisible()
    await expect(
      page.getByRole('definition').filter({ hasText: '355 ml can' }),
    ).toBeVisible()
    await expect(
      page.getByRole('definition').filter({ hasText: /^A$/ }),
    ).toBeVisible()
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Good Times Brewing · Lager',
    )
  })

  test('reubens index links into a detail page with the order details', async ({
    page,
  }) => {
    await page.goto('/reubens')

    await page
      .getByRole('link', { name: 'The Rye House Reuben' })
      .first()
      .click()

    await expect(page).toHaveURL(/\/reubens\/the-rye-house-reuben\/?$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'The Rye House Reuben' }),
    ).toBeVisible()
    await expect(page.getByText('The Rye House', { exact: true })).toBeVisible()
    await expect(
      page.getByRole('definition').filter({ hasText: 'Corned beef' }),
    ).toBeVisible()
    await expect(
      page.getByRole('definition').filter({ hasText: 'Marbled rye' }),
    ).toBeVisible()
    await expect(
      page.getByRole('definition').filter({ hasText: /^S-$/ }),
    ).toBeVisible()
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'The Rye House',
    )
  })

  test('coffee detail page drops the roaster row and plain-texts bought-from when unset', async ({
    page,
  }) => {
    await page.goto('/coffee/ethiopia-direct-trade')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Ethiopia Direct Trade' }),
    ).toBeVisible()
    await expect(page.getByRole('term', { name: 'Roaster' })).toHaveCount(0)
    await expect(
      page.getByText('Farmer direct import', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Farmer direct import' }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('definition').filter({ hasText: '$' }),
    ).toHaveCount(0)
  })

  test('blog index card shows the excerpt and published date', async ({
    page,
  }) => {
    await page.goto('/blog')

    const card = page
      .locator('.content-card')
      .filter({ hasText: 'Small rituals, better cups' })

    await expect(
      card.getByText(
        'A few repeatable choices that make weekday coffee feel considered.',
      ),
    ).toBeVisible()
    await expect(card.locator('time')).toHaveText('Mar 21, 2025')
  })

  test('coffee index card renders the hero image with descriptive alt text', async ({
    page,
  }) => {
    await page.goto('/coffee')

    const card = page
      .locator('.content-card')
      .filter({ hasText: 'Colombia Perky' })

    const image = card.locator('img')
    await expect(image).toHaveAttribute(
      'alt',
      'A cup of dark coffee beside a coffee brewer',
    )
    await expect(image).toHaveAttribute(
      'src',
      /images\.unsplash\.com\/photo-1495474472287-4d71bcdd2085/,
    )
    await expect(card.locator('.content-card__placeholder')).toHaveCount(0)
  })

  test('blog index card shows a placeholder when a post has no cover image', async ({
    page,
  }) => {
    await page.goto('/blog')

    const card = page
      .locator('.content-card')
      .filter({ hasText: 'A table for two' })

    await expect(card.locator('.content-card__placeholder')).toHaveText(
      'From the blog',
    )
    await expect(card.locator('img')).toHaveCount(0)
  })

  test('blog index links into a full post', async ({ page }) => {
    await page.goto('/blog')

    const firstPostLink = page.getByRole('link', {
      name: 'Small rituals, better cups',
    })
    await firstPostLink.first().click()

    await expect(page).toHaveURL(/\/blog\/small-rituals-better-cups\/?$/)
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Small rituals, better cups',
      }),
    ).toBeVisible()
    const tagList = page.getByRole('list', { name: 'Tags' })
    await expect(tagList.getByText('coffee', { exact: true })).toBeVisible()
    await expect(tagList.getByText('recipes', { exact: true })).toBeVisible()
  })

  test('blog post rich text renders heading, blockquote, bullet list, number list, code mark, and inline image', async ({
    page,
  }) => {
    await page.goto('/blog/a-table-for-two')

    await expect(
      page.locator('.rich-text h2', { hasText: 'The setting' }),
    ).toBeVisible()

    await expect(
      page.locator('blockquote', {
        hasText: 'Good food does not need to be complicated.',
      }),
    ).toBeVisible()

    const bulletList = page.locator('.rich-text ul')
    await expect(bulletList.getByText('Order the rye')).toBeVisible()
    await expect(
      bulletList.getByText('Ask for the sauce on the side'),
    ).toBeVisible()

    const numberList = page.locator('.rich-text ol')
    await expect(numberList.getByText('Arrive hungry')).toBeVisible()
    await expect(numberList.getByText('Leave satisfied')).toBeVisible()

    await expect(
      page.locator('.rich-text code', { hasText: 'two' }),
    ).toBeVisible()

    const figure = page.locator('.rich-text figure.rich-text__image')
    await expect(
      figure.getByAltText('A rye sandwich cut in half on a wooden board'),
    ).toBeVisible()
    await expect(figure.locator('figcaption')).toHaveText(
      'The rye, cut and ready.',
    )
  })

  test('blog post without a cover image falls back to the site preview image', async ({
    page,
  }) => {
    await page.goto('/blog/a-table-for-two')

    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      'https://sergn.io/og-image.png',
    )
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
      'content',
      'https://sergn.io/og-image.png',
    )
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    )

    expect(await articleJsonLd(page)).not.toHaveProperty('image')
  })

  test('a link inside blog post rich text opens safely in a new tab', async ({
    page,
  }) => {
    await page.goto('/blog/small-rituals-better-cups')

    const link = page.getByRole('link', { name: 'morning ritual' })
    await expect(link).toHaveAttribute(
      'href',
      'https://example.com/morning-rituals',
    )
    await expect(link).toHaveAttribute('target', '_blank')
    // noopener is what keeps the opened page from reaching back through
    // window.opener; noreferrer alone implies it, but only in newer browsers.
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    // A new tab is a context switch a sighted reader sees in the tab strip and
    // a screen reader user otherwise does not.
    await expect(link).toHaveAccessibleName(
      'morning ritual (opens in a new tab)',
    )
  })

  test('a rich text link to this site stays in the same tab and navigates', async ({
    page,
  }) => {
    await page.goto('/blog/a-table-for-two')

    const link = page.getByRole('link', {
      name: 'paired with a familiar coffee',
    })
    await expect(link).toHaveAttribute('href', '/coffee/colombia-perky')
    expect(await link.getAttribute('target')).toBeNull()
    await expect(link).toHaveAccessibleName('paired with a familiar coffee')

    await link.click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Colombia Perky' }),
    ).toBeVisible()
  })

  test('blog post renders SEO metadata and Article JSON-LD', async ({
    page,
  }) => {
    await page.goto('/blog/small-rituals-better-cups')

    await expect(page).toHaveTitle('Small rituals, better cups | sergn.io')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://sergn.io/blog/small-rituals-better-cups',
    )
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'A few repeatable choices that make weekday coffee feel considered.',
    )
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Small rituals, better cups',
    )
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      'content',
      'article',
    )

    const data = await articleJsonLd(page)
    expect(data['@type']).toBe('Article')
    expect(data.headline).toBe('Small rituals, better cups')
    expect(data.mainEntityOfPage).toBe(
      'https://sergn.io/blog/small-rituals-better-cups',
    )
  })

  test('collection index pages render their own title, description, and canonical link', async ({
    page,
  }) => {
    await page.goto('/coffee')
    await expect(page).toHaveTitle('Coffee | sergn.io')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Coffee notes and practical brew recipes.',
    )
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://sergn.io/coffee',
    )

    await page.goto('/blog')
    await expect(page).toHaveTitle('Blog | sergn.io')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Longer notes from sergn.io.',
    )
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://sergn.io/blog',
    )

    await page.goto('/wings')
    await expect(page).toHaveTitle('Wings | sergn.io')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Wing reviews, flavor notes, and good plates.',
    )
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://sergn.io/wings',
    )

    await page.goto('/na-beers')
    await expect(page).toHaveTitle('N/A Beers | sergn.io')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'N/A beer reviews for the beers worth drinking again.',
    )
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://sergn.io/na-beers',
    )

    await page.goto('/reubens')
    await expect(page).toHaveTitle('Reubens | sergn.io')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Reuben reviews with the sandwich details that matter.',
    )
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://sergn.io/reubens',
    )
  })

  test('home page and collection indexes ship a full social preview', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'sergn.io',
    )
    await expect(
      page.locator('meta[property="og:description"]'),
    ).toHaveAttribute(
      'content',
      'Coffee, wings, N/A beers, reubens, maple syrup, and notes from Sergio.',
    )
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      'https://sergn.io/',
    )
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    )
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
      'content',
      'sergn.io',
    )

    await page.goto('/coffee')
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Coffee',
    )
    await expect(
      page.locator('meta[property="og:description"]'),
    ).toHaveAttribute('content', 'Coffee notes and practical brew recipes.')
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      'https://sergn.io/coffee',
    )
    await expect(
      page.locator('meta[name="twitter:description"]'),
    ).toHaveAttribute('content', 'Coffee notes and practical brew recipes.')
  })

  test('pages without a content image fall back to the site preview image', async ({
    page,
  }) => {
    for (const path of ['/', '/coffee', '/syrup']) {
      await page.goto(path)
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        'content',
        'https://sergn.io/og-image.png',
      )
      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
        'content',
        'https://sergn.io/og-image.png',
      )
      await expect(
        page.locator('meta[property="og:image:alt"]'),
      ).not.toHaveAttribute('content', '')
    }

    // The fallback is only a preview if the file is really served.
    const response = await page.request.get('/og-image.png')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('image/png')
  })

  test('every page template ships the home-screen install surface', async ({
    page,
  }) => {
    for (const path of ['/', '/coffee', '/coffee/colombia-perky']) {
      await page.goto(path)
      await expect(
        page.locator('link[rel="apple-touch-icon"]'),
      ).toHaveAttribute('href', '/apple-touch-icon.png')
      await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
        'href',
        '/site.webmanifest',
      )
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
        'content',
        '#30272d',
      )
    }
  })

  test('the manifest and its icons are really served', async ({ page }) => {
    const manifestResponse = await page.request.get('/site.webmanifest')
    expect(manifestResponse.status()).toBe(200)

    const manifest = await manifestResponse.json()
    expect(manifest.start_url).toBe('/')
    expect(manifest.theme_color).toBe('#30272d')

    const sources = [
      '/apple-touch-icon.png',
      ...manifest.icons.map((icon: { src: string }) => icon.src),
    ]
    for (const source of sources) {
      const response = await page.request.get(source)
      expect(response.status(), source).toBe(200)
      expect(response.headers()['content-type'], source).toContain('image/png')
    }
  })

  test('a detail page prefers its own image over the site fallback', async ({
    page,
  }) => {
    await page.goto('/coffee')
    await page.getByRole('link', { name: 'Colombia Perky' }).click()

    const ogImage = page.locator('meta[property="og:image"]')
    await expect(ogImage).not.toHaveAttribute(
      'content',
      'https://sergn.io/og-image.png',
    )
    await expect(ogImage).toHaveAttribute('content', /^https:\/\//)
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    )
  })

  test('home page index reaches the full collection', async ({ page }) => {
    await page.goto('/')

    await page
      .getByRole('navigation', { name: 'Sections' })
      .getByRole('link', { name: 'N/A beers', exact: true })
      .click()

    await expect(page).toHaveURL(/\/na-beers\/?$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'N/A Beers' }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Bright Lager' })).toBeVisible()
  })
})

test.describe('ranked collections', () => {
  const rankedOrder = [
    'Neighborhood Buffalo Wings',
    'Smokehouse Dry Rub Wings',
    'Corner Bar Honey Hot',
    'Arena Concession Wings',
  ]

  test('wings reads best to worst, top to bottom, on mobile and desktop', async ({
    page,
  }) => {
    // The podium sits three across once there is room for it, so on desktop
    // the top three share a line. Everything else about the order holds at
    // both sizes: reading order is rank order, and no entry ever renders
    // above one that outranks it.
    for (const viewport of [
      { width: 390, height: 844, podiumAcross: false },
      { width: 1280, height: 900, podiumAcross: true },
    ]) {
      await page.setViewportSize(viewport)
      await page.goto('/wings')

      const entries = page.locator('.ranked-list > li')
      await expect(entries).toHaveCount(rankedOrder.length)

      const tops = await entries.evaluateAll((items) =>
        items.map((item) => item.getBoundingClientRect().top),
      )
      const headings = await entries
        .locator('h3')
        .evaluateAll((items) => items.map((item) => item.textContent.trim()))

      const at = `at ${viewport.width}px`
      expect(headings, at).toEqual(rankedOrder)

      for (let index = 1; index < tops.length; index++) {
        const sharesThePodiumLine = viewport.podiumAcross && index < 3
        if (sharesThePodiumLine) {
          expect(tops[index], at).toBe(tops[index - 1])
        } else {
          expect(tops[index], at).toBeGreaterThan(tops[index - 1])
        }
      }
    }
  })

  test('every entry shows its rank, numbered straight through the list', async ({
    page,
  }) => {
    await page.goto('/wings')

    const badges = await page
      .locator('.content-card__rank, .ranked-row__rank')
      .allTextContents()

    expect(badges).toEqual(['#1', '#2', '#3', '#4'])
    await expect(page.locator('.ranked-list__podium')).toHaveCount(3)
    await expect(page.locator('.ranked-list__row')).toHaveCount(1)
  })

  test('the ranking a crawler reads matches the one on the page', async ({
    page,
  }) => {
    await page.goto('/wings')

    const list = (await jsonLdBlocks(page)).find(
      (block) => block['@type'] === 'ItemList',
    )

    expect(list).toMatchObject({
      name: 'Wings',
      url: 'https://sergn.io/wings',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: rankedOrder.length,
    })
    expect(
      list.itemListElement.map(
        (item: { position: number; name: string }) => item.name,
      ),
    ).toEqual(rankedOrder)
    expect(
      list.itemListElement.map((item: { position: number }) => item.position),
    ).toEqual([1, 2, 3, 4])
  })

  test('every point on an entry, card or row, opens that entry', async ({
    page,
  }) => {
    // Hit-testing only sees what is in the viewport, so give the whole
    // ranking room rather than probing it a scroll position at a time.
    await page.setViewportSize({ width: 1280, height: 2000 })
    await page.goto('/wings')

    const entries = page.locator('.ranked-list > li')
    const misses = await entries.evaluateAll((items) =>
      items.flatMap((item) => {
        const box = item.getBoundingClientRect()
        const href = item.querySelector('h3 a')?.getAttribute('href')
        const fractions = [0.05, 0.25, 0.5, 0.75, 0.95]

        return fractions.flatMap((x) =>
          fractions
            .map((y) => ({
              x: box.left + box.width * x,
              y: box.top + box.height * y,
            }))
            .filter((point) => {
              const hit = document.elementFromPoint(point.x, point.y)
              return hit?.closest('a')?.getAttribute('href') !== href
            })
            .map(
              (point) =>
                `${href} at ${Math.round(point.x)},${Math.round(point.y)}`,
            ),
        )
      }),
    )
    expect(misses).toEqual([])

    // The row past the podium is the one that used to need its title: click
    // its date, the furthest thing on it from the link text.
    const row = page.locator('.ranked-list__row').first()
    const date = (await row.locator('time').boundingBox())!
    await page.mouse.click(date.x + date.width / 2, date.y + date.height / 2)
    await expect(page).toHaveURL(/\/wings\/arena-concession-wings\/?$/)
  })

  test('the blog is not a ranking, so it ships no ItemList and no ranks', async ({
    page,
  }) => {
    await page.goto('/blog')

    const types = (await jsonLdBlocks(page)).map((block) => block['@type'])
    expect(types).not.toContain('ItemList')
    await expect(page.locator('.ranked-list')).toHaveCount(0)
    await expect(page.locator('.content-card__rank')).toHaveCount(0)
  })
})

test.describe('structured data', () => {
  test('home page identifies the site and its owner', async ({ page }) => {
    await page.goto('/')

    const graph = (await jsonLdBlocks(page)).flatMap(
      (block) => block['@graph'] ?? [block],
    )
    const website = graph.find((node) => node['@type'] === 'WebSite')
    expect(website).toMatchObject({
      name: 'sergn.io',
      url: 'https://sergn.io',
      publisher: { '@id': 'https://sergn.io/#person' },
    })
    expect(graph).toContainEqual(
      expect.objectContaining({ '@type': 'Person', name: 'Sergio' }),
    )
  })

  test('a review detail page carries its grade and breadcrumb trail', async ({
    page,
  }) => {
    await page.goto('/wings/neighborhood-buffalo-wings')

    const blocks = await jsonLdBlocks(page)
    expect(blocks.find((block) => block['@type'] === 'Review')).toMatchObject({
      itemReviewed: { '@type': 'Restaurant', name: 'Neighborhood Tavern' },
      reviewRating: { ratingValue: 4.3, bestRating: 5, worstRating: 1 },
      url: 'https://sergn.io/wings/neighborhood-buffalo-wings',
    })
    expect(
      blocks.find((block) => block['@type'] === 'BreadcrumbList')
        ?.itemListElement,
    ).toEqual([
      expect.objectContaining({ position: 1, item: 'https://sergn.io/' }),
      expect.objectContaining({
        position: 2,
        name: 'Wings',
        item: 'https://sergn.io/wings',
      }),
      expect.objectContaining({
        position: 3,
        name: 'Neighborhood Buffalo Wings',
        item: 'https://sergn.io/wings/neighborhood-buffalo-wings',
      }),
    ])
  })

  test('a blog post keeps its Article markup alongside a breadcrumb', async ({
    page,
  }) => {
    await page.goto('/blog/small-rituals-better-cups')

    const types = (await jsonLdBlocks(page)).map((block) => block['@type'])
    expect(types).toEqual(expect.arrayContaining(['BreadcrumbList', 'Article']))
  })

  test('an unrated entry ships a breadcrumb but no Review markup', async ({
    page,
  }) => {
    await page.goto('/coffee/ethiopia-direct-trade')

    const types = (await jsonLdBlocks(page)).map((block) => block['@type'])
    expect(types).toEqual(['BreadcrumbList'])
  })

  test('a rated coffee entry is marked up as a review of a product', async ({
    page,
  }) => {
    await page.goto('/coffee/colombia-perky')

    const blocks = await jsonLdBlocks(page)
    expect(blocks.find((block) => block['@type'] === 'Review')).toMatchObject({
      itemReviewed: {
        '@type': 'Product',
        name: 'Colombia Perky',
        brand: { '@type': 'Brand', name: 'Avo Coffee Roasters' },
      },
      reviewRating: { ratingValue: 4.8, bestRating: 5, worstRating: 1 },
      url: 'https://sergn.io/coffee/colombia-perky',
    })
  })
})
