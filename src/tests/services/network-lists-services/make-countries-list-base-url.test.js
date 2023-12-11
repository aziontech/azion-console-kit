import { makeCountriesListBaseUrl } from '@/services/network-lists-services/make-countries-list-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeCountriesListBaseUrl

  return {
    sut
  }
}

describe('NetworkListsServices', () => {
  it('should return the API base url to graphql api', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'cities'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
