import type { Locator, Page } from '@playwright/test'
import { awaitClientRouter } from './client-router'
import { expect, test } from './tracker-stub'

// Fixture images point at Unsplash; serve them locally, as slow as asked.
async function servePhotosAfter(page: Page, delayMs: number) {
  await page.route('https://images.unsplash.com/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    await route.fulfill({ path: 'public/icon-192.png' }).catch(() => undefined)
  })
}

// Read once, not retried: the question is whether it is painted at the swap.
const isPainted = (photo: Locator) =>
  photo.evaluate(
    (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
  )

async function openWingsFromHome(page: Page) {
  await page.goto('/')
  await awaitClientRouter(page)
  await page
    .getByRole('navigation', { name: 'Sections' })
    .getByRole('link', { name: 'Wings', exact: true })
    .click()
}

test.describe('moving between pages', () => {
  test('a page loads its data once per visit to the site, however often a reader returns', async ({
    page,
  }) => {
    await servePhotosAfter(page, 0)
    const dataRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/__tsr/staticServerFnCache/')) {
        dataRequests.push(request.url())
      }
    })

    await openWingsFromHome(page)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Wings')
    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
    await page.goForward()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Wings')
    await page.goBack()
    await page
      .getByRole('navigation', { name: 'Sections' })
      .getByRole('link', { name: 'Wings', exact: true })
      .click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Wings')
    expect(dataRequests).toHaveLength(1)

    await page
      .getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('link', { name: 'Coffee' })
      .click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Coffee')
    expect(dataRequests).toHaveLength(2)
  })

  test('a list page appears with its top photo already painted', async ({
    page,
  }) => {
    await servePhotosAfter(page, 250)

    await openWingsFromHome(page)

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Wings')
    const topPhoto = page.getByRole('main').getByRole('img').first()
    expect(await isPainted(topPhoto)).toBe(true)
  })

  test('a photo slower than the wait budget does not hold the page back', async ({
    page,
  }) => {
    await servePhotosAfter(page, 10_000)

    await openWingsFromHome(page)

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Wings', {
      timeout: 2_000,
    })
    const topPhoto = page.getByRole('main').getByRole('img').first()
    expect(await isPainted(topPhoto)).toBe(false)
  })
})
