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

      // Fonts and stylesheets are cross-origin; make sure the policy admits
      // them rather than silently downgrading the page to system fonts.
      await page.waitForLoadState('networkidle')
      expect(violations).toEqual([])
    })
  }
})
