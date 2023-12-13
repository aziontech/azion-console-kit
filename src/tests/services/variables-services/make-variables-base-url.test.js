import { makeVariablesBaseUrl } from '@/services/variables-services/make-variables-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeVariablesBaseUrl

  return {
    sut
  }
}

describe('VariablesService', () => {
  it('should return the API base url to variables service', () => {
    const { sut } = makeSut()
    const version = 'v3'
    const correctApiUrl = `${version}/variables`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
