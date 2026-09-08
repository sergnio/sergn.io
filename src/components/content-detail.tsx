import type { ContentDocument, Post } from '#/lib/content-types'
import {
  formatAbv,
  formatBrewSettings,
  formatDate,
  formatGrinder,
  formatMoney,
  formatPackageSize,
  formatRating,
} from '#/lib/formatters'
import { ContentImage } from './content-image'
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

function ReviewFacts({ document }: ContentDetailProps) {
  if (document._type === 'coffee') {
    return (
      <dl className="facts">
        <div>
          <dt>Roaster</dt>
          <dd>{document.roaster ?? 'Not listed'}</dd>
        </div>
        {document.origin ? (
          <div>
            <dt>Origin</dt>
            <dd>{document.origin}</dd>
          </div>
        ) : null}
        <div>
          <dt>Bought from</dt>
          <dd>
            {document.purchaseUrl ? (
              <a href={document.purchaseUrl}>{document.boughtFrom}</a>
            ) : (
              document.boughtFrom
            )}
          </dd>
        </div>
        <div>
          <dt>Bag</dt>
          <dd>{formatPackageSize(document.bagSize)}</dd>
        </div>
        {document.price ? (
          <div>
            <dt>Price</dt>
            <dd>{formatMoney(document.price)}</dd>
          </div>
        ) : null}
      </dl>
    )
  }

  if (document._type === 'wingReview') {
    return (
      <dl className="facts">
        <div>
          <dt>Venue</dt>
          <dd>{document.venue}</dd>
        </div>
        <div>
          <dt>Order</dt>
          <dd>{document.order.styleOrFlavor}</dd>
        </div>
        {document.order.heat ? (
          <div>
            <dt>Heat</dt>
            <dd>{document.order.heat}</dd>
          </div>
        ) : null}
        {document.order.pieceCount ? (
          <div>
            <dt>Pieces</dt>
            <dd>{document.order.pieceCount}</dd>
          </div>
        ) : null}
        {document.rating !== undefined ? (
          <div>
            <dt>Rating</dt>
            <dd>{formatRating(document.rating)}</dd>
          </div>
        ) : null}
      </dl>
    )
  }

  if (document._type === 'naBeer') {
    return (
      <dl className="facts">
        <div>
          <dt>Brewery</dt>
          <dd>{document.brewery}</dd>
        </div>
        {document.style ? (
          <div>
            <dt>Style</dt>
            <dd>{document.style}</dd>
          </div>
        ) : null}
        {formatAbv(document.abvPercent, document.abvNote) ? (
          <div>
            <dt>ABV</dt>
            <dd>{formatAbv(document.abvPercent, document.abvNote)}</dd>
          </div>
        ) : null}
        {document.package ? (
          <div>
            <dt>Package</dt>
            <dd>
              {formatPackageSize(document.package)}{' '}
              {document.packageFormat?.toLowerCase()}
            </dd>
          </div>
        ) : null}
        {document.rating !== undefined ? (
          <div>
            <dt>Rating</dt>
            <dd>{formatRating(document.rating)}</dd>
          </div>
        ) : null}
      </dl>
    )
  }

  if (document._type === 'reubenReview') {
    const orderDetails = Object.entries(document.orderDetails ?? {}).filter(
      ([key, value]) => key !== 'other' && Boolean(value),
    )

    return (
      <dl className="facts">
        <div>
          <dt>Restaurant</dt>
          <dd>{document.restaurant}</dd>
        </div>
        {orderDetails.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value as string}</dd>
          </div>
        ))}
        {document.rating !== undefined ? (
          <div>
            <dt>Rating</dt>
            <dd>{formatRating(document.rating)}</dd>
          </div>
        ) : null}
      </dl>
    )
  }

  return null
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
            <h3>{recipe.label ?? recipe.method}</h3>
            <p className="recipe__method">{recipe.method}</p>
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
              <time>{formatDate(publishedDate(document))}</time>
            </p>
          ) : null}
          {document._type === 'post' ? (
            <p className="lede">{document.excerpt}</p>
          ) : null}
        </div>
        {image ? (
          <figure className="detail-hero__image">
            <ContentImage
              image={image}
              priority
              sizes="(min-width: 900px) 50vw, 100vw"
            />
            {image.caption ? <figcaption>{image.caption}</figcaption> : null}
          </figure>
        ) : null}
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
          </>
        )}
      </div>
    </article>
  )
}
