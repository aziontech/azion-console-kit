import { describe, expect, it } from 'vitest'
import {
  toReadyVersionOptions,
  toVersionOptions
} from '@/templates/release-composition/version-options'

const makeVersion = (overrides = {}) => ({
  id: 'v-001',
  state: 'ready',
  comment: 'Initial cache rules',
  createdAt: '2026-06-01T10:00:00Z',
  lastEditor: 'ada.lovelace@azion.com',
  isCurrent: false,
  ...overrides
})

describe('toReadyVersionOptions', () => {
  it('should keep only versions whose state is exactly "ready"', () => {
    const versions = [
      makeVersion({ id: 'ready-1', state: 'ready' }),
      makeVersion({ id: 'active-1', state: 'active' }),
      makeVersion({ id: 'draft-1', state: 'draft' }),
      makeVersion({ id: 'building-1', state: 'building' }),
      makeVersion({ id: 'archived-1', state: 'archived' }),
      makeVersion({ id: 'error-1', state: 'error' })
    ]

    const result = toReadyVersionOptions(versions)

    expect(result).toHaveLength(1)
    expect(result.map((option) => option.value)).toEqual(['ready-1'])
  })

  it('should exclude "active" versions even though they are deployable', () => {
    const versions = [makeVersion({ id: 'active-1', state: 'active' })]

    expect(toReadyVersionOptions(versions)).toEqual([])
  })

  it('should map the option shape with comment as label and id as value', () => {
    const versions = [
      makeVersion({
        id: 'fn-version-42',
        state: 'ready',
        comment: 'Bump runtime to 20',
        createdAt: '2026-06-15T08:30:00Z',
        lastEditor: 'grace.hopper@azion.com',
        isCurrent: true
      })
    ]

    const [option] = toReadyVersionOptions(versions)

    expect(option).toEqual({
      label: 'Bump runtime to 20',
      value: 'fn-version-42',
      createdAt: '2026-06-15T08:30:00Z',
      author: 'grace.hopper@azion.com',
      isCurrent: true
    })
  })

  it('should fall back to id for label when comment is missing', () => {
    const versions = [makeVersion({ id: 'fn-version-99', state: 'ready', comment: '' })]

    const [option] = toReadyVersionOptions(versions)

    expect(option.label).toBe('fn-version-99')
    expect(option.value).toBe('fn-version-99')
  })

  it('should derive author from lastEditor and default to null when absent', () => {
    const versions = [makeVersion({ id: 'no-editor', state: 'ready', lastEditor: undefined })]

    const [option] = toReadyVersionOptions(versions)

    expect(option.author).toBeNull()
  })

  it('should default createdAt to null when absent', () => {
    const versions = [makeVersion({ id: 'no-date', state: 'ready', createdAt: undefined })]

    const [option] = toReadyVersionOptions(versions)

    expect(option.createdAt).toBeNull()
  })

  it('should coerce isCurrent to a strict boolean', () => {
    const versions = [
      makeVersion({ id: 'truthy', state: 'ready', isCurrent: 1 }),
      makeVersion({ id: 'falsy', state: 'ready', isCurrent: undefined })
    ]

    const [truthy, falsy] = toReadyVersionOptions(versions)

    expect(truthy.isCurrent).toBe(true)
    expect(falsy.isCurrent).toBe(false)
  })

  it('should return an empty array when given a non-array input', () => {
    expect(toReadyVersionOptions(null)).toEqual([])
    expect(toReadyVersionOptions(undefined)).toEqual([])
    expect(toReadyVersionOptions('ready')).toEqual([])
    expect(toReadyVersionOptions({ state: 'ready' })).toEqual([])
  })

  it('should return an empty array for an empty list', () => {
    expect(toReadyVersionOptions([])).toEqual([])
  })

  it('should diverge from toVersionOptions by excluding active versions', () => {
    const versions = [
      makeVersion({ id: 'ready-1', state: 'ready' }),
      makeVersion({ id: 'active-1', state: 'active' })
    ]

    const functionOptions = toReadyVersionOptions(versions)
    const sharedOptions = toVersionOptions(versions)

    expect(functionOptions.map((option) => option.value)).toEqual(['ready-1'])
    expect(sharedOptions.map((option) => option.value)).toEqual(['ready-1', 'active-1'])
  })
})
