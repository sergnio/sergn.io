import type { Locator, Page } from '@playwright/test'
import { awaitClientRouter } from './client-router'
import { expect, test } from './tracker-stub'

const onePixelGif = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
)

const viewports = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 800 },
]

const lists = [
  { path: '/wings', item: 'Downtown Arena' },
  { path: '/coffee', item: 'Grocery Store House Blend' },
  { path: '/syrup', item: 'Hamel' },
  { path: '/reubens', item: 'Pub Grill Reuben' },
  { path: '/na-beers', item: 'Flat Tonic Brew' },
  { path: '/blog', item: 'A table for two' },
]

/** Scrolls to the end of the list and returns where the item settles on screen. */
async function scrollToEnd(page: Page, item: Locator) {
  await page.mouse.move(100, 400)
  await page.mouse.wheel(0, 5000)
  await expect.poll(() => scrollTop(page)).toBeGreaterThan(0)
  let previous: number | undefined
  await expect
    .poll(async () => {
      const current = await onScreenAt(item)()
      const settled = current === previous
      previous = current
      return settled
    })
    .toBe(true)
  return previous!
}

// The scroll position is the requirement itself, so it is read directly.
const scrollTop = (page: Page) => page.evaluate(() => window.scrollY)

const onScreenAt = (item: Locator) => async () => (await item.boundingBox())?.y

const breadcrumbLink = (page: Page) =>
  page
    .getByRole('navigation', { name: 'Breadcrumb' })
    .getByRole('link', { name: 'Wings' })

for (const viewport of viewports) {
  test.describe(`going back to a list on ${viewport.name}`, () => {
    test.use({ viewport })

    // Fixture photos are remote and resize cards as they land; serve them locally.
    test.beforeEach(async ({ page }) => {
      await page.route('https://images.unsplash.com/**', (route) =>
        route.fulfill({ contentType: 'image/gif', body: onePixelGif }),
      )
    })

    for (const { path, item } of lists) {
      test(`Back from an item keeps the place in ${path}`, async ({ page }) => {
        await page.goto(path)
        await awaitClientRouter(page)
        const link = page.getByRole('link', { name: item, exact: true })
        const spot = await scrollToEnd(page, link)

        await link.click()
        await expect(page).not.toHaveURL(new RegExp(`${path}$`))
        await page.goBack()

        await expect(page).toHaveURL(new RegExp(`${path}$`))
        await expect.poll(onScreenAt(link)).toBeCloseTo(spot, 0)
      })
    }

    test('the Wings breadcrumb returns to the same spot without a loop', async ({
      page,
    }) => {
      await page.goto('/')
      await awaitClientRouter(page)
      await page
        .getByRole('navigation', { name: 'Sections' })
        .getByRole('link', { name: 'Wings' })
        .click()
      await expect(
        page.getByRole('heading', { level: 1, name: 'Wings' }),
      ).toBeVisible()
      const link = page.getByRole('link', { name: 'Downtown Arena' })
      const spot = await scrollToEnd(page, link)

      await link.click()
      await breadcrumbLink(page).click()

      await expect(page).toHaveURL(/\/wings$/)
      await expect.poll(onScreenAt(link)).toBeCloseTo(spot, 0)

      await page.goBack()
      await expect(page).toHaveURL(/\/$/)
    })

    test('the Wings breadcrumb on a wing opened directly starts the list at the top', async ({
      page,
    }) => {
      await page.goto('/wings/arena-concession-wings')
      await awaitClientRouter(page)

      await breadcrumbLink(page).click()

      await expect(page).toHaveURL(/\/wings$/)
      await expect(
        page.getByRole('heading', { level: 1, name: 'Wings' }),
      ).toBeInViewport()
      expect(await scrollTop(page)).toBe(0)

      await page.goBack()
      await expect(page).toHaveURL(/\/wings\/arena-concession-wings$/)
    })
  })
}
