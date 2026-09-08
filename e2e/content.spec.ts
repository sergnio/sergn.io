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
