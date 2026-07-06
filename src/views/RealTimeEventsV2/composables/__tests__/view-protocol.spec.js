/**
 * Task 11.4 (req 5.4) — BYTE-EQUIVALENCE oracle for the extracted view-protocol
 * `scheme:key` codec.
 *
 * The parse table and encode literals below were captured VERBATIM from the
 * pre-refactor call sites (useChartConfig.parseViewValue + the four inline
 * `scheme:${key}` template literals in useChartConfig / useEventsExplorer)
 * BEFORE consolidating them into `view-protocol.js`. Every assertion here proves
 * the single module reproduces the old per-site output exactly.
 */
import { describe, it, expect } from 'vitest'
import { parseView, encodeView } from '../view-protocol'
import { parseViewValue } from '../useChartConfig'

// Golden parse table — { input: expected { scheme, key } }. Captured pre-refactor.
const PARSE_GOLDEN = [
  [undefined, { scheme: 'events', key: 'none' }],
  [null, { scheme: 'events', key: 'none' }],
  [42, { scheme: 'events', key: 'none' }],
  ['', { scheme: 'events', key: 'none' }],
  ['none', { scheme: 'events', key: 'none' }],
  ['events', { scheme: 'events', key: 'none' }],
  ['metrics', { scheme: 'events', key: 'none' }],
  ['events:none', { scheme: 'events', key: 'none' }],
  ['events:status', { scheme: 'events', key: 'status' }],
  ['events:requestMethod', { scheme: 'events', key: 'requestMethod' }],
  ['events:', { scheme: 'events', key: 'none' }],
  ['metrics:wafThreats', { scheme: 'metrics', key: 'wafThreats' }],
  ['metrics:botTraffic', { scheme: 'metrics', key: 'botTraffic' }],
  ['metrics:', { scheme: 'metrics', key: 'none' }],
  ['metrics:a:b:c', { scheme: 'metrics', key: 'a:b:c' }],
  ['bogus:x', { scheme: 'events', key: 'none' }],
  ['foo', { scheme: 'events', key: 'none' }],
  [':', { scheme: 'events', key: 'none' }],
  ['events:a:b', { scheme: 'events', key: 'a:b' }],
  ['EVENTS:none', { scheme: 'events', key: 'none' }]
]

// Golden encode table — mirrors the four inline literals verbatim.
const ENCODE_GOLDEN = [
  [{ scheme: 'metrics', key: 'wafThreats' }, 'metrics:wafThreats'],
  [{ scheme: 'events', key: 'none' }, 'events:none'],
  [{ scheme: 'events', key: 'status' }, 'events:status'],
  [{ scheme: 'events', key: '' }, 'events:none'],
  [{ scheme: 'events', key: null }, 'events:none'],
  [{ scheme: 'metrics', key: 'botTraffic' }, 'metrics:botTraffic']
]

describe('view-protocol · parseView (byte-equivalent to old parseViewValue)', () => {
  it.each(PARSE_GOLDEN)('parseView(%o) → golden', (input, expected) => {
    expect(parseView(input)).toEqual(expected)
  })

  it('returns a fresh object each call (no shared mutable default leak)', () => {
    const first = parseView('garbage')
    const second = parseView('garbage')
    expect(first).not.toBe(second)
    first.key = 'mutated'
    expect(parseView('garbage')).toEqual({ scheme: 'events', key: 'none' })
  })
})

describe('view-protocol · encodeView (byte-equivalent to inline literals)', () => {
  it.each(ENCODE_GOLDEN)('encodeView(%o) → %s', (intent, expected) => {
    expect(encodeView(intent)).toBe(expected)
  })
})

describe('view-protocol · backward-compat alias', () => {
  it('useChartConfig.parseViewValue is the same function as parseView', () => {
    expect(parseViewValue).toBe(parseView)
  })
})

describe('view-protocol · round-trip', () => {
  it.each(['events:none', 'events:status', 'metrics:wafThreats', 'metrics:a:b'])(
    'encodeView(parseView(%s)) === %s',
    (value) => {
      expect(encodeView(parseView(value))).toBe(value)
    }
  )
})
