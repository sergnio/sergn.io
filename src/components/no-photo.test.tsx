// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { NoPhoto } from './no-photo'

afterEach(cleanup)

describe('the no-photo drumette', () => {
  it('is announced as an image named "No photo yet" when it stands alone', () => {
    render(<NoPhoto />)

    expect(screen.getByRole('img', { name: 'No photo yet' })).toBeTruthy()
  })

  it('is silent when decorative, though its caption is still drawn', () => {
    render(<NoPhoto decorative />)

    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('No photo yet')).toBeTruthy()
  })
})
