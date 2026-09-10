import type {
  CollectionName,
  ContentDocument,
  NaBeer,
  Post,
  ReubenReview,
  SanityImage,
  WingReview,
} from './content-types'
import { imageUrl } from './sanity/image'

export const siteUrl = 'https://sergn.io'
export const siteName = 'sergn.io'
export const siteDescription =
  'Coffee, wings, N/A beers, reubens, and notes from Sergio.'

/**
 * The brand colour browsers paint their chrome with. Kept in sync with
 * theme_color in public/site.webmanifest, which the build asserts.
 */
export const brandColor = '#183f34'

/**
 * The social preview every page falls back to. Without it a shared link
 * previews as a bare text card, which is what happens on the home page, every
 * collection index, and any content item that has no image of its own.
 */
export const defaultSocialImage = {
  url: `${siteUrl}/og-image.png`,
  alt: 'sergn.io - coffee, wings, N/A beers, reubens.',
}

export function canonicalUrl(path: string) {
  return new URL(path, siteUrl).toString()
}

function socialImage(image?: SanityImage) {
  return imageUrl(image, 1200)
}

function contentImage(document: ContentDocument) {
  return document._type === 'post' ? document.coverImage : document.heroImage
}

export function contentDescription(document: ContentDocument) {
  if (document._type === 'post') {
    return document.seo?.description ?? document.excerpt
  }

  if (document._type === 'coffee') {
    return [
      document.roaster,
      document.origin,
      document.tastingNotes?.join(', '),
    ]
      .filter(Boolean)
      .join(' · ')
  }

  if (document._type === 'wingReview') {
    return `${document.venue} - ${document.order.styleOrFlavor}`
  }

  if (document._type === 'naBeer') {
    return [document.brewery, document.style].filter(Boolean).join(' · ')
  }

  return document.restaurant
}

type SocialMetaOptions = {
  description: string
  image?: string
  ogType?: 'article' | 'website'
  path: string
  title: string
}

/**
 * Title, description, canonical, Open Graph, and Twitter card tags for one
 * page. Every indexable page goes through here so a shared URL always
 * previews with a real title and description, not just the site name.
 */
export function pageHead({
  description,
  image,
  ogType = 'website',
  path,
  title,
}: SocialMetaOptions) {
  const url = canonicalUrl(path)
  const preview = image
    ? { url: image, alt: title }
    : { ...defaultSocialImage, alt: `${title} - ${siteName}` }

  return {
    meta: [
      { title: `${title} | ${siteName}` },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: ogType },
      { property: 'og:url', content: url },
      { property: 'og:image', content: preview.url },
      { property: 'og:image:alt', content: preview.alt },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: preview.url },
      { name: 'twitter:image:alt', content: preview.alt },
    ],
    links: [{ rel: 'canonical', href: url }],
  }
}

export function contentHead(document: ContentDocument, path: string) {
  const title =
    document._type === 'post'
      ? (document.seo?.title ?? document.title)
      : document.title

  return pageHead({
    description: contentDescription(document),
    image: socialImage(contentImage(document)),
    ogType: document._type === 'post' ? 'article' : 'website',
    path,
    title,
  })
}

export const collectionTitles: Record<CollectionName, string> = {
  blog: 'Blog',
  coffee: 'Coffee',
  'na-beers': 'N/A Beers',
  reubens: 'Reubens',
  wings: 'Wings',
}

const personId = `${siteUrl}/#person`

const author = {
  '@type': 'Person',
  '@id': personId,
  name: 'Sergio',
  url: siteUrl,
}

/**
 * The site's own identity, emitted once on the home page. Without a WebSite
 * node a crawler has to infer the site name and owner from the title tag.
 */
export function siteJsonLd() {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: siteName,
        description: siteDescription,
        publisher: { '@id': personId },
      },
      author,
    ],
  })
}

type Crumb = { name: string; path: string }

/** A trail always starts at the home page, so callers pass only what follows. */
export function breadcrumbJsonLd(trail: Crumb[]) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...trail].map(
      (crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: canonicalUrl(crumb.path),
      }),
    ),
  })
}

export function collectionJsonLd(collection: CollectionName) {
  return breadcrumbJsonLd([
    { name: collectionTitles[collection], path: `/${collection}` },
  ])
}

type RatedDocument = NaBeer | ReubenReview | WingReview

function isRated(document: ContentDocument): document is RatedDocument {
  return document._type !== 'post' && document._type !== 'coffee'
}

function reviewedItem(document: RatedDocument) {
  if (document._type === 'naBeer') {
    return {
      '@type': 'Product',
      name: document.title,
      brand: { '@type': 'Brand', name: document.brewery },
    }
  }

  const name =
    document._type === 'wingReview' ? document.venue : document.restaurant
  const city = document.location?.city

  return {
    '@type': 'Restaurant',
    name,
    ...(city
      ? { address: { '@type': 'PostalAddress', addressLocality: city } }
      : {}),
    ...(document.location?.url ? { sameAs: document.location.url } : {}),
  }
}

/**
 * Reviews are the bulk of the site, but only blog posts carried structured
 * data. Coffee entries are brew notes with no rating field, and an unrated
 * document would be invalid Review markup, so both are left unmarked rather
 * than published with a missing reviewRating.
 */
export function reviewJsonLd(document: ContentDocument, path: string) {
  if (!isRated(document) || document.rating === undefined) return undefined

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: document.title,
    itemReviewed: reviewedItem(document),
    reviewRating: {
      '@type': 'Rating',
      ratingValue: document.rating,
      bestRating: 5,
      worstRating: 1,
    },
    datePublished:
      document._type === 'naBeer' ? document.publishedAt : document.visitedAt,
    url: canonicalUrl(path),
    author,
  })
}

export function articleJsonLd(post: Post) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.seo?.title ?? post.title,
    description: post.seo?.description ?? post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post._updatedAt,
    mainEntityOfPage: canonicalUrl(`/blog/${post.slug}`),
    ...(post.coverImage ? { image: socialImage(post.coverImage) } : {}),
    author,
  })
}

/**
 * Head for one detail page: social tags plus the structured data that page
 * type supports, so every detail route stays a one-liner.
 */
export function detailHead(
  collection: CollectionName,
  document: ContentDocument,
) {
  const path = `/${collection}/${document.slug}`
  const jsonLd = [
    breadcrumbJsonLd([
      { name: collectionTitles[collection], path: `/${collection}` },
      { name: document.title, path },
    ]),
    document._type === 'post'
      ? articleJsonLd(document)
      : reviewJsonLd(document, path),
  ].filter((entry) => entry !== undefined)

  return {
    ...contentHead(document, path),
    scripts: jsonLd.map((children) => ({
      type: 'application/ld+json',
      children,
    })),
  }
}
