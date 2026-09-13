// Renders the PNG app icons referenced by public/site.webmanifest and the
// apple-touch-icon link. iOS and Android home screens ignore an SVG favicon,
// so without these a saved shortcut falls back to a screenshot or a letter.
// Kept as a script so the committed binaries have a readable source of truth.
// Run with: node scripts/generate-app-icons.mjs
import path from 'node:path'
import { chromium } from '@playwright/test'

// Matches the mark in public/favicon.svg, cropped tighter so the letter fills
// the icon at home-screen sizes instead of floating in the middle of a square.
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="12 12 40 40" width="100%" height="100%">
  <path d="M18 16h28v6h-22v7h22v19h-28v-6h22v-7h-22v-19z" fill="#efecee"/>
</svg>`

const icons = [
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
]

const browser = await chromium.launch()

for (const { file, size } of icons) {
  const output = path.join(process.cwd(), 'public', file)
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  })
  // Opaque background: Apple composites a transparent icon onto black.
  await page.setContent(`<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /></head>
  <body style="margin:0;width:${size}px;height:${size}px;background:#30272d">${mark}</body>
</html>`)
  await page.screenshot({ path: output })
  await page.close()
  console.log(`Wrote ${path.relative(process.cwd(), output)} (${size}x${size})`)
}

await browser.close()
