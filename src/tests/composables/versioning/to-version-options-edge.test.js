import { describe, it, expect } from 'vitest'
import {
  DEPLOYABLE_STATES,
  toVersionOption,
  toDeployableVersionOptions
} from '@/composables/versioning/to-version-options'

describe('toDeployableVersionOptions — degenerate inputs never throw', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['an empty array', []]
  ])('returns [] for %s', (_label, input) => {
    let result
    expect(() => {
      result = toDeployableVersionOptions(input)
    }).not.toThrow()
    expect(result).toEqual([])
  })

  it('returns [] when nothing in the list is deployable', () => {
    const notDeployable = ['draft', 'queued', 'building', 'archived', 'canceled', 'error'].map(
      (state, index) => ({ id: `v${index}`, state })
    )
    expect(toDeployableVersionOptions(notDeployable)).toEqual([])
  })

  it('defaults currentVersionId so a lone deployable option is not marked current', () => {
    const [option] = toDeployableVersionOptions([{ id: 'ready-1', state: 'ready' }])
    expect(option.isCurrent).toBe(false)
  })
})

describe('toVersionOption — empty object maps to a safe, fully-shaped option', () => {
  it('fills every field with a fallback and never throws on {}', () => {
    let option
    expect(() => {
      option = toVersionOption({}, null)
    }).not.toThrow()

    expect(option).toEqual({
      id: undefined,
      value: undefined,
      label: undefined,
      createdAt: null,
      author: null,
      isCurrent: false
    })
  })

  it('marks {} as current when currentVersionId is omitted (undefined === undefined)', () => {
    expect(toVersionOption({}).isCurrent).toBe(true)
  })

  it('never marks {} as current against a real current id', () => {
    expect(toVersionOption({}, 'AV0001').isCurrent).toBe(false)
  })
})

describe('DEPLOYABLE_STATES — the deployable domain is a non-empty, stable set', () => {
  it('contains exactly the built states ready + active', () => {
    expect(DEPLOYABLE_STATES).toEqual(['ready', 'active'])
  })
})
