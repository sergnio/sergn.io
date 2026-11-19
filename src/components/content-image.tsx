import type { CSSProperties } from 'react'
import type { SanityImage } from '#/lib/content-types'
import { useNavVariant } from '#/lib/nav-variants'
import { imageDimensions, imageSrcSet, imageUrl } from '#/lib/sanity/image'

type ContentImageProps = {
  image?: SanityImage
  sizes: string
  /**
   * Marks the one image a page paints its Largest Contentful Paint with.
   * A priority image loads eagerly and at high fetch priority so the preload
   * scanner can start it on first byte; everything else stays lazy. At most
   * one image per page should carry it, or the priority means nothing.
   */
  priority?: boolean
  /** Temporary ?syncimg test: paint already-loaded photos in the first frame. */
  readyOnReturn?: boolean
}

export function ContentImage({
  image,
  sizes,
  priority = false,
  readyOnReturn = false,
}: ContentImageProps) {
  const syncImages = useNavVariant('syncimg') && readyOnReturn
  const source = imageUrl(image, 800)
  const srcSet = imageSrcSet(image)
  const dimensions = imageDimensions(image)

  if (!source || !image) return null

  return (
    <span className="content-image-frame" style={placeholderStyle(image)}>
      <img
        alt={image.alt}
        className="content-image"
        decoding={syncImages ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : undefined}
        height={dimensions?.height}
        key={source}
        loading={priority || syncImages ? 'eager' : 'lazy'}
        ref={showIfAlreadyLoaded}
        sizes={sizes}
        src={source}
        srcSet={srcSet}
        width={dimensions?.width}
      />
    </span>
  )
}

function placeholderStyle(image: SanityImage) {
  const metadata = image.asset?.metadata
  return {
    // Sanity blurs the whole upload, so it would misalign under a crop.
    '--photo-blur':
      image.crop || !metadata?.lqip ? undefined : `url("${metadata.lqip}")`,
    '--photo-color': metadata?.dominantColor,
  } as CSSProperties
}

/** A photo already in memory shows at once; one still loading fades in. */
function showIfAlreadyLoaded(photo: HTMLImageElement | null) {
  if (photo?.complete && photo.naturalWidth > 0)
    photo.dataset.loaded ??= 'cached'
}

/** In the head, so it hears every photo load; a load never reaches `window`. */
export const photoFadeScript = `(function(){function show(e){var t=e.target;if(t.classList&&t.classList.contains('content-image')&&!t.dataset.loaded)t.dataset.loaded='fade'}document.addEventListener('load',show,true);document.addEventListener('error',show,true)})()`

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
