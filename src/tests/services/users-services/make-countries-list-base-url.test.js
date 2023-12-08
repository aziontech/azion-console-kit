import { makeCountriesListBaseUrl } from '@/services/users-services/make-countries-list-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeCountriesListBaseUrl

  return {
    sut
  }
}

describe('UsersServices', () => {
  it('should return the API base url to users service', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'cities'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
