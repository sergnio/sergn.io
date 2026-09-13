import { PortableText } from '@portabletext/react'
import type {
  ImageDisplay,
  PortableTextContent,
  PostBodyContent,
} from '#/lib/content-types'
import { classifyLinkHref } from '#/lib/links'
import { ImageFigure } from './content-image'

type RichTextProps = {
  value?: PortableTextContent | PostBodyContent
}

const imageSizesByDisplay: Record<ImageDisplay, string> = {
  inline: '(min-width: 768px) 48rem, 100vw',
  wide: '(min-width: 1100px) 64rem, 100vw',
  full: '100vw',
}

export function RichText({ value }: RichTextProps) {
  if (!value?.length) return null

  return (
    <div className="rich-text">
      <PortableText
        components={{
          block: {
            h2: ({ children }) => <h2>{children}</h2>,
            h3: ({ children }) => <h3>{children}</h3>,
            h4: ({ children }) => <h4>{children}</h4>,
            normal: ({ children }) => <p>{children}</p>,
            blockquote: ({ children }) => <blockquote>{children}</blockquote>,
          },
          list: {
            bullet: ({ children }) => <ul>{children}</ul>,
            number: ({ children }) => <ol>{children}</ol>,
          },
          marks: {
            link: ({ children, value: link }) => {
              const destination = classifyLinkHref(link?.href)

              // The content contract rejects these before they can be
              // published; rendering the text without an anchor keeps a
              // dataset written around the app from shipping a live
              // javascript: URL or an anchor with no destination.
              if (destination.kind === 'unsafe') return <>{children}</>

              // Internal links stay in the tab: sending a reader to another
              // page of this site in a new tab is disorienting, and it is the
              // same navigation every other link on the site performs.
              if (destination.kind === 'internal') {
                return <a href={destination.href}>{children}</a>
              }

              return (
                <a
                  href={destination.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {children}
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              )
            },
            code: ({ children }) => <code>{children}</code>,
            underline: ({ children }) => <u>{children}</u>,
            'strike-through': ({ children }) => <s>{children}</s>,
          },
          types: {
            imageWithAlt: ({ value: image }) => {
              const display: ImageDisplay = image.display ?? 'inline'

              return (
                <ImageFigure
                  className={`rich-text__image rich-text__image--${display}`}
                  image={image}
                  sizes={imageSizesByDisplay[display]}
                />
              )
            },
            callout: ({ value: block }) => (
              <aside className={`callout callout--${block.tone}`}>
                <RichText value={block.content} />
              </aside>
            ),
            codeBlock: ({ value: block }) => (
              <figure className="code-block">
                {block.filename ? (
                  <figcaption className="code-block__filename">
                    {block.filename}
                  </figcaption>
                ) : null}
                <pre data-language={block.language}>
                  <code>{block.code}</code>
                </pre>
              </figure>
            ),
            divider: ({ value: block }) =>
              block.variant === 'asterisks' ? (
                <p aria-hidden="true" className="divider divider--asterisks">
                  * * *
                </p>
              ) : (
                <hr className="divider" />
              ),
          },
        }}
        value={value}
      />
    </div>
  )
}
