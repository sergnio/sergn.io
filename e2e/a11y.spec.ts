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
