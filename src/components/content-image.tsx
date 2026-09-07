import type { SanityImage } from '#/lib/content-types'
import { imageDimensions, imageSrcSet, imageUrl } from '#/lib/sanity/image'

type ContentImageProps = {
  image?: SanityImage
  sizes: string
  priority?: boolean
}

export function ContentImage({
  image,
  sizes,
  priority = false,
}: ContentImageProps) {
  const source = imageUrl(image, 800)
  const srcSet = imageSrcSet(image)
  const dimensions = imageDimensions(image)

  if (!source || !image) return null

  return (
    <img
      alt={image.alt}
      className="content-image"
      decoding="async"
      height={dimensions?.height}
      loading={priority ? 'eager' : 'lazy'}
      sizes={sizes}
      src={source}
      srcSet={srcSet}
      width={dimensions?.width}
    />
  )
}
