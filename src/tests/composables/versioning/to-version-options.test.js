import { describe, it, expect } from 'vitest'
import {
  DEPLOYABLE_STATES,
  toVersionOption,
  toDeployableVersionOptions
} from '@/composables/versioning/to-version-options'

const version = (overrides = {}) => ({
  id: 'AV0001',
  state: 'ready',
  comment: 'cache rules v1',
  createdAt: '2026-06-01T10:00:00Z',
  lastEditor: 'ada@azion.com',
  ...overrides
})

describe('DEPLOYABLE_STATES', () => {
  it('is exactly ready + active (a version is deployable once built)', () => {
    expect(DEPLOYABLE_STATES).toEqual(['ready', 'active'])
  })
})

describe('toVersionOption', () => {
  it('maps a version to the shared dropdown option shape', () => {
    expect(toVersionOption(version(), 'AV0001')).toEqual({
      id: 'AV0001',
      value: 'AV0001',
      label: 'cache rules v1',
      createdAt: '2026-06-01T10:00:00Z',
      author: 'ada@azion.com',
      isCurrent: true
    })
  })

  it('falls back to the id for the label and null for missing metadata', () => {
    const option = toVersionOption({ id: 'AV0002' }, 'other')
    expect(option).toEqual({
      id: 'AV0002',
      value: 'AV0002',
      label: 'AV0002',
      createdAt: null,
      author: null,
      isCurrent: false
    })
  })

  it('marks isCurrent by identity against the passed current version id', () => {
    expect(toVersionOption(version({ id: 'A' }), 'A').isCurrent).toBe(true)
    expect(toVersionOption(version({ id: 'A' }), 'B').isCurrent).toBe(false)
    expect(toVersionOption(version({ id: 'A' }), null).isCurrent).toBe(false)
  })
})

describe('toDeployableVersionOptions', () => {
  it('keeps only ready/active versions and maps them to options', () => {
    const result = toDeployableVersionOptions(
      [
        version({ id: 'ready-1', state: 'ready' }),
        version({ id: 'active-1', state: 'active' }),
        version({ id: 'draft-1', state: 'draft' }),
        version({ id: 'building-1', state: 'building' }),
        version({ id: 'archived-1', state: 'archived' }),
        version({ id: 'error-1', state: 'error' })
      ],
      'active-1'
    )

    expect(result.map((option) => option.id)).toEqual(['ready-1', 'active-1'])
    expect(result.find((option) => option.id === 'active-1').isCurrent).toBe(true)
  })

  it('returns an empty array for nullish or all-non-deployable input', () => {
    expect(toDeployableVersionOptions(null)).toEqual([])
    expect(toDeployableVersionOptions(undefined)).toEqual([])
    expect(toDeployableVersionOptions([version({ state: 'draft' })])).toEqual([])
  })

  it('defaults currentVersionId to null so nothing is marked current', () => {
    const result = toDeployableVersionOptions([version({ id: 'ready-1' })])
    expect(result[0].isCurrent).toBe(false)
  })
})
