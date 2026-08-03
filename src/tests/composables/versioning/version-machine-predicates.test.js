import { describe, it, expect } from 'vitest'
import {
  VERSION_STATES,
  isEditable,
  isProcessing,
  isImmutable,
  isReady,
  canArchive,
  canDelete
} from '@/composables/versioning/version-machine'

const ALL_STATES = [
  VERSION_STATES.DRAFT,
  VERSION_STATES.QUEUED,
  VERSION_STATES.BUILDING,
  VERSION_STATES.READY,
  VERSION_STATES.ACTIVE,
  VERSION_STATES.ARCHIVED,
  VERSION_STATES.CANCELED,
  VERSION_STATES.ERROR
]

describe('version-machine predicates cover the eight-state domain', () => {
  it('ALL_STATES is exactly the eight canonical states', () => {
    expect([...ALL_STATES].sort()).toEqual(
      ['active', 'archived', 'building', 'canceled', 'draft', 'error', 'queued', 'ready'].sort()
    )
  })
})

describe('isImmutable — frozen artifact states', () => {
  it.each(['ready', 'active', 'archived'])('is true for `%s`', (state) => {
    expect(isImmutable(state)).toBe(true)
  })

  it.each(['draft', 'queued', 'building', 'canceled', 'error'])('is false for `%s`', (state) => {
    expect(isImmutable(state)).toBe(false)
  })
})

describe('isEditable — user can mutate the payload', () => {
  it.each(['draft', 'canceled', 'error'])('is true for `%s`', (state) => {
    expect(isEditable(state)).toBe(true)
  })

  it.each(['queued', 'building', 'ready', 'active', 'archived'])('is false for `%s`', (state) => {
    expect(isEditable(state)).toBe(false)
  })
})

describe('isProcessing — platform is queuing or building', () => {
  it.each(['queued', 'building'])('is true for `%s`', (state) => {
    expect(isProcessing(state)).toBe(true)
  })

  it.each(['draft', 'ready', 'active', 'archived', 'canceled', 'error'])(
    'is false for `%s`',
    (state) => {
      expect(isProcessing(state)).toBe(false)
    }
  )
})

describe('isImmutable / isEditable / isProcessing are mutually exclusive per state', () => {
  it.each(ALL_STATES)('`%s` matches exactly one lifecycle predicate', (state) => {
    const matches = [isEditable(state), isProcessing(state), isImmutable(state)].filter(Boolean)
    expect(matches).toHaveLength(1)
  })
})

describe('isReady — promote is enabled only for a built, idle version', () => {
  it('is true for `ready`', () => {
    expect(isReady('ready')).toBe(true)
  })

  it.each(['draft', 'queued', 'building', 'active', 'archived', 'canceled', 'error'])(
    'is false for `%s`',
    (state) => {
      expect(isReady(state)).toBe(false)
    }
  )
})

describe('canArchive — built-but-idle or recoverable', () => {
  it.each(['ready', 'error', 'canceled'])('is true for `%s`', (state) => {
    expect(canArchive(state)).toBe(true)
  })

  it.each(['draft', 'queued', 'building', 'active', 'archived'])('is false for `%s`', (state) => {
    expect(canArchive(state)).toBe(false)
  })
})

describe('canDelete — anything still present may be deleted', () => {
  it.each(ALL_STATES)('is true for the present state `%s`', (state) => {
    expect(canDelete(state)).toBe(true)
  })

  it('is false only for an absent (`deleted`) version', () => {
    expect(canDelete('deleted')).toBe(false)
  })
})
