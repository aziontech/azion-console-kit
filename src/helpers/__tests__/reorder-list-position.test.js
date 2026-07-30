import { describe, it, expect } from 'vitest'
import { clampIndex, moveItemToPosition } from '../reorder-list-position'

describe('clampIndex', () => {
  it('returns the index unchanged when inside [0, max]', () => {
    expect(clampIndex(2, 4)).toBe(2)
    expect(clampIndex(0, 4)).toBe(0)
    expect(clampIndex(4, 4)).toBe(4)
  })

  it('clamps a negative index to 0', () => {
    expect(clampIndex(-1, 4)).toBe(0)
    expect(clampIndex(-99, 4)).toBe(0)
  })

  it('clamps an index past max down to max', () => {
    expect(clampIndex(5, 4)).toBe(4)
    expect(clampIndex(99, 4)).toBe(4)
  })

  it('collapses a negative max (empty list) to 0', () => {
    expect(clampIndex(3, -1)).toBe(0)
    expect(clampIndex(-3, -1)).toBe(0)
  })
})

describe('moveItemToPosition', () => {
  it('moves an item down to a later position', () => {
    // remove index 0, insert at clamped target 2
    expect(moveItemToPosition(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('moves an item up to an earlier position', () => {
    expect(moveItemToPosition(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c'])
  })

  it('clamps a target past the end onto the last slot', () => {
    expect(moveItemToPosition(['a', 'b', 'c'], 0, 99)).toEqual(['b', 'c', 'a'])
  })

  it('clamps a negative target onto the first slot', () => {
    expect(moveItemToPosition(['a', 'b', 'c'], 2, -5)).toEqual(['c', 'a', 'b'])
  })

  it('returns an unchanged copy when the item is already at the clamped target', () => {
    const input = ['a', 'b', 'c']
    const result = moveItemToPosition(input, 1, 1)
    expect(result).toEqual(['a', 'b', 'c'])
    expect(result).not.toBe(input)
  })

  it('returns an unchanged copy when fromIndex is out of range', () => {
    expect(moveItemToPosition(['a', 'b'], -1, 0)).toEqual(['a', 'b'])
    expect(moveItemToPosition(['a', 'b'], 5, 0)).toEqual(['a', 'b'])
  })

  it('never mutates the input array', () => {
    const input = ['a', 'b', 'c', 'd']
    moveItemToPosition(input, 0, 3)
    expect(input).toEqual(['a', 'b', 'c', 'd'])
  })

  it('preserves item references (reorders the same objects)', () => {
    const ruleA = { id: 1 }
    const ruleB = { id: 2 }
    const ruleC = { id: 3 }
    const result = moveItemToPosition([ruleA, ruleB, ruleC], 0, 2)
    expect(result).toEqual([ruleB, ruleC, ruleA])
    expect(result[2]).toBe(ruleA)
    expect(result[0]).toBe(ruleB)
  })

  it('handles single-element and empty lists', () => {
    expect(moveItemToPosition(['only'], 0, 5)).toEqual(['only'])
    expect(moveItemToPosition([], 0, 0)).toEqual([])
  })
})
