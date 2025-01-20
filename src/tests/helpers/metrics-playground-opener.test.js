import { metricsPlaygroundOpener } from '@/helpers'
import { afterAll, describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = metricsPlaygroundOpener

  return {
    sut
  }
}

const scenarios = [
  {
    label: 'should open a new window to metrics playground in prod env',
    href: 'https://azion.com',
    expected: 'https://api.azion.com/metrics/graphql'
  },
  {
    label: 'should open a new window to metrics playground in stage env',
    href: 'http://localhost',
    expected: 'https://stage-api.azion.com/v4/metrics/graphql'
  }
]

describe('metricsPlaygroundOpener', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it.each(scenarios)('$label', ({ href, expected }) => () => {
    vi.stubGlobal('window', {
      open: (url) => url,
      location: {
        href
      }
    })

    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut()

    expect(openWindowSpy).toHaveBeenCalledWith(expected, '_blank')
  })
})
