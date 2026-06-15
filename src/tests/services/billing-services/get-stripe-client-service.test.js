import { describe, expect, it, vi, afterEach } from 'vitest'
import { getStripeClientService } from '@/services/billing-services'
import { loadStripe } from '@stripe/stripe-js/pure'

vi.mock('@stripe/stripe-js/pure', () => ({
  loadStripe: vi.fn()
}))

const makeSut = () => {
  return {
    sut: getStripeClientService
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetAllMocks()
})

describe('Billing Services', () => {
  it('should return an error when incorrect environment is provided', async () => {
    vi.stubEnv('VITE_ENVIRONMENT', 'invalid-stub-env')
    const { sut } = makeSut()

    await expect(sut()).rejects.toThrowError(
      'Provide a valid environment to select correct tracking token'
    )
  })

  it('should return an error when stripe token is not provided', async () => {
    vi.stubEnv('VITE_ENVIRONMENT', 'development')
    vi.stubEnv('VITE_STRIPE_TOKEN_DEV', '')

    const { sut } = makeSut()

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

    const { sut } = makeSut()

    await sut()

    expect(loadStripe.setLoadParameters).toHaveBeenCalledWith({ advancedFraudSignals: false })
  })

  it('should return the stripe client when variables are provided', async () => {
    vi.stubEnv('VITE_ENVIRONMENT', 'production')
    vi.stubEnv('VITE_STRIPE_TOKEN_PROD', 'some-stripe-token')

    const { sut } = makeSut()

    await expect(sut()).resolves.not.toThrowError()
    expect(loadStripe).toHaveBeenCalledWith('some-stripe-token', { locale: 'en' })
  })
})
