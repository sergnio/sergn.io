// Renders the PNG app icons referenced by public/site.webmanifest and the
// apple-touch-icon link. iOS and Android home screens ignore an SVG favicon,
// so without these a saved shortcut falls back to a screenshot or a letter.
// Kept as a script so the committed binaries have a readable source of truth.
// Run with: node scripts/generate-app-icons.mjs
import path from 'node:path'
import { chromium } from '@playwright/test'

// Matches public/favicon.svg, cropped tighter so the mark fills the icon at
// home-screen sizes instead of floating in the middle of a green square.
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 10 44 44" width="100%" height="100%">
  <path d="M18 18h28v28H18z" fill="#d7a945"/>
  <path d="M26 25h15v5H31v4h9v5h-9v5h-5z" fill="#183f34"/>
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
  <body style="margin:0;width:${size}px;height:${size}px;background:#183f34">${mark}</body>
</html>`)
  await page.screenshot({ path: output })
  await page.close()
  console.log(`Wrote ${path.relative(process.cwd(), output)} (${size}x${size})`)
}

await browser.close()
