import { PortableText } from '@portabletext/react'
import type { PortableTextContent, SanityImage } from '#/lib/content-types'
import { ContentImage } from './content-image'

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
            link: ({ children, value: link }) => (
              <a href={link?.href} rel="noreferrer" target="_blank">
                {children}
              </a>
            ),
            code: ({ children }) => <code>{children}</code>,
          },
          types: {
            imageWithAlt: ({ value: image }) => {
              const imageWithAlt = image as SanityImage
              return (
                <figure className="rich-text__image">
                  <ContentImage
                    image={imageWithAlt}
                    sizes="(min-width: 768px) 48rem, 100vw"
                  />
                  {imageWithAlt.caption ? (
                    <figcaption>{imageWithAlt.caption}</figcaption>
                  ) : null}
                </figure>
              )
            },
          },
        }}
        value={value}
      />
    </div>
  )
}
