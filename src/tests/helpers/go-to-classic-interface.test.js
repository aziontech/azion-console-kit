import { goToClassicInterface } from '@/helpers'
import { afterAll, describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = goToClassicInterface

  return {
    sut
  }
}

vi.stubGlobal('window', {
  open: (url) => url
})

afterAll(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('GoToClassicInterface', () => {
  it.each([
    {
      environment: 'stage',
      redirectUrl: 'https://stage-manager.azion.com'
    },
    {
      environment: 'production',
      redirectUrl: 'https://manager.azion.com'
    }
  ])(`should return correct value based on valid environment`, ({ environment, redirectUrl }) => {
    vi.stubEnv('MODE', environment)
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut()

    expect(openWindowSpy).toHaveBeenCalledWith(redirectUrl)
  })

  it('should not redirect when invalid environment is used', () => {
    vi.stubEnv('MODE', 'invalid-stub-env')
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut()

    expect(openWindowSpy).not.toHaveBeenCalled()
  })
})
