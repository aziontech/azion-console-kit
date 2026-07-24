import { describe, it, expect } from 'vitest'
import { escapeHtml, highlightMatch } from '../highlight-match'

describe('escapeHtml', () => {
  it('escapes the five HTML-significant characters', () => {
    expect(escapeHtml(`<a href="x" class='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; class=&#39;y&#39;&gt;&amp;&lt;/a&gt;'
    )
  })

  it('coerces non-strings', () => {
    expect(escapeHtml(42)).toBe('42')
  })
})

describe('highlightMatch', () => {
  it('wraps the first case-insensitive occurrence in a single <mark>', () => {
    expect(highlightMatch('This is a test string', 'TEST')).toBe(
      'This is a <mark class="search-highlight">test</mark> string'
    )
  })

  it('returns escaped text when the query is empty', () => {
    expect(highlightMatch('hello world', '')).toBe('hello world')
    expect(highlightMatch('a<b', '   ')).toBe('a&lt;b')
  })

  it('returns escaped text when there is no match', () => {
    expect(highlightMatch('hello', 'xyz')).toBe('hello')
  })

  it('escapes untrusted segments around the match (no injection)', () => {
    const out = highlightMatch('<img src=x onerror=1> test', 'test')
    expect(out).toBe('&lt;img src=x onerror=1&gt; <mark class="search-highlight">test</mark>')
  })

  it('trims the query before matching', () => {
    expect(highlightMatch('a test b', '  test  ')).toBe(
      'a <mark class="search-highlight">test</mark> b'
    )
  })

  it('returns empty string for null/undefined text', () => {
    expect(highlightMatch(null, 'x')).toBe('')
    expect(highlightMatch(undefined, 'x')).toBe('')
  })
})
