import { documentationCatalog } from '@/helpers/azion-documentation-catalog'
import { afterAll, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('window', {
  open: (url) => url
})

const makeSut = () => {
  const sut = documentationCatalog

  return {
    sut
  }
}

describe('AzionDocumentationCatalog', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
  })
  it('should open variables documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.variables()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=variables&filter=doc`
    )
  })
  it('should open resources documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.resources()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=&filter=doc`
    )
  })
})
