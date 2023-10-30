import { azionDocumentationWindowOpener } from '@/helpers/azion-documentation-window-opener'
import { afterAll, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('window', {
  open: (url) => url
})

const makeSut = () => {
  const sut = azionDocumentationWindowOpener

  return {
    sut
  }
}

describe('AzionDocumentationWindowOpener', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
  })
  it('should open a new window with azion documentation link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const searchTermMock = 'azion-product'
    const { sut } = makeSut()

    sut(searchTermMock)

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=${searchTermMock}&filter=doc`
    )
  })
})
