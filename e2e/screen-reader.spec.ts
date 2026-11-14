import type { Locator } from '@playwright/test'
import { expect, test } from './tracker-stub'

/**
 * The "3 of 4" a screen reader says on a list item. ARIA snapshots leave out
 * list positions, so read aria-posinset/setsize and fall back to DOM order.
 */
async function announcedPositions(list: Locator) {
  const items = await list.getByRole('listitem').all()
  return Promise.all(
    items.map(async (item, index) => {
      const name = await item.getByRole('heading').innerText()
      const position = (await item.getAttribute('aria-posinset')) ?? index + 1
      const size = (await item.getAttribute('aria-setsize')) ?? items.length
      return `${name}: ${position} of ${size}`
    }),
  )
}

const onePixelGif = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
)

test.describe('what screen readers announce', () => {
  test.beforeEach(async ({ page }) => {
    // Fixture images point at Unsplash; serve them locally so loads stay offline.
    await page.route('https://images.unsplash.com/**', (route) =>
      route.fulfill({ contentType: 'image/gif', body: onePixelGif }),
    )
  })

  test.describe('/wings', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/wings')
    })

    test('each wing is announced at its rank, even when the podium spans two tiers', async ({
      page,
    }) => {
      const tier = (letter: string) =>
        page.getByRole('region', { name: `Grade ${letter}` }).getByRole('list')

      expect([
        ...(await announcedPositions(tier('A'))),
        ...(await announcedPositions(tier('B'))),
        ...(await announcedPositions(tier('C'))),
      ]).toEqual([
        'Neighborhood Tavern: 1 of 4',
        'Eastside Smokehouse: 2 of 4',
        'The Corner Bar: 3 of 4',
        'Downtown Arena: 4 of 4',
      ])
    })

    test('tiers are headed regions and grades read as one phrase', async ({
      page,
    }) => {
      await expect(page.getByRole('main')).toMatchAriaSnapshot(`
        - heading "Wings" [level=1]
        - region "Grade A":
          - heading "Grade A" [level=2]
          - list:
            - listitem:
              - article:
                - text: "Grade: A+"
                - heading "Neighborhood Tavern" [level=3]:
                  - link "Neighborhood Tavern"
            - listitem:
              - article:
                - text: "Grade: A"
                - heading "Eastside Smokehouse" [level=3]
        - region "Grade B":
          - heading "Grade B" [level=2]
          - list:
            - listitem:
              - article:
                - text: "/Grade: B$/"
                - heading "The Corner Bar" [level=3]
        - region "Grade C":
          - heading "Grade C" [level=2]
          - list:
            - listitem:
              - heading "Downtown Arena" [level=3]
              - text: "Grade: C"
      `)
    })

    test('the non-buffalo asterisk is a labelled link to its footnote', async ({
      page,
    }) => {
      const eastside = page.getByRole('listitem').filter({
        has: page.getByRole('link', { name: 'Eastside Smokehouse' }),
      })

      await expect(eastside).toMatchAriaSnapshot(`
        - paragraph:
          - text: Dry rub
          - link "Not buffalo, see footnote":
            - /url: "#footnote-non-buffalo"
      `)
      await expect(
        page.getByRole('link', { name: 'Not buffalo, see footnote' }),
      ).toHaveCount(1)
    })
  })

  const collections = [
    {
      path: '/coffee',
      title: 'Coffee',
      ranked: ['Colombia Perky', 'Sumatra Long Night', 'Ethiopia Direct Trade'],
      topGrade: 'S',
      notRecommended: 'Grocery Store House Blend',
    },
    {
      path: '/reubens',
      title: 'Reubens',
      ranked: [
        'The Rye House Reuben',
        'Deli Counter Reuben',
        'Diner Classic Reuben',
      ],
      topGrade: 'S-',
      notRecommended: 'Pub Grill Reuben',
    },
    {
      path: '/syrup',
      title: 'Maple syrup',
      ranked: ['Sweet Ontario', 'Skluzaceks', 'Hidden Springs', 'Wild Country'],
      topGrade: '👑',
      notRecommended: 'Airport Gift Shop Syrup',
    },
    {
      path: '/na-beers',
      title: 'N/A Beers',
      ranked: ['Bright Lager', 'Hazy Zero IPA', 'Dark Roast Stout'],
      topGrade: 'A',
      notRecommended: 'Flat Tonic Brew',
    },
  ]

  for (const { path, title, ranked, topGrade, notRecommended } of collections) {
    test(`${path} announces a named ranking, best first, apart from the not recommended`, async ({
      page,
    }) => {
      await page.goto(path)
      const main = page.getByRole('main')
      const ranking = main.getByRole('list', {
        name: `${title}, ranked best to worst`,
      })

      expect(await announcedPositions(ranking)).toEqual(
        ranked.map(
          (name, index) => `${name}: ${index + 1} of ${ranked.length}`,
        ),
      )
      await expect(main).toMatchAriaSnapshot(`
        - heading "${title}" [level=1]
        - region "Recommended":
          - heading "Recommended" [level=2]
          - list "${title}, ranked best to worst":
            - listitem:
              - article:
                - heading "${ranked[0]}" [level=3]:
                  - link "${ranked[0]}"
                - text: "Grade: ${topGrade}"
        - region "Not recommended":
          - heading "Not recommended" [level=2]
          - list "${title}, not recommended":
            - listitem:
              - article:
                - heading "${notRecommended}" [level=3]
      `)
    })
  }

  test('/blog announces a named list of posts', async ({ page }) => {
    await page.goto('/blog')

    await expect(page.getByRole('main')).toMatchAriaSnapshot(`
      - heading "Blog" [level=1]
      - list "Blog":
        - listitem:
          - article:
            - heading "Small rituals, better cups" [level=2]:
              - link "Small rituals, better cups"
        - listitem:
          - article:
            - heading "A table for two" [level=2]:
              - link "A table for two"
    `)
  })

  test('a detail page announces its title, details, and recipes in order', async ({
    page,
  }) => {
    await page.goto('/coffee/colombia-perky')

    await expect(page.getByRole('main')).toMatchAriaSnapshot(`
      - article:
        - heading "Colombia Perky" [level=1]
        - figure "Brewed fresh at the counter.":
          - img "A cup of dark coffee beside a coffee brewer"
        - term: Roaster
        - definition: Avo Coffee Roasters
        - term: Grade
        - definition: S
        - region "Brew recipes":
          - heading "Brew recipes" [level=2]
          - article:
            - heading "Cappuccino" [level=3]
          - article:
            - heading "Morning moka pot" [level=3]
            - list:
              - listitem: Fill the base with hot water
              - listitem: Add grounds, tamp lightly
    `)
  })
})
