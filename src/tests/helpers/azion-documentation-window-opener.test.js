import {
  openSearchResult,
  openDocumentationProducts,
  openDocumentation,
  openAPIDocumentation,
  AZION_API_DOCUMENTATION,
  AZION_DOCUMENTATION,
  AZION_DOCUMENTATION_PRODUCTS,
  AZION_SEARCH_RESULT,
  AZION_CONTACT_SUPPORT,
  openContactSupport,
  openGoogleAuthenticatorAppDocumentation,
  GOOGLE_AUTHENTICATOR_DOCUMENTATION
} from '@/helpers/azion-documentation-window-opener'
import { afterAll, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('window', {
  open: (url) => url
})

describe('AzionDocumentationWindowOpener', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('should open a new window with search result link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const searchTermMock = 'azion-product'

    openSearchResult(searchTermMock)

    expect(openWindowSpy).toHaveBeenCalledWith(
      `${AZION_SEARCH_RESULT}/?q=${searchTermMock}&filter=doc`
    )
  })

  it('should open a new window with documentation products link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const path = 'guides/build/build-application'

    openDocumentationProducts(path)

    expect(openWindowSpy).toHaveBeenCalledWith(`${AZION_DOCUMENTATION_PRODUCTS}/${path}`, '_blank')
  })

  it('should open a new window with documentation link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')

    openDocumentation()

    expect(openWindowSpy).toHaveBeenCalledWith(AZION_DOCUMENTATION, '_blank')
  })

  it('should open a new window with API documentation link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')

    openAPIDocumentation()

    expect(openWindowSpy).toHaveBeenCalledWith(AZION_API_DOCUMENTATION, '_blank')
  })

  it('should open a new window with Contact Support link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')

    openContactSupport()

    expect(openWindowSpy).toHaveBeenCalledWith(AZION_CONTACT_SUPPORT, '_blank')
  })

  it('should open a new window with Google Authenticator documentation link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')

    openGoogleAuthenticatorAppDocumentation()

    expect(openWindowSpy).toHaveBeenCalledWith(GOOGLE_AUTHENTICATOR_DOCUMENTATION, '_blank')
  })
})
