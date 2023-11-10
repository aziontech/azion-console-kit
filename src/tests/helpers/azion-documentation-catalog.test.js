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
  it('should open edge service documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.edgeServices()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=edge services&filter=doc`
    )
  })
  it('should open intelligent DNS documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.intelligentDNS()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=intelligent-dns&filter=doc`
    )
  })
  it('should open personal tokens documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.personalTokens()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=personal tokens&filter=doc`
    )
  })
  it('should open domains documentation with correct link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut.domains()

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=domains&filter=doc`
    )
  })
})
