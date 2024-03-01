import { describe, expect, it } from 'vitest'
import { makeAnalyticsClient } from '@/plugins/factories/analytics-tracking-factory'

const makeSut = () => {
  return {
    sut: makeAnalyticsClient
  }
}

describe('AnalyticsTrackingFactory', () => {
  it('should return an error whe no environment is provided', () => {
    const { sut } = makeSut()

    expect(() => sut(null)).toThrowError('Provide an environment to select correct tracking token')
  })

  it('should return an error on invalid environment provided', () => {
    const { sut } = makeSut()

    expect(() => sut('invalid-environment-stub')).toThrowError(
      'Provide an valid environment to select correct tracking token'
    )
  })

  it('should create analytics with correct configuration', () => {
    const { sut } = makeSut()

    const analyticsClient = sut('development')

    expect(analyticsClient).toBeTruthy()
  })
})
