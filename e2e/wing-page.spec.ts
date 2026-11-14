import { expect, test } from './tracker-stub'

const widths = [1280, 390]

for (const width of widths) {
  test.describe(`the wing page at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } })

    test('the Wings crumb is a link back to the list, not the current page', async ({
      page,
    }) => {
      await page.goto('/wings/corner-bar-buffalo')
      const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' })
      const wingsCrumb = breadcrumb.getByRole('link', { name: 'Wings' })

      await expect(wingsCrumb).toHaveAttribute('href', '/wings')
      await expect(wingsCrumb).not.toHaveAttribute('aria-current')
      await expect(
        breadcrumb.getByRole('listitem').filter({ hasText: 'Buffalo' }),
      ).toHaveAttribute('aria-current', 'page')
      await expect(breadcrumb.getByRole('link')).toHaveCount(1)

      await wingsCrumb.focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/wings\/?$/)
      await expect(
        page.getByRole('heading', { level: 1, name: 'Wings' }),
      ).toBeVisible()
    })

    test('the #1 wing wears the same crown as on the list, left of its grade', async ({
      page,
    }) => {
      await page.goto('/wings')
      const listCrown = await page.getByTestId('wing-crown').boundingBox()

      await page.goto('/wings/neighborhood-buffalo')
      const crown = page.getByTestId('wing-crown')
      await expect(crown).toBeVisible()
      const grade = page.getByRole('img', { name: 'Grade A+' })
      await expect(grade).toHaveText('A+')

      const pageCrown = await crown.boundingBox()
      const stamp = await grade.boundingBox()
      expect(pageCrown?.width).toBeCloseTo(listCrown?.width ?? 0, 1)
      expect(pageCrown?.height).toBeCloseTo(listCrown?.height ?? 0, 1)
      expect((pageCrown?.x ?? 0) + (pageCrown?.width ?? 0)).toBeLessThan(
        stamp?.x ?? 0,
      )
    })

    test('a wing below #1 has no crown', async ({ page }) => {
      await page.goto('/wings/corner-bar-buffalo')
      await expect(page.getByRole('img', { name: 'Grade B' })).toBeVisible()
      await expect(page.getByTestId('wing-crown')).toHaveCount(0)
    })
  })
}

test('the address links to an OpenStreetMap search', async ({ page }) => {
  await page.goto('/wings/corner-bar-buffalo')
  const map = page.getByRole('link', {
    name: '7 Corner Street, Columbus (opens a map)',
  })

  await expect(map).toHaveAttribute(
    'href',
    'https://www.openstreetmap.org/search?query=7%20Corner%20Street%2C%20Columbus',
  )
  await expect(page.getByRole('link', { name: 'The Corner Bar' })).toHaveCount(
    0,
  )
})
