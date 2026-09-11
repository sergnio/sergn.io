import { describe, expect, it } from 'vitest'
import { classifyLinkHref } from './links'

describe('classifyLinkHref', () => {
  it('treats root-relative paths as internal', () => {
    expect(classifyLinkHref('/coffee/colombia-perky')).toEqual({
      kind: 'internal',
      href: '/coffee/colombia-perky',
    })
  })

  it('treats same-page fragments as internal', () => {
    expect(classifyLinkHref('#notes')).toEqual({
      kind: 'internal',
      href: '#notes',
    })
  })

  it('rewrites an absolute URL to this site as an internal path', () => {
    expect(classifyLinkHref('https://sergn.io/blog/slow-mornings#top')).toEqual(
      {
        kind: 'internal',
        href: '/blog/slow-mornings#top',
      },
    )
  })

  it('treats another origin as external', () => {
    expect(classifyLinkHref('https://example.com/roasters')).toEqual({
      kind: 'external',
      href: 'https://example.com/roasters',
    })
  })

  it('allows mailto and tel destinations', () => {
    expect(classifyLinkHref('mailto:hello@sergn.io').kind).toBe('external')
    expect(classifyLinkHref('tel:+15551234567').kind).toBe('external')
  })

  it('rejects schemes a browser executes instead of navigating to', () => {
    for (const href of [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
    ]) {
      expect(classifyLinkHref(href).kind).toBe('unsafe')
    }
  })

  it('rejects protocol-relative URLs, which read like internal paths', () => {
    const result = classifyLinkHref('//example.com/roasters')
    expect(result.kind).toBe('unsafe')
    expect(result).toMatchObject({ reason: expect.stringContaining('//') })
  })

  it('rejects page-relative URLs, whose target depends on the current page', () => {
    expect(classifyLinkHref('coffee/colombia-perky').kind).toBe('unsafe')
    expect(classifyLinkHref('../coffee').kind).toBe('unsafe')
  })

  it('rejects a missing or blank href', () => {
    expect(classifyLinkHref(undefined).kind).toBe('unsafe')
    expect(classifyLinkHref('   ').kind).toBe('unsafe')
    expect(classifyLinkHref(42).kind).toBe('unsafe')
  })

  it('ignores surrounding whitespace on an otherwise valid URL', () => {
    expect(classifyLinkHref('  https://example.com  ')).toEqual({
      kind: 'external',
      href: 'https://example.com',
    })
  })
})
