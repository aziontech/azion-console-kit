import { describe, expect, it } from 'vitest'
import { removeHtmlTagFromText } from '@/helpers'

describe('removeHtmlTagFromText', () => {
  it('should correctly remove target html tag from the given text', () => {
    const unparsedTextMock = `This is an test with some link tags<a href="#">click here</a> and more text<a href="#">click here</a>.`
    const result = removeHtmlTagFromText(unparsedTextMock, 'a')

    expect(result).toEqual(`This is an test with some link tags and more text.`)
  })
})
