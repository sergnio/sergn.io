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

test('a wing page puts its photo beside the text on desktop and above the name on mobile', async ({
  page,
}) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/wings/neighborhood-buffalo')
    await page.evaluate(() => document.fonts.ready)

    const crumbs = await bounds(page.locator('.wing-crumbs'))
    const title = await bounds(page.locator('h1'))
    const photo = await bounds(page.locator('.wing-hero__photo'))

    if (width >= 896) {
      expect(photo.top).toBe(title.top)
      expect(photo.left).toBeGreaterThan(title.right)
    } else {
      expect(photo.top).toBeGreaterThan(crumbs.bottom)
      expect(title.top).toBeGreaterThan(photo.bottom)
    }
  }
})

test('embedded review images stay inside the wing text column', async ({
  page,
}) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/wings/neighborhood-buffalo')
    await page.evaluate(() => document.fonts.ready)

    const notes = await bounds(page.locator('.wing-hero__notes'))
    const photo = await bounds(page.locator('.wing-hero__photo'))
    const figures = page.locator('.wing-hero__notes figure')
    expect(await figures.count()).toBeGreaterThan(0)
    for (const figure of await figures.all()) {
      const image = await bounds(figure)
      expect(image.left).toBe(notes.left)
      expect(image.right).toBeLessThanOrEqual(notes.right)
      if (width >= 896) expect(image.right).toBeLessThan(photo.left)
      else expect(image.right).toBeLessThanOrEqual(width - 16)
    }
  }
})

test('a wing page shows the whole photo, never cropped', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/wings/neighborhood-buffalo')

  const image = page.locator('.wing-hero__photo img')
  await expect(image).toHaveJSProperty('complete', true)
  const ratios = await image.evaluate((element: HTMLImageElement) => ({
    shown: element.clientWidth / element.clientHeight,
    natural: element.naturalWidth / element.naturalHeight,
  }))
  expect(ratios.shown).toBeCloseTo(ratios.natural, 1)
})

test('a podium wing with no photo keeps the same 4:3 slot as one with a photo', async ({
  page,
}) => {
  const headingOffset = async (place: string) => {
    const card = page.getByRole('article').filter({
      has: page.getByRole('link', { name: place }),
    })
    const article = await bounds(card)
    const heading = await bounds(card.getByRole('heading'))
    return { offset: heading.top - article.top, width: article.width }
  }

  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/wings')
    await page.evaluate(() => document.fonts.ready)

    const withPhoto = await headingOffset('Eastside Smokehouse')
    const withoutPhoto = await headingOffset('The Corner Bar')
    expect(withoutPhoto.width).toBe(withPhoto.width)
    expect(withoutPhoto.offset).toBeCloseTo(withPhoto.offset, 0)
  }
})
