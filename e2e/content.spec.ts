import { expect, test } from '@playwright/test'

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
    await expect(
      page.locator('script[type="application/ld+json"]'),
    ).toHaveCount(0)
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
      page.getByRole('definition').filter({ hasText: '4.25 / 5' }),
    ).toBeVisible()
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

  test('wings index card shows the venue, rating, and visited date', async ({
    page,
  }) => {
    await page.goto('/wings')

    const card = page
      .locator('.content-card')
      .filter({ hasText: 'Neighborhood Buffalo Wings' })

    await expect(card.getByText('Neighborhood Tavern')).toBeVisible()
    await expect(card.getByText('4.25 / 5')).toBeVisible()
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
      page.getByRole('definition').filter({ hasText: '4 / 5' }),
    ).toBeVisible()
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
      page.getByRole('definition').filter({ hasText: '4.5 / 5' }),
    ).toBeVisible()
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
    await expect(tagList.getByText('Coffee', { exact: true })).toBeVisible()
    await expect(tagList.getByText('Rituals', { exact: true })).toBeVisible()
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
    await expect(link).toHaveAttribute('rel', 'noreferrer')
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

    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .textContent()
    const data = JSON.parse(jsonLd ?? '{}')
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

  test('home page "See all" link reaches the full collection', async ({
    page,
  }) => {
    await page.goto('/')

    await page
      .getByRole('heading', { level: 2, name: 'N/A beers' })
      .locator('../..')
      .getByRole('link', { name: 'See all' })
      .click()

    await expect(page).toHaveURL(/\/na-beers\/?$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'N/A Beers' }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Bright Lager' })).toBeVisible()
  })
})
