import { describe, expect, it, vi } from 'vitest'
import { makeStripeClient } from '@/plugins/factories/stripe-integration-factory'

const makeSut = () => {
  return {
    sut: makeStripeClient
  }
}

const fixtures = {
  stripeToken: 'token_test_1234556'
}

describe('StripteIntegrationFactory', () => {
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
    vi.stubEnv('VITE_DEV_STRIPE_TOKEN', fixtures.stripeToken)
    const { sut } = makeSut()

    const stripeClient = sut('development')

    expect(stripeClient).toBeTruthy()
  })
})
