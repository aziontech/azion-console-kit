// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { AbortManager } from '@/services/v2/base/http/abortManager'

/**
 * AbortManager — request cancellation for the whole v2 layer (test-maturity,
 * deep pass). Includes the regression test for the inverted group-cleanup
 * condition found during this coverage work: aborting ONE member of a group
 * used to orphan the remaining members.
 */
describe('single-request lifecycle', () => {
  it('hands out a live signal and aborts it by identifier', () => {
    const manager = new AbortManager()
    const signal = manager.getSignal('req-1')

    expect(signal.aborted).toBe(false)
    manager.abort('req-1')
    expect(signal.aborted).toBe(true)
  })

  it('aborting an unknown identifier is a no-op (no throw)', () => {
    expect(() => new AbortManager().abort('ghost')).not.toThrow()
  })

  it('an aborted identifier can be reused for a fresh request', () => {
    const manager = new AbortManager()
    manager.getSignal('req-1')
    manager.abort('req-1')

    const fresh = manager.getSignal('req-1')

    expect(fresh.aborted).toBe(false)
  })
})

describe('group lifecycle', () => {
  it('abortGroup aborts every member of the group', () => {
    const manager = new AbortManager()
    const first = manager.getSignal('a', 'list')
    const second = manager.getSignal('b', 'list')

    manager.abortGroup('list')

    expect(first.aborted).toBe(true)
    expect(second.aborted).toBe(true)
  })

  it('REGRESSION: aborting one member must NOT orphan the rest of the group', () => {
    const manager = new AbortManager()
    manager.getSignal('a', 'list')
    const second = manager.getSignal('b', 'list')

    manager.abort('a') // before the fix, this deleted the whole group entry
    manager.abortGroup('list')

    expect(second.aborted).toBe(true)
  })

  it('abortAll aborts everything across groups and loose requests', () => {
    const manager = new AbortManager()
    const grouped = manager.getSignal('a', 'g1')
    const loose = manager.getSignal('b')

    manager.abortAll()

    expect(grouped.aborted).toBe(true)
    expect(loose.aborted).toBe(true)
  })
})
