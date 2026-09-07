import { defineConfig } from 'vite'
import netlify from '@netlify/vite-plugin-tanstack-start'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    netlify(),
    tanstackStart({
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
