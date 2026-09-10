import type { ReactNode } from 'react'
import type {
  ContentDocument,
  Post,
  ReubenReview,
  SanityImage,
  WingReview,
} from '#/lib/content-types'
import {
  formatAbv,
  formatBrewSettings,
  formatDate,
  formatGrinder,
  formatList,
  formatLocation,
  formatMethod,
  formatMoney,
  formatPackageSize,
  formatRating,
} from '#/lib/formatters'
import { ImageFigure } from './content-image'
import { RichText } from './rich-text'

type ContentDetailProps = {
  document: ContentDocument
}

function heroImage(document: ContentDocument) {
  return document._type === 'post' ? document.coverImage : document.heroImage
}

function detailLabel(document: ContentDocument) {
  switch (document._type) {
    case 'coffee':
      return 'Coffee notes'
    case 'wingReview':
      return 'Wing review'
    case 'naBeer':
      return 'N/A beer review'
    case 'reubenReview':
      return 'Reuben review'
    case 'post':
      return 'From the blog'
  }
}

function publishedDate(document: ContentDocument) {
  if (document._type === 'wingReview' || document._type === 'reubenReview') {
    return document.visitedAt
  }
  return document.publishedAt
}

type Fact = { label: string; value: ReactNode }

/**
 * The rows a document actually has. Everything authorable in the Studio is
 * listed here, so a field someone fills in never silently disappears from the
 * page; rows with no value drop out rather than rendering an empty term.
 */
function facts(document: ContentDocument): Fact[] {
  if (document._type === 'coffee') {
    return [
      { label: 'Roaster', value: document.roaster ?? 'Not listed' },
      { label: 'Origin', value: document.origin },
      {
        label: 'Bought from',
        value: document.purchaseUrl ? (
          <a href={document.purchaseUrl}>{document.boughtFrom}</a>
        ) : (
          document.boughtFrom
        ),
      },
      { label: 'Bag', value: formatPackageSize(document.bagSize) },
      { label: 'Tasting notes', value: formatList(document.tastingNotes) },
      { label: 'Roasted', value: formatDate(document.roastDate) },
      { label: 'Purchased', value: formatDate(document.purchasedAt) },
      { label: 'Price', value: formatMoney(document.price) },
    ]
  }

  if (document._type === 'wingReview') {
    return [
      { label: 'Venue', value: document.venue },
      { label: 'Where', value: locationValue(document) },
      { label: 'Order', value: document.order.styleOrFlavor },
      { label: 'Heat', value: document.order.heat },
      { label: 'Pieces', value: document.order.pieceCount },
      { label: 'Sides', value: formatList(document.order.sides) },
      { label: 'Price', value: formatMoney(document.price) },
      { label: 'Rating', value: formatRating(document.rating) },
    ]
  }

  if (document._type === 'naBeer') {
    return [
      { label: 'Brewery', value: document.brewery },
      { label: 'Style', value: document.style },
      { label: 'ABV', value: formatAbv(document.abvPercent, document.abvNote) },
      {
        label: 'Package',
        value: document.package
          ? `${formatPackageSize(document.package)} ${document.packageFormat?.toLowerCase() ?? ''}`.trim()
          : undefined,
      },
      { label: 'Bought from', value: document.boughtFrom },
      { label: 'Purchased', value: formatDate(document.purchasedAt) },
      { label: 'Price', value: formatMoney(document.price) },
      { label: 'Rating', value: formatRating(document.rating) },
    ]
  }

  if (document._type === 'reubenReview') {
    const { other, ...namedDetails } = document.orderDetails ?? {}

    return [
      { label: 'Restaurant', value: document.restaurant },
      { label: 'Where', value: locationValue(document) },
      ...Object.entries(namedDetails).map(([label, value]) => ({
        label,
        value,
      })),
      ...(other ?? []).map(({ label, value }) => ({ label, value })),
      { label: 'Price', value: formatMoney(document.price) },
      { label: 'Rating', value: formatRating(document.rating) },
    ]
  }

  return []
}

/** A place, linked to whatever the Studio recorded as its site. */
function locationValue(document: ReubenReview | WingReview) {
  const place = formatLocation(document.location)
  const url = document.location?.url

  if (!place) return url ? <a href={url}>Website</a> : undefined
  return url ? <a href={url}>{place}</a> : place
}

function ReviewFacts({ document }: ContentDetailProps) {
  const rows = facts(document).filter((fact) => Boolean(fact.value))
  if (!rows.length) return null

  return (
    <dl className="facts">
      {rows.map((fact, index) => (
        <div key={`${fact.label}-${index}`}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * Every image beyond the hero. The Studio offers a gallery on coffee and on
 * all three review types, so without this section those uploads are fetched
 * and then dropped.
 */
function Gallery({ images }: { images?: SanityImage[] }) {
  if (!images?.length) return null

  return (
    <section aria-labelledby="gallery-title" className="detail-section">
      <div className="section-heading">
        <h2 id="gallery-title">Gallery</h2>
      </div>
      <div className="gallery">
        {images.map((image) => (
          <ImageFigure
            className="gallery__item"
            image={image}
            key={image.asset?._id ?? image.alt}
            sizes="(min-width: 720px) 45vw, 100vw"
          />
        ))}
      </div>
    </section>
  )
}

function CoffeeRecipes({
  document,
}: {
  document: Extract<ContentDocument, { _type: 'coffee' }>
}) {
  return (
    <section aria-labelledby="recipes-title" className="detail-section">
      <div className="section-heading">
        <p className="eyebrow">Practical notes</p>
        <h2 id="recipes-title">Brew recipes</h2>
      </div>
      <div className="recipe-list">
        {document.brewRecipes.map((recipe) => (
          <article className="recipe" key={recipe._key}>
            <h3>{recipe.label ?? formatMethod(recipe)}</h3>
            <p className="recipe__method">{formatMethod(recipe)}</p>
            <p>{formatGrinder(recipe)}</p>
            {formatBrewSettings(recipe) ? (
              <p className="recipe__settings">{formatBrewSettings(recipe)}</p>
            ) : null}
            {recipe.steps?.length ? (
              <ol>
                {recipe.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

function PostDetails({ post }: { post: Post }) {
  return (
    <>
      <RichText value={post.body} />
      {post.tags?.length ? (
        <ul aria-label="Tags" className="tag-list">
          {post.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      ) : null}
    </>
  )
}

export function ContentDetail({ document }: ContentDetailProps) {
  const image = heroImage(document)
  const reviewNotes = document._type === 'post' ? undefined : document.notes

  return (
    <article className="detail-page">
      <header className="detail-hero">
        <div className="detail-hero__copy">
          <p className="eyebrow">{detailLabel(document)}</p>
          <h1>{document.title}</h1>
          {publishedDate(document) ? (
            <p className="detail-hero__date">
              <time dateTime={publishedDate(document)}>
                {formatDate(publishedDate(document))}
              </time>
            </p>
          ) : null}
          {document._type === 'post' ? (
            <p className="lede">{document.excerpt}</p>
          ) : null}
        </div>
        <ImageFigure
          className="detail-hero__image"
          image={image}
          priority
          sizes="(min-width: 900px) 50vw, 100vw"
        />
      </header>
      <div className="detail-content">
        {document._type === 'post' ? (
          <PostDetails post={document} />
        ) : (
          <>
            <ReviewFacts document={document} />
            <RichText value={reviewNotes} />
            {document._type === 'coffee' ? (
              <CoffeeRecipes document={document} />
            ) : null}
            <Gallery images={document.gallery} />
          </>
        )}
      </div>
    </article>
  )
}
