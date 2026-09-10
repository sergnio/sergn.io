import { defineConfig } from 'vite'
import netlify from '@netlify/vite-plugin-tanstack-start'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  // Pin the preview server (used by the prerender crawler) to IPv4 loopback:
  // some environments resolve "localhost" to 127.0.0.1 for outbound requests
  // while Vite's default preview host binds IPv6 loopback only, causing
  // ECONNREFUSED during static prerendering.
  preview: { host: '127.0.0.1' },
  plugins: [
    netlify(),
    tanstackStart({
      pages: [
        { path: '/not-found', sitemap: { exclude: true } },
        // Noindex page: keep it out of the sitemap so the two signals agree.
        { path: '/retired-content', sitemap: { exclude: true } },
        // The crawler also emits trailing-slash variants of the collection
        // indexes, which are not the canonical URLs those pages declare.
        { path: '/blog/', sitemap: { exclude: true } },
        { path: '/coffee/', sitemap: { exclude: true } },
        { path: '/na-beers/', sitemap: { exclude: true } },
        { path: '/reubens/', sitemap: { exclude: true } },
        { path: '/wings/', sitemap: { exclude: true } },
      ],
      prerender: {
        enabled: true,
        crawlLinks: true,
        failOnError: true,
      },
      sitemap: {
        enabled: true,
        host: 'https://sergn.io',
      },
    }),
    viteReact(),
  ],
})
