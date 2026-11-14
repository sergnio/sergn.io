import type { Locator } from '@playwright/test'
import { expect, test } from './tracker-stub'

// Typeface and color are the requirement here (docs/brand.md), so reading computed style is allowed.
const firstFamily = /^"?(?<family>[^",]+)/

async function familyOf(locator: Locator) {
  const fontFamily = await locator.evaluate(
    (element) => getComputedStyle(element).fontFamily,
  )
  return firstFamily.exec(fontFamily)?.groups?.family
}

/** WCAG relative luminance of every `rgb()` or `color(srgb)` in a computed style value. */
function luminances(cssValue: string) {
  return [
    ...cssValue.matchAll(
      /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)|color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/g,
    ),
  ].map((match) => {
    const [, r8, g8, b8, alpha8, r, g, b, alpha] = match as (
      string | undefined
    )[]
    const unit = r8
      ? [r8, g8, b8].map((c) => Number(c) / 255)
      : [r, g, b].map(Number)
    const [lr, lg, lb] = unit.map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    )
    return {
      luminance: 0.2126 * lr + 0.7152 * lg + 0.0722 * lb,
      alpha: alpha8 ?? alpha,
    }
  })
}

function contrast(a: number, b: number) {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

async function style(locator: Locator, property: string) {
  return locator.evaluate(
    (element, name) => getComputedStyle(element).getPropertyValue(name),
    property,
  )
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

test.describe('Brand contrast', () => {
  test('a blog card with no cover sets its label in solid white, clearing 4.5:1 across the whole fill', async ({
    page,
  }) => {
    await page.goto('/blog/')
    const label = page
      .getByRole('list', { name: 'Blog' })
      .getByRole('listitem')
      .filter({ hasText: 'A table for two' })
      .getByText('From the blog')
      .first() // the fill's label; the post's own eyebrow repeats the words below it

    const [text] = luminances(await style(label, 'color'))
    expect(text.alpha, 'the label must not be see-through').toBeUndefined()
    const fillEnds = luminances(await style(label, 'background-image'))
    expect(fillEnds.length).toBeGreaterThanOrEqual(2)
    for (const end of fillEnds) {
      expect(contrast(text.luminance, end.luminance)).toBeGreaterThanOrEqual(
        4.5,
      )
    }
  })

  test('the drumette\'s "no photo yet" caption clears 4.5:1 across its whole fill', async ({
    page,
  }) => {
    await page.goto('/wings/')
    const caption = page.getByText('No photo yet')

    const [text] = luminances(await style(caption, 'color'))
    expect(text.alpha, 'the caption must not be see-through').toBeUndefined()
    const fillEnds = luminances(
      await caption.evaluate(
        (element) => getComputedStyle(element.parentElement!).backgroundImage,
      ),
    )
    expect(fillEnds.length).toBeGreaterThanOrEqual(2)
    for (const end of fillEnds) {
      expect(contrast(text.luminance, end.luminance)).toBeGreaterThanOrEqual(
        4.5,
      )
    }
  })

  test('only the #1 wing gets the gold border, dark enough to pass even as text on its card', async ({
    page,
  }) => {
    await page.goto('/wings/')
    const first = page
      .getByRole('article')
      .filter({ hasText: 'Neighborhood Tavern' })
    const second = page
      .getByRole('article')
      .filter({ hasText: 'Eastside Smokehouse' })

    const [card] = luminances(await style(first, 'background-color'))
    const [gold] = luminances(await style(first, 'border-top-color'))
    expect(contrast(gold.luminance, card.luminance)).toBeGreaterThanOrEqual(4.5)
    expect(await style(second, 'border-top-color')).not.toBe(
      await style(first, 'border-top-color'),
    )
  })
})

test.describe('Font licenses', () => {
  for (const family of ['newsreader', 'onest', 'dm-mono']) {
    test(`serves the ${family} OFL text beside its font files`, async ({
      request,
    }) => {
      const response = await request.get(`/fonts/LICENSE-${family}.txt`)
      expect(response.status()).toBe(200)
      const license = await response.text()
      expect(license).toMatch(/^Copyright \d{4} The .+ Project Authors/)
      expect(license).toContain('SIL OPEN FONT LICENSE Version 1.1')
    })
  }

  test('does not serve a license for a family the site does not ship', async ({
    request,
  }) => {
    const response = await request.get('/fonts/LICENSE-georgia.txt')
    expect(response.status()).toBe(404)
  })
})
