import { makeDigitalCertificatesBaseUrl } from '@/services/digital-certificates-services/v4/make-digital-certificates-base-url'
import { assert, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeDigitalCertificatesBaseUrl

  return {
    sut
  }
}

describe('DigitalCertificatesServices', () => {
  it('should return the API base url to digital certificates service', () => {
    const { sut } = makeSut()
    const version = 'v4'
    const correctApiUrl = `${version}/digital_certificates/certificates`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
