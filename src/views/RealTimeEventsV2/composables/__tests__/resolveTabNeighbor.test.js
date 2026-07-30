import { describe, it, expect } from 'vitest'
import { resolveTabNeighbor } from '../utils/resolveTabNeighbor.js'

/**
 * Unit tests for resolveTabNeighbor — the pure neighbor resolver used by
 * TabsView.handleCloseTab to fix C4 (req 2.2): the neighbor of a closed tab
 * must come from the COMBINED visual tab order, not a positional index into
 * the partial openTabs array.
 *
 * Combined order convention:
 *   [ pinned Events (id=null), ...additional Events tabs, ...Dashboard tabs ]
 */
describe('resolveTabNeighbor', () => {
  it('picks the left neighbor when closing a middle tab', () => {
    const order = [{ id: null }, { id: 'events:1' }, { id: 'a' }, { id: 'b' }]
    expect(resolveTabNeighbor(order, 'a')).toBe('events:1')
  })

  it('picks the left neighbor when closing the last tab', () => {
    const order = [{ id: null }, { id: 'a' }, { id: 'b' }]
    expect(resolveTabNeighbor(order, 'b')).toBe('a')
  })

  it('C4: closing the first dashboard tab activates the visually-adjacent Events tab (not the pinned tab)', () => {
    const order = [{ id: null }, { id: 'events:1' }, { id: 'a' }]
    expect(resolveTabNeighbor(order, 'a')).toBe('events:1')
  })

  it('falls back to the pinned Events tab (null) when the closed tab is the only non-pinned tab', () => {
    const order = [{ id: null }, { id: 'a' }]
    expect(resolveTabNeighbor(order, 'a')).toBe(null)
  })

  it('resolves to an events:* id when it is the left neighbor', () => {
    const order = [{ id: null }, { id: 'events:1' }, { id: 'events:2' }]
    expect(resolveTabNeighbor(order, 'events:2')).toBe('events:1')
  })

  it('takes the right neighbor when the closed tab is first in the order', () => {
    // Defensive: the pinned tab is never closable, but if idx===0 the resolver
    // still returns the right neighbor rather than an undefined left neighbor.
    const order = [{ id: 'events:1' }, { id: 'a' }]
    expect(resolveTabNeighbor(order, 'events:1')).toBe('a')
  })

  it('returns null for an unknown id (no neighbor to resolve)', () => {
    const order = [{ id: null }, { id: 'a' }]
    expect(resolveTabNeighbor(order, 'does-not-exist')).toBe(null)
  })

  it('returns null for an empty or non-array order', () => {
    expect(resolveTabNeighbor([], 'a')).toBe(null)
    expect(resolveTabNeighbor(null, 'a')).toBe(null)
    expect(resolveTabNeighbor(undefined, 'a')).toBe(null)
  })

  it('normalizes undefined/null tab ids to the pinned Events tab', () => {
    const order = [{ id: undefined }, { id: 'a' }]
    // Closing 'a' → left neighbor is the pinned tab (id undefined) → null.
    expect(resolveTabNeighbor(order, 'a')).toBe(null)
  })
})
