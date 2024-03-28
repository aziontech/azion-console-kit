import { makeEdgeDNSBaseUrl } from '@/services/real-time-metrics-services/make-edge-dns-base-url'
import { expect, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeEdgeDNSBaseUrl

  return {
    sut
  }
}

describe('RealTimeMetricsServices', () => {
  it('should return the API base url to domains service', () => {
    const { sut } = makeSut()
    const version = 'v3'
    const correctApiUrl = `${version}/intelligent_dns`

    const baseUrl = sut()

    expect(baseUrl).toEqual(correctApiUrl)
  })
})
