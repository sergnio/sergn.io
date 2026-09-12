import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
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

/*
 * WCAG 2.2 success criteria that axe cannot detect. axe reports target size
 * only as an "incomplete" result it asks a human to judge, and it has no
 * concept of reflow or text resizing at all, so the axe pass above is green
 * on pages that fail all three. These check the rendered geometry instead.
 */
test.describe('WCAG 2.2 geometry', () => {
  /**
   * Every control that is not exempt, with its rendered box. SC 2.5.8 exempts
   * a target that sits "in a sentence or block of text", so a link is skipped
   * when its containing block holds text the link itself does not - that is
   * the authored prose case, where padding a link out to 24px would collide
   * with the line above it.
   */
  const undersizedTargets = (page: Page) =>
    page.evaluate(() => {
      const inlineInText = (element: Element) => {
        const block = element.closest('p, li, dd, blockquote, figcaption')
        if (!block) return false
        const own = element.textContent.trim()
        const around = block.textContent.trim()
        return around.length > own.length
      }

      return [
        ...document.querySelectorAll<HTMLElement>(
          'a[href], button, input, select, textarea, [role="button"]',
        ),
      ]
        .filter((element) => {
          const { width, height } = element.getBoundingClientRect()
          if (width === 0 && height === 0) return false
          if (width >= 24 && height >= 24) return false
          return !inlineInText(element)
        })
        .map((element) => {
          const { width, height } = element.getBoundingClientRect()
          const label = element.textContent.trim().slice(0, 40)
          return `${element.tagName.toLowerCase()} "${label}" is ${Math.round(width)}x${Math.round(height)}`
        })
    })

  for (const viewport of [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'desktop', width: 1280, height: 1024 },
  ]) {
    test(`every control meets the 24px target minimum on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })

      for (const path of pages) {
        await page.goto(path)
        expect(await undersizedTargets(page), path).toEqual([])
      }
    })
  }

  /**
   * SC 1.4.10 Reflow: 320 CSS px wide with no horizontal scrolling. Checking
   * the document's scroll width alone misses an element that overflows into a
   * clipped ancestor, so every rendered box is checked against the viewport
   * too. Fixed-position chrome is exempt because it does not scroll.
   */
  test('nothing overflows horizontally at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })

    for (const path of pages) {
      await page.goto(path)

      const result = await page.evaluate(() => {
        const overflowing = [
          ...document.querySelectorAll<HTMLElement>('body *'),
        ].filter((element) => {
          const box = element.getBoundingClientRect()
          if (box.width === 0) return false
          const style = getComputedStyle(element)
          if (style.position === 'fixed' || style.visibility === 'hidden') {
            return false
          }
          return box.right > window.innerWidth + 1 || box.left < -1
        })

        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          overflowing: overflowing.map(
            (element) =>
              `${element.tagName.toLowerCase()}.${element.className || '(none)'}`,
          ),
        }
      })

      expect(result.overflowing, path).toEqual([])
      expect(result.scrollWidth, path).toBeLessThanOrEqual(result.clientWidth)
    }
  })

  /**
   * SC 1.4.4 Resize Text: doubling the root font size must not lose content or
   * force horizontal scrolling. This is the text-only case, which is stricter
   * than page zoom and is what the site's rem-based type scale has to survive.
   */
  test('doubling the root font size loses no content', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 })

    for (const path of pages) {
      await page.goto(path)
      await page.addStyleTag({ content: 'html { font-size: 32px !important }' })

      const result = await page.evaluate(() => ({
        rootFontSize: getComputedStyle(document.documentElement).fontSize,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))

      expect(result.rootFontSize, path).toBe('32px')
      expect(result.scrollWidth, path).toBeLessThanOrEqual(result.clientWidth)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByRole('navigation').first()).toBeVisible()
    }
  })
})
