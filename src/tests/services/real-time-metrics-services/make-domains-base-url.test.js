import { makeDomainsBaseUrl } from '@/services/real-time-metrics-services/make-domains-base-url'
import { expect, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeDomainsBaseUrl

  return {
    sut
  }
}

describe('RealTimeMetricsServices', () => {
  it('should return the API base url to domains service', () => {
    const { sut } = makeSut()
    const version = 'v3'
    const correctApiUrl = `${version}/domains`

    const baseUrl = sut()

    expect(baseUrl).toEqual(correctApiUrl)
  })
})
