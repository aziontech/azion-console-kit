import { afterAll, describe, expect, it, vi } from 'vitest'
import { azionOnboardingWindowOpener } from '@/helpers/azion-onboarding-window-opener'

vi.stubGlobal('window', {
  open: (url) => url
})

const makeSut = () => {
  const sut = azionOnboardingWindowOpener

  return {
    sut
  }
}

describe('AzionOnboardingWindowOpener', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
  })
  it('should open a new window with onboarding session link', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut()

    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://meetings.hubspot.com/rafael-weber1/onboarding-session',
      '_blank'
    )
  })
})
