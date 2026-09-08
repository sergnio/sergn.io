import imageUrlBuilder from '@sanity/image-url'
import type { SanityImage } from '../content-types'
import { getSanityBuildConfig, usesFixtureContent } from './client'

export const imageWidths = [400, 800, 1200] as const

export function imageUrl(image: SanityImage | undefined, width: number) {
  if (!image?.asset) return undefined

  if (usesFixtureContent() && image.asset.url) {
    const url = new URL(image.asset.url)
    url.searchParams.set('auto', 'format')
    url.searchParams.set('fit', 'max')
    url.searchParams.set('w', String(width))
    return url.toString()
  }

  const { projectId, dataset } = getSanityBuildConfig()
  const builder = imageUrlBuilder({ projectId, dataset })

  return builder.image(image).width(width).fit('max').auto('format').url()
}

export function imageSrcSet(image: SanityImage | undefined) {
  if (!image) return undefined

  return imageWidths
    .map((width) => {
      const url = imageUrl(image, width)
      return url ? `${url} ${width}w` : undefined
    })
    .filter((candidate): candidate is string => Boolean(candidate))
    .join(', ')
}

export function imageDimensions(image: SanityImage | undefined) {
  return image?.asset?.metadata?.dimensions
}
