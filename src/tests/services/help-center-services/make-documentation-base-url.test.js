import { makeDocumentationBaseUrl } from '@/services/help-center-services/make-documentation-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeDocumentationBaseUrl

  return {
    sut
  }
}

describe('HelpCenterServices', () => {
  it('should return the API base url to get documentation', () => {
    const { sut } = makeSut()
    const correctApiUrl = 'https://storage.googleapis.com/gcs-docs-help-center-stage'

    const baseUrl = sut('stage')

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
