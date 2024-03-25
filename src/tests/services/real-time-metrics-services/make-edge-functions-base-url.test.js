import { makeEdgeFunctionsBaseUrl } from '@/services/real-time-metrics-services/make-edge-functions-base-url'
import { expect, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeEdgeFunctionsBaseUrl

  return {
    sut
  }
}

describe('RealTimeMetricsServices', () => {
  it('should return the API base url to domains service', () => {
    const { sut } = makeSut()
    const version = 'v3'
    const correctApiUrl = `${version}/edge_functions`

    const baseUrl = sut()

    expect(baseUrl).toEqual(correctApiUrl)
  })
})
