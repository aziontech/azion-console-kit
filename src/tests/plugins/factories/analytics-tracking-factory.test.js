import { describe, expect, it } from 'vitest'
import { makeAnalyticsClient } from '@/plugins/factories/analytics-tracking-factory'

const makeSut = () => {
  return {
    sut: makeAnalyticsClient
  }
}

describe('AnalyticsTrackingFactory', () => {
  it('should create analytics with correct configuration', () => {
    const { sut } = makeSut()

    const analyticsClient = sut('token_segment')

    expect(analyticsClient).toBeTruthy()
  })
})
