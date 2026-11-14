import type { Locator } from '@playwright/test'
import { expect, test } from './tracker-stub'

// The typeface is the requirement here (docs/brand.md), so reading computed style is allowed.
const firstFamily = /^"?(?<family>[^",]+)/

async function familyOf(locator: Locator) {
  const fontFamily = await locator.evaluate(
    (element) => getComputedStyle(element).fontFamily,
  )
  return firstFamily.exec(fontFamily)?.groups?.family
}

test.describe('Brand typefaces', () => {
  test('a ranked card names its maker in the sans, not the reading serif', async ({
    page,
  }) => {
    await page.goto('/coffee/')
    const ranking = page.getByRole('list', {
      name: 'Coffee, ranked best to worst',
    })

    const maker = ranking.getByText('Avo Coffee Roasters', { exact: true })
    expect(await familyOf(maker)).toBe('Onest')
    await expect
      .poll(() =>
        page.evaluate(() =>
          [...document.fonts].some(
            (face) => face.family === 'Onest' && face.status === 'loaded',
          ),
        ),
      )
      .toBe(true)
  })

  test('a blog card keeps its excerpt in the reading serif', async ({
    page,
  }) => {
    await page.goto('/blog/')
    const posts = page.getByRole('list', { name: 'Blog' })

    const excerpt = posts.getByText(
      'A few repeatable choices that make weekday coffee feel considered.',
    )
    expect(await familyOf(excerpt)).toBe('Newsreader')
  })

  test('headlines are the 650 serif and the eyebrow above stays mono', async ({
    page,
  }) => {
    await page.goto('/blog/small-rituals-better-cups/')

    const headline = page.getByRole('heading', { level: 1 })
    await expect(headline).toHaveCSS('font-weight', '650')
    expect(await familyOf(headline)).toBe('Newsreader')
    expect(await familyOf(page.getByText('From the blog'))).toBe('DM Mono')
  })
})
