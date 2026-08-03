import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hasFlagUseV6Configurations } from '@/composables/user-flag'
import { variablesTabGuard } from '@/router/routes/variables-routes'

vi.mock('@/composables/user-flag', () => ({
  hasFlagUseV6Configurations: vi.fn()
}))

describe('variablesTabGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect to /not-found when flag is false and tab is version-history', () => {
    hasFlagUseV6Configurations.mockReturnValue(false)

    const result = variablesTabGuard({ params: { id: '1', tab: 'version-history' } })

    expect(result).toBe('/not-found')
  })

  it('should redirect to /not-found when flag is false and any tab is present', () => {
    hasFlagUseV6Configurations.mockReturnValue(false)

    const result = variablesTabGuard({ params: { id: '1', tab: 'configuration' } })

    expect(result).toBe('/not-found')
  })

  it('should allow navigation when flag is false and there is no tab', () => {
    hasFlagUseV6Configurations.mockReturnValue(false)

    const result = variablesTabGuard({ params: { id: '1' } })

    expect(result).toBe(true)
  })

  it('should allow navigation when flag is true and tab is version-history', () => {
    hasFlagUseV6Configurations.mockReturnValue(true)

    const result = variablesTabGuard({ params: { id: '1', tab: 'version-history' } })

    expect(result).toBe(true)
  })

  it('should allow navigation when flag is true and there is no tab', () => {
    hasFlagUseV6Configurations.mockReturnValue(true)

    const result = variablesTabGuard({ params: { id: '1' } })

    expect(result).toBe(true)
  })

  it('should allow navigation when flag is false and tab is an empty string', () => {
    hasFlagUseV6Configurations.mockReturnValue(false)

    const result = variablesTabGuard({ params: { id: '1', tab: '' } })

    expect(result).toBe(true)
  })
})
