import { afterAll, describe, expect, it, vi } from 'vitest'
import { azionPrivacyPolicyWindowOpener } from '@/helpers/azion-privacy-policy-opener'

vi.stubGlobal('window', {
  open: (url) => url
})

const makeSut = () => {
  const sut = azionPrivacyPolicyWindowOpener

  return {
    sut
  }
}

describe('AzionPrivacyPolicyWindowOpener', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
  })
  it('should open a new window with azion privacy policy link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut()

    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://www.azion.com/en/documentation/agreements/privacy-policy/',
      '_blank'
    )
  })
})
