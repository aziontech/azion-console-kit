import { describe, it, expect } from 'vitest'
import {
  DEPLOYABLE_STATES,
  toVersionOption,
  toDeployableVersionOptions
} from '@/composables/versioning/to-version-options'

/**
 * Edge / empty-input contract for the to-version-options module.
 *
 * The deploy dropdown feeds these helpers whatever the versions query returns —
 * which is `null`/`undefined` before the first load and `[]` for a resource with
 * no versions. None of those may throw or leak a nullish array. This file owns
 * the degenerate-input surface across EVERY export; the happy-path mapping lives
 * in to-version-options.test.js.
 */

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

    // Passing an explicit currentVersionId (as toDeployableVersionOptions always
    // does) keeps isCurrent false for an id-less item.
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
    // toVersionOption has no default for currentVersionId (unlike
    // toDeployableVersionOptions). Calling it with a single arg compares
    // undefined === undefined, so an id-less item reports itself current. This
    // pins that edge so a future default can't silently change it.
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
