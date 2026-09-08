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
    await expect(
      page.getByRole('link', { name: 'Avo Coffee Roasters' }),
    ).toHaveAttribute('href', 'https://avocoffeeroasters.example.com')
    await expect(
      page.getByRole('definition').filter({ hasText: 'Colombia' }),
    ).toBeVisible()
    await expect(
      page.getByRole('definition').filter({ hasText: '$15.43' }),
    ).toBeVisible()
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
