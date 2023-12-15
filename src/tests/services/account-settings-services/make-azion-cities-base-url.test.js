import { assert, describe, it } from 'vitest'
import { makeAzionCitiesBaseUrl } from '@services/account-settings-services/make-azion-cities-base-url'

const makeSut = () => {
  const sut = makeAzionCitiesBaseUrl

  return {
    sut
  }
}

describe.concurrent('AccountSettingsServices', () => {
  it('should return the API base url', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'cities/'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
