import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { parseView, encodeView } from '@/views/RealTimeEventsV2/composables/view-protocol'

/**
 * Task 11.7 (Property P3) — BYTE-EQUIVALENCE golden oracle for the unified
 * `scheme:key` view codec (`views/RealTimeEventsV2/composables/view-protocol.js`,
 * task 11.4 / req 5.4).
 *
 * The module lives in the RTE composables (a view concern, design §2.1
 * contrato-espinha 8) but its golden lives here per Task 11.7's stated path
 * under the shared tests folder. The `legacyParse` / `legacyEncode`
 * below reproduce the pre-refactor `parseViewValue` and the six scattered
 * `scheme:${key}` inline literals VERBATIM. The PBT (≥100 iters) asserts the
 * consolidated codec parses/encodes byte-for-byte, and that
 * `encode(parse(x)) === x` round-trips for every well-formed wire string.
 */

const SCHEMES = new Set(['events', 'metrics'])
const DEFAULT_VIEW = { scheme: 'events', key: 'none' }

// ── Verbatim pre-refactor parse (the oracle) ────────────────────────────────
function legacyParse(viewValue) {
  if (typeof viewValue !== 'string' || !viewValue.includes(':')) {
    return { ...DEFAULT_VIEW }
  }
  const [scheme, ...rest] = viewValue.split(':')
  const key = rest.join(':')
  if (!SCHEMES.has(scheme)) {
    return { ...DEFAULT_VIEW }
  }
  return { scheme, key: key || 'none' }
}

// ── Verbatim pre-refactor encode literals (the oracle) ──────────────────────
function legacyEncode({ scheme, key } = {}) {
  return scheme === 'metrics' ? `metrics:${key}` : `events:${key || 'none'}`
}

const arbViewString = fc.oneof(
  fc.constantFrom(
    'events:none',
    'events:status',
    'events:requestMethod',
    'metrics:wafThreats',
    'metrics:botTraffic',
    'metrics:a:b:c',
    'events:',
    'metrics:',
    'bogus:x',
    'foo',
    ':',
    'EVENTS:none'
  ),
  fc.string(),
  fc.constantFrom(undefined, null, 42)
)

describe('P3 golden · parseView is byte-equivalent to legacy parseViewValue (11.4)', () => {
  it('deep-equals the legacy parse for every wire string / non-string (≥100 iters)', () => {
    fc.assert(
      fc.property(arbViewString, (value) => {
        expect(parseView(value)).toEqual(legacyParse(value))
      }),
      { numRuns: 200 }
    )
  })
})

describe('P3 golden · encodeView is byte-equivalent to legacy inline literals (11.4)', () => {
  const arbIntent = fc.record({
    scheme: fc.constantFrom('events', 'metrics', 'other'),
    key: fc.oneof(fc.string(), fc.constantFrom('', null, undefined))
  })

  it('deep-equals the legacy encode literals for every intent (≥100 iters)', () => {
    fc.assert(
      fc.property(arbIntent, (intent) => {
        expect(encodeView(intent)).toBe(legacyEncode(intent))
      }),
      { numRuns: 200 }
    )
  })
})

describe('P3 golden · round-trip', () => {
  it('encode(parse(x)) === x for every well-formed wire string', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'events:none',
          'events:status',
          'events:requestMethod',
          'metrics:wafThreats',
          'metrics:botTraffic',
          'metrics:a:b'
        ),
        (value) => {
          expect(encodeView(parseView(value))).toBe(value)
        }
      ),
      { numRuns: 150 }
    )
  })
})
