// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { SanityImage } from '#/lib/content-types'
import { ContentImage } from './content-image'

afterEach(cleanup)

const lqip = 'data:image/jpeg;base64,/9j/blurred'

const photo = (overrides: Partial<SanityImage> = {}): SanityImage => ({
  alt: 'A plate of wings',
  asset: {
    _id: 'image-1',
    url: 'https://cdn.example.com/wings.jpg',
    metadata: { dimensions: { width: 1200, height: 900 }, lqip },
  },
  ...overrides,
})

// The placeholder is the requirement itself, so the test reads the style.
describe('a photo still downloading', () => {
  it('shows a blurred copy of itself until it arrives', () => {
    render(<ContentImage image={photo()} sizes="100vw" />)

    expect(
      screen.getByRole('img', { name: 'A plate of wings' }).style
        .backgroundImage,
    ).toBe(`url("${lqip}")`)
  })

  it('keeps the plain fill when it is cropped, since the blur shows the whole photo', () => {
    render(
      <ContentImage
        image={photo({ crop: { top: 0.2, bottom: 0, left: 0, right: 0 } })}
        sizes="100vw"
      />,
    )

    expect(
      screen.getByRole('img', { name: 'A plate of wings' }).style
        .backgroundImage,
    ).toBe('')
  })

  it('keeps the plain fill when no blurred copy exists', () => {
    render(
      <ContentImage
        image={photo({
          asset: {
            _id: 'image-2',
            url: 'https://cdn.example.com/wings.jpg',
            metadata: { dimensions: { width: 1200, height: 900 } },
          },
        })}
        sizes="100vw"
      />,
    )

    expect(
      screen.getByRole('img', { name: 'A plate of wings' }).style
        .backgroundImage,
    ).toBe('')
  })
})
