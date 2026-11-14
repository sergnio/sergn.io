import { expect, test } from './tracker-stub'

// Crumb, crown, and address cases live in wing-detail.test.tsx; these need a real browser.
test('a keyboard user leaves a hydrated wing page through the Wings crumb', async ({
  page,
}) => {
  await page.goto('/wings/corner-bar-buffalo')
  await page
    .getByRole('navigation', { name: 'Breadcrumb' })
    .getByRole('link', { name: 'Wings' })
    .focus()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/wings\/?$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Wings' }),
  ).toBeVisible()
})

for (const width of [1280, 390]) {
  test(`the crown sits inside the #1 wing's grade stamp at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/wings/neighborhood-buffalo')
    const stamp = page.getByRole('img', { name: 'Grade A+, the crown pick' })
    const crown = stamp.getByTestId('wing-crown')
    await expect(crown).toBeVisible()

    const crownBox = await crown.boundingBox()
    const stampBox = await stamp.boundingBox()
    if (!crownBox || !stampBox) throw new Error('crown or stamp not laid out')
    expect(crownBox.x).toBeGreaterThan(stampBox.x)
    expect(crownBox.y).toBeGreaterThan(stampBox.y)
    expect(crownBox.x + crownBox.width).toBeLessThan(
      stampBox.x + stampBox.width,
    )
    expect(crownBox.y + crownBox.height).toBeLessThan(
      stampBox.y + stampBox.height,
    )
  })
}

test('the address opens an OpenStreetMap search in a new tab, cut off from the site', async ({
  page,
}) => {
  // Stubbed so the test never reaches the live map site.
  await page
    .context()
    .route('https://www.openstreetmap.org/**', (route) =>
      route.fulfill({ contentType: 'text/html', body: '<title>Map</title>' }),
    )
  await page.goto('/wings/corner-bar-buffalo')

  const [tab] = await Promise.all([
    page.context().waitForEvent('page'),
    page
      .getByRole('link', {
        name: '7 Corner Street, Columbus (opens a map in a new tab)',
      })
      .click(),
  ])
  await expect(tab).toHaveURL(
    'https://www.openstreetmap.org/search?query=7%20Corner%20Street%2C%20Columbus',
  )
  await expect(page).toHaveURL(/\/wings\/corner-bar-buffalo\/?$/)
  // No locator can see window.opener, the point of rel="noopener".
  expect(await tab.evaluate(() => window.opener)).toBeNull()
})
