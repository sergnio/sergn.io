import type { Locator } from '@playwright/test'
import { expect, test } from './tracker-stub'

async function bounds(locator: Locator) {
  await expect(locator).toBeVisible()
  return locator.evaluate((element) => {
    const { top, right, bottom, left, width } = element.getBoundingClientRect()
    return { top, right, bottom, left, width }
  })
}

const reviews = [
  '/coffee/colombia-perky',
  '/wings/neighborhood-buffalo-wings',
  '/na-beers/bright-lager',
  '/reubens/the-rye-house-reuben',
  '/syrup/sweet-ontario',
]

for (const path of reviews) {
  test(`${path} leads with the review and photo, with facts below both`, async ({
    page,
  }) => {
    for (const width of [390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(path)
      await page.evaluate(() => document.fonts.ready)

      const heading = await bounds(page.locator('.detail-hero__copy'))
      const image = await bounds(page.locator('.detail-hero__image'))
      const notes = await bounds(page.locator('.detail-hero__notes'))
      const facts = await bounds(page.locator('.facts'))
      const titleSize = await page
        .locator('h1')
        .evaluate((element) => parseFloat(getComputedStyle(element).fontSize))

      expect(titleSize).toBeLessThanOrEqual(48)
      expect(notes.top).toBeGreaterThan(heading.bottom)
      expect(facts.top).toBeGreaterThan(Math.max(notes.bottom, image.bottom))
      expect(facts.left).toBe(heading.left)

      if (width >= 896) {
        expect(heading.top).toBe(image.top)
        expect(notes.left).toBe(heading.left)
        expect(notes.right).toBeLessThan(image.left)
        expect(notes.top - heading.bottom).toBeLessThanOrEqual(32)
        expect(facts.right).toBe(image.right)
      } else {
        expect(image.top).toBeGreaterThan(heading.bottom)
        expect(notes.top).toBeGreaterThan(image.bottom)
        expect(image.left).toBe(heading.left)
      }
    }
  })
}

test('a review without a hero keeps a single reading column above the facts', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/coffee/ethiopia-direct-trade')
  await page.evaluate(() => document.fonts.ready)

  await expect(page.locator('.detail-hero__image')).toHaveCount(0)
  const heading = await bounds(page.locator('.detail-hero__copy'))
  const notes = await bounds(page.locator('.detail-hero__notes'))
  const facts = await bounds(page.locator('.facts'))

  expect(notes.top).toBeGreaterThan(heading.bottom)
  expect(notes.left).toBe(heading.left)
  expect(notes.width).toBe(heading.width)
  expect(notes.width).toBeLessThanOrEqual(768)
  expect(facts.top).toBeGreaterThan(notes.bottom)
})

test('long review notes and embedded images stay beside the hero and above the facts', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/wings/neighborhood-buffalo-wings')
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => {
    const notes = document.querySelector('.detail-hero__notes .rich-text')!
    const paragraph = notes.querySelector('p')!
    for (let index = 0; index < 8; index++) {
      notes.append(paragraph.cloneNode(true))
    }
    for (const display of ['wide', 'full']) {
      const figure = document
        .querySelector('.detail-hero__image')!
        .cloneNode(true) as HTMLElement
      figure.className = `rich-text__image rich-text__image--${display}`
      notes.append(figure)
    }
  })

  // A cloned image refetches before it takes up any height, so the column is
  // still growing at the moment the mutation returns.
  await page.evaluate(async () => {
    await Promise.all(
      Array.from(document.images)
        .filter((image) => !image.complete)
        .map((image) => image.decode().catch(() => undefined)),
    )
  })

  const hero = await bounds(page.locator('.detail-hero__image'))
  const notes = await bounds(page.locator('.detail-hero__notes'))
  const facts = await bounds(page.locator('.facts'))
  expect(notes.bottom).toBeGreaterThan(hero.bottom)
  expect(facts.top).toBeGreaterThan(notes.bottom)

  for (const figure of await page.locator('.detail-hero__notes figure').all()) {
    const image = await bounds(figure)
    expect(image.left).toBe(notes.left)
    expect(image.right).toBeLessThan(hero.left)
  }
})
