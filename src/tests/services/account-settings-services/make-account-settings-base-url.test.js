import { assert, describe, it } from 'vitest'
import { makeAccountSettingsBaseUrl } from '@services/account-settings-services/make-account-settings-base-url'

const makeSut = () => {
  const sut = makeAccountSettingsBaseUrl

  return {
    sut
  }
}

describe.concurrent('AccountSettingsServices', () => {
  it('should return the API base url', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'iam/account'

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
