import { describe, expect, it } from 'vitest'
import { resolveRollbackTarget } from '@/views/IdentityProviders/utils'

const fixtures = {
  activeSaml: {
    id: 'b7f3c2a1-4e8d-4c6b-9a1f-2d5e6f7a8b9c',
    protocol: 'SAML',
    isActive: true
  },
  activeOidc: {
    id: 'a1c2e3f4-5d6b-4a7c-8e9f-0a1b2c3d4e5f',
    protocol: 'OIDC',
    isActive: true
  },
  inactiveOidc: {
    id: 'c3d4e5f6-7a8b-4c9d-0e1f-2a3b4c5d6e7f',
    protocol: 'OIDC',
    isActive: false
  },
  syntheticActive: {
    id: 'azion-default-sso',
    protocol: 'Internal Identity Source',
    isActive: true
  }
}

describe('Views/IdentityProviders/resolveRollbackTarget', () => {
  it('should return the id and raw protocol of an active SAML2 provider', () => {
    const result = resolveRollbackTarget([fixtures.activeSaml])

    expect(result).toEqual({ id: fixtures.activeSaml.id, protocol: 'SAML' })
  })

  it('should return the id and raw protocol of an active OIDC provider', () => {
    const result = resolveRollbackTarget([fixtures.activeOidc])

    expect(result).toEqual({ id: fixtures.activeOidc.id, protocol: 'OIDC' })
  })

  it('should return the first active non-synthetic provider when several exist', () => {
    const result = resolveRollbackTarget([
      fixtures.inactiveOidc,
      fixtures.activeSaml,
      fixtures.activeOidc
    ])

    expect(result).toEqual({ id: fixtures.activeSaml.id, protocol: 'SAML' })
  })

  it('should ignore the synthetic azion-default-sso even when it is active (Property P1)', () => {
    const result = resolveRollbackTarget([fixtures.syntheticActive, fixtures.inactiveOidc])

    expect(result).toBeNull()
  })

  it('should never return azion-default-sso even if it is the only active entry (Property P1)', () => {
    const result = resolveRollbackTarget([fixtures.syntheticActive])

    expect(result).toBeNull()
  })

  it('should return null when no federated provider is active (Property P2)', () => {
    const result = resolveRollbackTarget([fixtures.inactiveOidc, fixtures.syntheticActive])

    expect(result).toBeNull()
  })

  it('should return null for an empty array (Property P2 / defensive)', () => {
    expect(resolveRollbackTarget([])).toBeNull()
  })

  it('should return null for undefined input (Property P2 / defensive)', () => {
    expect(resolveRollbackTarget(undefined)).toBeNull()
  })
})
