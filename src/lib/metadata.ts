import type { ContentDocument, Post, SanityImage } from './content-types'
import { imageUrl } from './sanity/image'

export const siteUrl = 'https://sergn.io'
export const siteName = 'sergn.io'
export const siteDescription =
  'Coffee, wings, N/A beers, reubens, and notes from Sergio.'

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

  return {
    meta: [
      { title: `${title} | ${siteName}` },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: ogType },
      { property: 'og:url', content: url },
      ...(image ? [{ property: 'og:image', content: image }] : []),
      {
        name: 'twitter:card',
        content: image ? 'summary_large_image' : 'summary',
      },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      ...(image ? [{ name: 'twitter:image', content: image }] : []),
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
    author: { '@type': 'Person', name: 'Sergio' },
  })
}
