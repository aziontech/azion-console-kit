import { metricsPlaygroundOpener } from '@/helpers'
import { afterAll, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('window', {
  open: (url) => url
})

const makeSut = () => {
  const sut = metricsPlaygroundOpener

  return {
    sut
  }
}

describe('metricsPlaygroundOpener', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
  })
  it('should open a new window to metrics playground', () => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut()

    expect(openWindowSpy).toHaveBeenCalledWith('https://azion.com', '_blank')
  })
})
