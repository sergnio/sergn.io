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

/**
 * One image with everything authored alongside it. Credit is part of the
 * caption line rather than a separate element, so a photographer named in the
 * Studio is always attributed wherever the image appears.
 */
export function ImageFigure({
  className,
  image,
  priority,
  sizes,
}: ContentImageProps & { className?: string }) {
  if (!image) return null

  return (
    <figure className={className}>
      <ContentImage image={image} priority={priority} sizes={sizes} />
      {image.caption || image.credit ? (
        <figcaption>
          {image.caption}
          {image.credit ? (
            <span className="figcaption__credit">Photo: {image.credit}</span>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  )
}
