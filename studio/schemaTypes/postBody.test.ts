import { describe, expect, it } from 'vitest'
import { validateHeadingLevels } from './postBody'

const heading = (style: string, text: string) => ({
  _type: 'block',
  style,
  children: [{ text }],
})
const paragraph = {
  _type: 'block',
  style: 'normal',
  children: [{ text: 'Prose' }],
}

describe('post heading levels', () => {
  it('rejects a body that opens with a Heading 3', () => {
    expect(
      validateHeadingLevels([heading('h3', 'Societal plagues'), paragraph]),
    ).toBe(
      '"Societal plagues" is a Heading 3 with no Heading 2 above it. Use Heading 2 instead.',
    )
  })

  it('rejects a Heading 4 directly under a Heading 2', () => {
    expect(
      validateHeadingLevels([heading('h2', 'Intro'), heading('h4', 'Detail')]),
    ).toBe(
      '"Detail" is a Heading 4 with no Heading 3 above it. Use Heading 3 instead.',
    )
  })

  it('accepts headings that nest one level at a time and climb back out', () => {
    expect(
      validateHeadingLevels([
        heading('h2', 'One'),
        heading('h3', 'One A'),
        heading('h4', 'One A i'),
        heading('h2', 'Two'),
        heading('h3', 'Two A'),
      ]),
    ).toBe(true)
  })

  it('accepts a body with no headings', () => {
    expect(validateHeadingLevels([paragraph])).toBe(true)
    expect(validateHeadingLevels(undefined)).toBe(true)
  })
})
