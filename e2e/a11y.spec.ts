import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// One representative page per template: home, a collection index, a detail
// page with a hero image, a rich-text-heavy blog post, and the static pages.
const pages = [
  '/',
  '/coffee',
  '/coffee/colombia-perky',
  '/blog/a-table-for-two',
  '/retired-content',
  '/not-found',
]

test.describe('accessibility', () => {
  for (const path of pages) {
    test(`${path} has no detectable WCAG 2.2 A/AA violations`, async ({
      page,
    }) => {
      await page.goto(path)

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()

      expect(results.violations).toEqual([])
    })
  }

  test('every page exposes the same landmark and heading skeleton', async ({
    page,
  }) => {
    for (const path of pages) {
      await page.goto(path)

      await expect(page.getByRole('banner')).toBeVisible()
      await expect(page.getByRole('main')).toBeVisible()
      await expect(page.getByRole('contentinfo')).toBeVisible()
      await expect(
        page.getByRole('navigation', { name: 'Primary navigation' }),
      ).toBeVisible()
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    }
  })

  test('skip link is the first tab stop and moves focus into main', async ({
    page,
  }) => {
    await page.goto('/')

    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: 'Skip to content' })
    await expect(skipLink).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#main-content$/)
    await expect(page.locator('#main-content')).toBeFocused()
  })
})

// Semantics that axe's WCAG ruleset does not flag but a screen-reader user
// relies on: a card grid announced as a list with a count, an unambiguous
// accessible name on every repeated link, and terse visual meta ("4.25 / 5")
// that still carries its label when read out of visual context.
test.describe('screen-reader semantics', () => {
  test('collection cards are exposed as a labelled list', async ({ page }) => {
    await page.goto('/coffee')

    const list = page.getByRole('list', { name: 'Coffee' })
    await expect(list).toBeVisible()
    await expect(list.getByRole('listitem')).toHaveCount(2)
    await expect(
      page.getByRole('heading', { level: 2, name: 'Colombia Perky' }),
    ).toBeVisible()
  })

  test('home page highlight links are individually named', async ({ page }) => {
    await page.goto('/')

    for (const name of [
      'See all coffee',
      'See all wings',
      'See all n/a beers',
      'See all reubens',
    ]) {
      await expect(page.getByRole('link', { name, exact: true })).toHaveCount(1)
    }
  })

  test('ratings and dates are readable out of context', async ({ page }) => {
    await page.goto('/wings')

    const card = page
      .getByRole('list', { name: 'Wings' })
      .getByRole('listitem')
      .first()
    await expect(card.locator('.content-card__rating')).toHaveText(/Rating: \d/)
    await expect(card.locator('time')).toHaveAttribute(
      'datetime',
      /^\d{4}-\d{2}-\d{2}/,
    )
  })
})
