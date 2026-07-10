import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hasFlagUseV6Configurations } from '@/composables/user-flag'
import { certificatesTabGuard } from '@/router/routes/digital-certificates-routes'

vi.mock('@/composables/user-flag', () => ({
  hasFlagUseV6Configurations: vi.fn()
}))

describe('certificatesTabGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect to /not-found when flag is false and tab is present', () => {
    hasFlagUseV6Configurations.mockReturnValue(false)

    const result = certificatesTabGuard({ params: { id: '1', tab: 'version-history' } })

    expect(result).toBe('/not-found')
  })

  it('should allow navigation when flag is false and there is no tab', () => {
    hasFlagUseV6Configurations.mockReturnValue(false)

    const result = certificatesTabGuard({ params: { id: '1' } })

    expect(result).toBe(true)
  })

  it('should allow navigation when flag is true and tab is present', () => {
    hasFlagUseV6Configurations.mockReturnValue(true)

    const result = certificatesTabGuard({ params: { id: '1', tab: 'version-history' } })

    expect(result).toBe(true)
  })

  it('should allow navigation when flag is true and there is no tab', () => {
    hasFlagUseV6Configurations.mockReturnValue(true)

    const result = certificatesTabGuard({ params: { id: '1' } })

    expect(result).toBe(true)
  })
})
