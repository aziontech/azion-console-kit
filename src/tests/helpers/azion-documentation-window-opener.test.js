import * as WindowOpenerHelpers from '@/helpers/azion-documentation-window-opener'
import { afterAll, describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  return {
    sut: WindowOpenerHelpers
  }
}

vi.stubGlobal('window', {
  open: (url) => url
})

describe('AzionDocumentationWindowOpener', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('should open a new window with search result link', () => {
    const { sut } = makeSut()
    const openWindowSpy = vi.spyOn(window, 'open')
    const searchTermMock = 'azion-product'

    sut.openSearchResult(searchTermMock)

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/search-result/?q=${searchTermMock}&filter=doc`
    )
  })

  it('should open a new window with documentation products link', () => {
    const { sut } = makeSut()
    const openWindowSpy = vi.spyOn(window, 'open')
    const path = 'guides/build/build-application'

    sut.openDocumentationProducts(path)

    expect(openWindowSpy).toHaveBeenCalledWith(
      `https://www.azion.com/en/documentation/products/${path}`,
      '_blank'
    )
  })

  it('should open a new window with documentation link', () => {
    const { sut } = makeSut()
    const openWindowSpy = vi.spyOn(window, 'open')

    sut.openDocumentation()

    expect(openWindowSpy).toHaveBeenCalledWith('https://www.azion.com/en/documentation', '_blank')
  })

  it('should open a new window with API documentation link', () => {
    const { sut } = makeSut()
    const openWindowSpy = vi.spyOn(window, 'open')

    sut.openAPIDocumentation()

    expect(openWindowSpy).toHaveBeenCalledWith('https://api.azion.com/', '_blank')
  })

  it('should open a new window with Contact Support link', () => {
    const { sut } = makeSut()
    const openWindowSpy = vi.spyOn(window, 'open')

    sut.openContactSupport()

    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://tickets.azion.com/en/support/home',
      '_blank'
    )
  })

  it('should open a new window with Google Authenticator documentation link', () => {
    const { sut } = makeSut()
    const openWindowSpy = vi.spyOn(window, 'open')

    sut.openGoogleAuthenticatorAppDocumentation()

    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://support.google.com/accounts/answer/1066447',
      '_blank'
    )
  })
  it('should open a new window with Azion site link', () => {
    const { sut } = makeSut()
    const openWindowSpy = vi.spyOn(window, 'open')

    sut.openAzionSite()

    expect(openWindowSpy).toHaveBeenCalledWith('https://www.azion.com/', '_blank')
  })
  it('should open a new window with Azion blog link', () => {
    const { sut } = makeSut()
    const openWindowSpy = vi.spyOn(window, 'open')

    sut.openAzionBlog()

    expect(openWindowSpy).toHaveBeenCalledWith('https://www.azion.com/en/blog/', '_blank')
  })
  it('should open a new window with Azion Discord link', () => {
    const { sut } = makeSut()
    const openWindowSpy = vi.spyOn(window, 'open')

    sut.openAzionDiscord()

    expect(openWindowSpy).toHaveBeenCalledWith('https://discord.com/invite/Yp9N7RMVZy', '_blank')
  })
  it('should open a new window with Azion GitHub link', () => {
    const { sut } = makeSut()
    const openWindowSpy = vi.spyOn(window, 'open')

    sut.openAzionGithub()

    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://github.com/aziontech/azion-platform-kit',
      '_blank'
    )
  })
  it('should open a new window with Azion X link', () => {
    const { sut } = makeSut()
    const openWindowSpy = vi.spyOn(window, 'open')

    sut.openAzionX()

    expect(openWindowSpy).toHaveBeenCalledWith('https://x.com/aziontech', '_blank')
  })

  it('should open a new window with Azion Plans link', () => {
    const { sut } = makeSut()
    const openWindowSpy = vi.spyOn(window, 'open')

    sut.openShowMorePlan()

    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://www.azion.com/en/professional-services&id=#plans',
      '_blank'
    )
  })
})
