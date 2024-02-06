import { metricsPlaygroundOpener } from '@/helpers'
import { afterAll, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('window', {
  open: (url) => url,
  location: {
    href: 'https://azion.com'
  }
})

const makeSut = () => {
  const sut = metricsPlaygroundOpener

  return {
    sut
  }
}

const scenarios = [
  {
    label: 'should open a new window to metrics playground without params',
    params: {},
    expected: 'https://manager.azion.com/metrics/graphql?'
  },
  {
    label: 'should open a new window to metrics playground with params',
    params: { query: 'query', variables: 'variables' },
    expected: 'https://manager.azion.com/metrics/graphql?query=query&variables=variables'
  },
  {
    label: 'should open a new window to metrics playground with query only',
    params: { query: 'query' },
    expected: 'https://manager.azion.com/metrics/graphql?query=query'
  },
  {
    label:
      'should open a new window to metrics playground without params when query is not present',
    params: { variables: 'variables' },
    expected: 'https://manager.azion.com/metrics/graphql?'
  }
]

describe('metricsPlaygroundOpener', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
  })
  it.each(scenarios)('$label', ({ params, expected }) => {
    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut(params)

    expect(openWindowSpy).toHaveBeenCalledWith(expected, '_blank')
  })

  it('should open a new window to metrics playground on stage env', () => {
    vi.stubGlobal('window', {
      open: (url) => url,
      location: {
        href: 'http://localhost'
      }
    })

    const openWindowSpy = vi.spyOn(window, 'open')
    const { sut } = makeSut()

    sut({ query: 'query', variables: 'variables' })

    expect(openWindowSpy).toHaveBeenCalledWith(
      'https://stage-manager.azion.com/metrics/graphql?query=query&variables=variables',
      '_blank'
    )
  })
})
