import { metricsPlaygroundOpener } from '@/helpers'
import { afterAll, describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = metricsPlaygroundOpener

  return {
    sut
  }
}

const scenarios = [
  {
    label: 'should open a new window to metrics playground in prod env',
    environment: 'production',
    expected: 'https://api.azion.com/v4/metrics/graphql'
  },
  {
    label: 'should open a new window to metrics playground in stage env',
    environment: 'stage',
    expected: 'https://stage-api.azion.com/v4/metrics/graphql'
  }
]

describe('metricsPlaygroundOpener', () => {
  afterAll(() => {
    vi.restoreAllMocks()
  })
  it.each(scenarios)('$label', async ({ environment, expected }) => {
    vi.stubEnv('VITE_ENVIRONMENT', environment)
    const mockWindowOpen = vi.fn()
    vi.stubGlobal('window', { open: mockWindowOpen })
    const { sut } = makeSut()

    await sut()

    expect(mockWindowOpen).toHaveBeenCalledTimes(1)
    expect(mockWindowOpen).toHaveBeenCalledWith(expected, '_blank')
  })
})
