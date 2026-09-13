import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { expect, test } from '@playwright/test'

// The preview server does not apply netlify.toml, so the production policy is
// read from it and injected here. That way this suite exercises the exact
// header the deployed site will send, and a policy that would break the site
// fails locally instead of after a deploy.
async function productionCsp() {
  const config = await readFile(
    path.join(process.cwd(), 'netlify.toml'),
    'utf8',
  )
  const csp = config.match(/Content-Security-Policy\s*=\s*"([^"]+)"/)?.[1]
  expect(csp, 'netlify.toml declares no Content-Security-Policy').toBeTruthy()
  // Fixture documents point at a throwaway image host that production never
  // serves; every other directive is used verbatim.
  return csp!.replace('img-src ', 'img-src https://images.unsplash.com ')
}

const templates = [
  '/',
  '/coffee',
  '/coffee/colombia-perky',
  '/blog/a-table-for-two',
  '/retired-content',
  '/not-found',
]

test.describe('Content Security Policy', () => {
  for (const template of templates) {
    test(`${template} renders and hydrates under the production CSP`, async ({
      page,
    }) => {
      const csp = await productionCsp()

      await page.route('**/*', async (route) => {
        const response = await route.fetch()
        const headers = response.headers()
        if (headers['content-type'].includes('text/html')) {
          headers['content-security-policy'] = csp
        }
        await route.fulfill({ response, headers })
      })

      const violations: string[] = []
      await page.exposeFunction('__recordCspViolation', (detail: string) => {
        violations.push(detail)
      })
      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (event) => {
          ;(
            window as unknown as {
              __recordCspViolation: (detail: string) => void
            }
          ).__recordCspViolation(
            `${event.violatedDirective} blocked ${event.blockedURI}`,
          )
        })
      })

      await page.goto(template)
      await expect(page.locator('h1')).toBeVisible()

      // The mobile menu is client-side only, so a working toggle proves the
      // inline hydration script and the module bundle both executed.
      await page.setViewportSize({ width: 480, height: 900 })
      const menuButton = page.getByRole('button', { name: 'Menu' })
      await menuButton.click()
      await expect(menuButton).toHaveAttribute('aria-expanded', 'true')

      // Fonts and stylesheets are same-origin now, but Sanity images are not;
      // make sure the policy admits everything the page actually loads.
      await page.waitForLoadState('networkidle')
      expect(violations).toEqual([])
    })
  }
})

test.describe('Analytics', () => {
  test('every page ships the GoatCounter tracker and the CSP admits it', async ({
    page,
  }) => {
    const csp = await productionCsp()
    // The tracker is loaded from one origin and beacons to another; a policy
    // that allows only the first fails silently in production, because the
    // beacon is a fire-and-forget image request nothing ever awaits.
    expect(csp).toContain('https://gc.zgo.at')
    expect(csp).toMatch(/img-src[^;]*https:\/\/sergnio\.goatcounter\.com/)

    await page.goto('/')
    const tracker = page.locator('script[src="https://gc.zgo.at/count.js"]')
    await expect(tracker).toHaveAttribute(
      'data-goatcounter',
      'https://sergnio.goatcounter.com/count',
    )
  })

  test('client-side navigation reports a pageview', async ({ page }) => {
    // count.js is blocked so the test never sends real traffic to
    // GoatCounter; the stub records what the site would have reported.
    await page.route('https://gc.zgo.at/count.js', (route) =>
      route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }),
    )
    await page.addInitScript(() => {
      const counted: string[] = []
      ;(window as unknown as { __counted: string[] }).__counted = counted
      ;(
        window as unknown as {
          goatcounter: { count: (vars: { path: string }) => void }
        }
      ).goatcounter = {
        count: (vars) => counted.push(vars.path),
      }
    })

    await page.goto('/')
    // The landing page is counted by count.js itself, so the hook must stay
    // silent until the first client-side transition.
    expect(await page.evaluate(() => (window as any).__counted)).toEqual([])

    await page.getByRole('link', { name: 'Coffee' }).first().click()
    await expect(page).toHaveURL(/\/coffee$/)
    await expect
      .poll(() => page.evaluate(() => (window as any).__counted))
      .toEqual(['/coffee'])
  })
})
