import { getEnvironmentFromUrl } from '@/helpers'
import { describe, expect, it } from 'vitest'

const makeSut = () => {
  const sut = getEnvironmentFromUrl

  return {
    sut
  }
}

describe('getEnvironmentFromUrl', () => {
  it('should return production environment', () => {
    const { sut } = makeSut()

    const environment = sut('https://unmatched-url-schenario.com')

    expect(environment).toBe('prod')
  })

  it.each([
    {
      scenario: 'stage-console',
      url: 'http://stage-console.com'
    },
    {
      scenario: 'localhost',
      url: 'http://localhost'
    },
    {
      scenario: 'ip address 127.0.0.1',
      url: 'http://127.0.0.1'
    }
  ])('should return stage environment when in $scenario', ({ url }) => {
    const { sut } = makeSut()

    const environment = sut(url)

    expect(environment).toBe('stage')
  })
})
