import { makeDigitalCertificatesBaseUrl } from '@/services/digital-certificates-services/make-digital-certificates-base-url'
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
    const version = 'v3'
    const correctApiUrl = `${version}/digital_certificates`

    const baseUrl = sut()

    assert.strictEqual(baseUrl, correctApiUrl)
  })
})
