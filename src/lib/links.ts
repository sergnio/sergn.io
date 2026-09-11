/**
 * Authored links are the one part of a document whose destination the renderer
 * cannot infer. The Studio validates a link's URL, but that validation is
 * client-side only, so anything created by API or import reaches the site
 * unchecked - including schemes a browser will execute. Classifying an href
 * here is what decides how the link is rendered and what the content contract
 * refuses to publish.
 */
export type ClassifiedLink =
  | { kind: 'internal'; href: string }
  | { kind: 'external'; href: string }
  | { kind: 'unsafe'; reason: string }

const siteOrigin = 'https://sergn.io'

/** Everything a browser navigates to rather than executes. */
const supportedProtocols = new Set(['http:', 'https:', 'mailto:', 'tel:'])

export function classifyLinkHref(value: unknown): ClassifiedLink {
  if (typeof value !== 'string' || value.trim() === '') {
    return { kind: 'unsafe', reason: 'has no URL' }
  }

  const href = value.trim()

  // Same-page and root-relative destinations are the site's own URL graph,
  // which the build already cross-checks against the prerendered pages.
  if (href.startsWith('#')) return { kind: 'internal', href }

  // "//host/path" reads like a path but leaves the site, so it would render as
  // a same-tab internal link to someone else's origin.
  if (href.startsWith('//')) {
    return {
      kind: 'unsafe',
      reason: `uses the protocol-relative URL "${href}" (write the full https:// URL instead)`,
    }
  }

  if (href.startsWith('/')) return { kind: 'internal', href }

  let url: URL
  try {
    url = new URL(href)
  } catch {
    // Resolving this would depend on which page the text is rendered on, and
    // the same body can appear under more than one URL.
    return {
      kind: 'unsafe',
      reason: `uses the page-relative URL "${href}" (internal links must start with "/")`,
    }
  }

  if (!supportedProtocols.has(url.protocol)) {
    return {
      kind: 'unsafe',
      reason: `uses the unsupported URL scheme "${url.protocol}" in "${href}"`,
    }
  }

  if (url.origin === siteOrigin) {
    return { kind: 'internal', href: `${url.pathname}${url.search}${url.hash}` }
  }

  return { kind: 'external', href }
}
