import { describe, expect, it, vi } from 'vitest'

vi.mock('@/helpers/convert-date', () => ({
  formatDateToDayMonthYearHour: vi.fn(() => 'formatted-date'),
  convertToRelativeTime: vi.fn(() => 'relative-time')
}))

import { VariablesV6Adapter } from '@/services/v2/variables/v6/variables-v6-adapter'

const MASK = '••••••••'

const makeApiItem = (overrides = {}) => ({
  uuid: 'uuid-1',
  key: 'API_KEY',
  value: 'super-secret-value',
  secret: false,
  scope: 'global',
  last_editor: 'user@azion.com',
  updated_at: '2026-07-08T12:00:00Z',
  ...overrides
})

const makeVersionItem = (overrides = {}) => ({
  version_id: 'ver-1',
  version_state: 'archived',
  value: 'plain-version-value',
  secret: false,
  last_editor: 'user@azion.com',
  created_at: '2026-07-08T12:00:00Z',
  ...overrides
})

describe('VariablesV6Adapter — P2 secret masking', () => {
  describe('transformList', () => {
    it('masks the value of secret items and keeps plaintext for non-secret items', () => {
      const secretItem = makeApiItem({ uuid: 'uuid-secret', value: 'top-secret', secret: true })
      const plainItem = makeApiItem({ uuid: 'uuid-plain', value: 'visible', secret: false })

      const [secret, plain] = VariablesV6Adapter.transformList([secretItem, plainItem])

      expect(secret.value.isSecret).toBe(true)
      expect(secret.value.content).toBe(MASK)

      expect(plain.value.isSecret).toBe(false)
      expect(plain.value.content).toBe('visible')
    })

    it('never leaks the raw secret value anywhere in the output shape', () => {
      const secretItem = makeApiItem({ value: 'leak-me', secret: true })

      const [row] = VariablesV6Adapter.transformList([secretItem])

      expect(JSON.stringify(row)).not.toContain('leak-me')
    })

    it('returns an empty array for a non-array input', () => {
      expect(VariablesV6Adapter.transformList(null)).toEqual([])
    })
  })

  describe('transformItem', () => {
    it('masks a secret item', () => {
      const result = VariablesV6Adapter.transformItem(
        makeApiItem({ value: 'top-secret', secret: true })
      )

      expect(result.value.isSecret).toBe(true)
      expect(result.value.content).toBe(MASK)
    })

    it('keeps plaintext for a non-secret item', () => {
      const result = VariablesV6Adapter.transformItem(
        makeApiItem({ value: 'visible', secret: false })
      )

      expect(result.value.isSecret).toBe(false)
      expect(result.value.content).toBe('visible')
    })

    it('unwraps a .data envelope and still masks secrets', () => {
      const result = VariablesV6Adapter.transformItem({
        data: makeApiItem({ value: 'enveloped-secret', secret: true })
      })

      expect(result.value.isSecret).toBe(true)
      expect(result.value.content).toBe(MASK)
      expect(JSON.stringify(result)).not.toContain('enveloped-secret')
    })

    it('returns null when there is no item', () => {
      expect(VariablesV6Adapter.transformItem(null)).toBeNull()
    })
  })

  describe('transformVersionsList', () => {
    it('maps version metadata without a value field', () => {
      const result = VariablesV6Adapter.transformVersionsList([
        makeVersionItem({ version_id: 'ver-1', version: '1' })
      ])

      expect(result[0]).toMatchObject({
        id: 'ver-1',
        label: 'ver-1',
        lastEditor: 'user@azion.com'
      })
      expect(result[0]).not.toHaveProperty('value')
      expect(result[0]).not.toHaveProperty('versionNumber')
      expect(result[0]).not.toHaveProperty('version')
    })

    it('returns an empty array for a non-array input', () => {
      expect(VariablesV6Adapter.transformVersionsList(undefined)).toEqual([])
    })
  })

  describe('transformFormItem', () => {
    it('blanks the value for a secret item', () => {
      const result = VariablesV6Adapter.transformFormItem(
        makeApiItem({ value: 'top-secret', secret: true })
      )

      expect(result.value).toBe('')
      expect(result.secret).toBe(true)
    })

    it('keeps the raw value for a non-secret item', () => {
      const result = VariablesV6Adapter.transformFormItem(
        makeApiItem({ value: 'visible', secret: false })
      )

      expect(result.value).toBe('visible')
      expect(result.secret).toBe(false)
    })

    it('unwraps a .data envelope and blanks a secret value', () => {
      const result = VariablesV6Adapter.transformFormItem({
        data: makeApiItem({ value: 'enveloped-secret', secret: true })
      })

      expect(result.value).toBe('')
      expect(JSON.stringify(result)).not.toContain('enveloped-secret')
    })

    it('returns null when there is no item', () => {
      expect(VariablesV6Adapter.transformFormItem(null)).toBeNull()
    })
  })
})

describe('VariablesV6Adapter — P3 partial PATCH payload', () => {
  const initial = { key: 'KEY', value: 'value', secret: false, scope: 'global' }

  it('returns an empty payload when nothing changed', () => {
    const result = VariablesV6Adapter.transformPatchPayload({ ...initial }, initial)

    expect(result).toEqual({})
  })

  it('includes only key when only key changed', () => {
    const result = VariablesV6Adapter.transformPatchPayload({ ...initial, key: 'NEW_KEY' }, initial)

    expect(result).toEqual({ key: 'NEW_KEY' })
  })

  it('includes only value when only value changed', () => {
    const result = VariablesV6Adapter.transformPatchPayload(
      { ...initial, value: 'new-value' },
      initial
    )

    expect(result).toEqual({ value: 'new-value' })
  })

  it('includes only secret when secret flips false to true and value is unchanged', () => {
    const result = VariablesV6Adapter.transformPatchPayload({ ...initial, secret: true }, initial)

    expect(result).toEqual({ secret: true })
  })

  it('includes secret and value when both changed and the value is not empty', () => {
    const result = VariablesV6Adapter.transformPatchPayload(
      { ...initial, secret: true, value: 'new-secret' },
      initial
    )

    expect(result).toEqual({ secret: true, value: 'new-secret' })
  })

  it('omits an empty-string secret value even when it changed from a previous value', () => {
    const result = VariablesV6Adapter.transformPatchPayload(
      { ...initial, secret: true, value: '' },
      initial
    )

    expect(result).toEqual({ secret: true })
    expect(result).not.toHaveProperty('value')
  })

  it('omits a null secret value', () => {
    const result = VariablesV6Adapter.transformPatchPayload(
      { ...initial, secret: true, value: null },
      initial
    )

    expect(result).not.toHaveProperty('value')
  })

  it('omits an undefined secret value', () => {
    const result = VariablesV6Adapter.transformPatchPayload(
      { ...initial, secret: true, value: undefined },
      initial
    )

    expect(result).not.toHaveProperty('value')
  })

  it('omits the value when both current and initial secret values are empty strings', () => {
    const emptyInitial = { key: 'KEY', value: '', secret: true, scope: 'global' }
    const result = VariablesV6Adapter.transformPatchPayload(
      { ...emptyInitial, value: '' },
      emptyInitial
    )

    expect(result).not.toHaveProperty('value')
    expect(result).toEqual({})
  })

  it('never includes scope even when scope is present in values', () => {
    const result = VariablesV6Adapter.transformPatchPayload(
      { ...initial, key: 'NEW_KEY', scope: 'edge_application' },
      initial
    )

    expect(result).not.toHaveProperty('scope')
    expect(result).toEqual({ key: 'NEW_KEY' })
  })

  it('includes only the fields that changed on multiple changes', () => {
    const result = VariablesV6Adapter.transformPatchPayload(
      { key: 'NEW_KEY', value: 'new-value', secret: false, scope: 'global' },
      initial
    )

    expect(result).toEqual({ key: 'NEW_KEY', value: 'new-value' })
  })

  it('returns an empty payload when both arguments are missing', () => {
    expect(VariablesV6Adapter.transformPatchPayload()).toEqual({})
  })
})

describe('VariablesV6Adapter — transformCreatePayload scope', () => {
  const buildScope = (scope) =>
    VariablesV6Adapter.transformCreatePayload({ key: 'K', value: 'v', secret: false, scope }).scope

  it('maps a global scope without an id', () => {
    expect(buildScope([{ type: 'global', resourceType: '', id: '' }])).toEqual([
      { resource_type: 'global' }
    ])
  })

  it('maps environment and deployment scopes to their <type>_id', () => {
    expect(
      buildScope([
        { type: 'environment', resourceType: '', id: '123' },
        { type: 'deployment', resourceType: '', id: '456' }
      ])
    ).toEqual([
      { resource_type: 'environment', environment_id: '123' },
      { resource_type: 'deployment', deployment_id: '456' }
    ])
  })

  it('maps a resource scope to its concrete resourceType and <resourceType>_id', () => {
    expect(
      buildScope([
        { type: 'resource', resourceType: 'application', id: '1001' },
        { type: 'resource', resourceType: 'firewall', id: '999' }
      ])
    ).toEqual([
      { resource_type: 'application', application_id: '1001' },
      { resource_type: 'firewall', firewall_id: '999' }
    ])
  })

  it('returns an empty scope array when scope is not an array', () => {
    expect(
      VariablesV6Adapter.transformCreatePayload({ key: 'K', value: 'v', secret: false }).scope
    ).toEqual([])
  })
})

describe('VariablesV6Adapter — extras', () => {
  it('marks isCurrent from version_state — ready is current, archived is historical', () => {
    const result = VariablesV6Adapter.transformVersionsList([
      makeVersionItem({ version_id: 'ver-1', version_state: 'ready' }),
      makeVersionItem({ version_id: 'ver-2', version_state: 'archived' }),
      makeVersionItem({ version_id: 'ver-3', version_state: 'archived' })
    ])

    expect(result.find((entry) => entry.id === 'ver-1').isCurrent).toBe(true)
    expect(result.find((entry) => entry.id === 'ver-2').isCurrent).toBe(false)
    expect(result.find((entry) => entry.id === 'ver-3').isCurrent).toBe(false)
  })

  it('exposes the raw versionState on each mapped row', () => {
    const result = VariablesV6Adapter.transformVersionsList([
      makeVersionItem({ version_id: 'ver-1', version_state: 'ready' })
    ])

    expect(result[0].versionState).toBe('ready')
  })

  it('returns an empty revert payload', () => {
    expect(VariablesV6Adapter.transformRevertPayload()).toEqual({})
  })
})
