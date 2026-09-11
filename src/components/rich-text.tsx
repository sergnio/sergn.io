import { PortableText } from '@portabletext/react'
import type { PortableTextContent } from '#/lib/content-types'
import { classifyLinkHref } from '#/lib/links'
import { ImageFigure } from './content-image'

type RichTextProps = {
  value?: PortableTextContent
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
          },
          types: {
            imageWithAlt: ({ value: image }) => (
              <ImageFigure
                className="rich-text__image"
                image={image}
                sizes="(min-width: 768px) 48rem, 100vw"
              />
            ),
          },
        }}
        value={value}
      />
    </div>
  )
}
