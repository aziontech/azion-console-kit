import { azionTermsAndServicesWindowOpener } from '@/helpers/azion-terms-and-services-opener'
import { afterAll, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('window', {
  open: (url) => url
})

const makeSut = () => {
  const sut = azionTermsAndServicesWindowOpener

  return {
    sut
  }
}

describe('azionTermsAndServicesWindowOpener', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
  })
  it('should open a new window with azion terms and services link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut()

    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://www.azion.com/en/documentation/agreements/customer-agreement/',
      '_blank'
    )
  })
})
