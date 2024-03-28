import { makeBeholderBaseUrl } from '@/services/real-time-metrics-services/make-beholder-base-url'
import { expect, describe, it } from 'vitest'

const makeSut = () => {
  const sut = makeBeholderBaseUrl

  return {
    sut
  }
}

describe('RealTimeMetricsServices', () => {
  it('should return the API base url to beholder service', () => {
    const { sut } = makeSut()
    const beholderUrl = '/metrics/graphql'

    const baseUrl = sut()

    expect(baseUrl).toEqual(beholderUrl)
  })
})
