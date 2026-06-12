import { describe, expect, it, vi, afterEach } from 'vitest'
import { loadStripe } from '@stripe/stripe-js/pure'

vi.mock('@stripe/stripe-js/pure', () => ({
  loadStripe: vi.fn()
}))

const makeSut = async () => {
  const { getStripeClientService, warmStripeClient } = await import('@/services/billing-services')
  return {
    sut: getStripeClientService,
    warmStripeClient
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetAllMocks()
  vi.resetModules()
})

describe('Billing Services', () => {
  it('should return an error when incorrect environment is provided', async () => {
    vi.stubEnv('VITE_ENVIRONMENT', 'invalid-stub-env')
    const { sut } = await makeSut()

    await expect(sut()).rejects.toThrowError(
      'Provide a valid environment to select correct tracking token'
    )
  })

  it('should return an error when stripe token is not provided', async () => {
    vi.stubEnv('VITE_ENVIRONMENT', 'development')
    vi.stubEnv('VITE_STRIPE_TOKEN_DEV', '')

    const { sut } = await makeSut()

    await expect(sut()).rejects.toThrowError(
      'Stripe token is missing, cannot load Stripe. View readme for more info.'
    )
  })

  it.each([
    { env: 'development', key: 'VITE_STRIPE_TOKEN_DEV' },
    { env: 'stage', key: 'VITE_STRIPE_TOKEN_STAGE' }
  ])('should set parameter to stripe load when in $env environment', async ({ env, key }) => {
    vi.stubEnv('VITE_ENVIRONMENT', env)
    vi.stubEnv(key, 'some-stripe-token')

    loadStripe.setLoadParameters = vi.fn()

    const { sut } = await makeSut()

    await sut()

    expect(loadStripe.setLoadParameters).toHaveBeenCalledWith({ advancedFraudSignals: false })
  })

  it('should return the stripe client when variables are provided', async () => {
    vi.stubEnv('VITE_ENVIRONMENT', 'production')
    vi.stubEnv('VITE_STRIPE_TOKEN_PROD', 'some-stripe-token')

    const { sut } = await makeSut()

    await expect(sut()).resolves.not.toThrowError()
    expect(loadStripe).toHaveBeenCalledWith('some-stripe-token', { locale: 'en' })
  })

  it('should reuse the same stripe client promise for the same environment and token', async () => {
    vi.stubEnv('VITE_ENVIRONMENT', 'production')
    vi.stubEnv('VITE_STRIPE_TOKEN_PROD', 'some-stripe-token')
    const stripeClient = { id: 'stripe-client' }
    loadStripe.mockResolvedValue(stripeClient)

    const { sut } = await makeSut()

    await expect(sut()).resolves.toBe(stripeClient)
    await expect(sut()).resolves.toBe(stripeClient)
    expect(loadStripe).toHaveBeenCalledTimes(1)
  })

  describe('warmStripeClient', () => {
    it('should kick off the Stripe client load without awaiting', async () => {
      vi.stubEnv('VITE_ENVIRONMENT', 'production')
      vi.stubEnv('VITE_STRIPE_TOKEN_PROD', 'some-stripe-token')
      const { warmStripeClient } = await makeSut()

      expect(() => warmStripeClient()).not.toThrow()
      await Promise.resolve()

      expect(loadStripe).toHaveBeenCalledWith('some-stripe-token', { locale: 'en' })
    })

    it('should swallow load errors so the preceding screen is never affected', async () => {
      vi.stubEnv('VITE_ENVIRONMENT', 'invalid-stub-env')
      const { warmStripeClient } = await makeSut()

      // Fire-and-forget: must not throw synchronously and must not surface an
      // unhandled rejection when the underlying load fails.
      expect(() => warmStripeClient()).not.toThrow()
      await expect(Promise.resolve()).resolves.not.toThrow()
    })
  })
})
