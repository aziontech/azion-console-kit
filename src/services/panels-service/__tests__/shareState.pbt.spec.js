/* eslint-disable no-console */
/**
 * Task 5.3* — PBT Share State Validation (Wave 5)
 *
 * **Validates: Property P6 (share state import validates schema version),
 *  Requirements 1.5, 1.7, N.2**
 *
 * Exercises the negative space of `decodeShareState`: malformed payloads
 * MUST return `null` so the caller (`handleShareImport`) surfaces a
 * "Invalid share link" toast instead of applying corrupted state.
 *
 * Coverage:
 *   - missing `ver` field
 *   - wrong `ver` value (string, future version, 0)
 *   - bad JSON / non-base64 garbage
 *   - non-object payloads (string, array, number) wrapped in Base64
 *   - empty / single-character / whitespace inputs
 *   - valid ShareState roundtrip idempotent (positive control)
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { encodeShareState, decodeShareState } from '../index'

// ---------------------------------------------------------------------------
// Helpers — match the encoder so we can produce realistic malformed payloads
// ---------------------------------------------------------------------------

function encodeBase64Json(payload) {
  return btoa(encodeURIComponent(JSON.stringify(payload)))
}

// ---------------------------------------------------------------------------
// Negative property: malformed payloads must decode to null
// ---------------------------------------------------------------------------

describe('panels-service · decodeShareState negative cases (Task 5.3*)', () => {
  it('returns null for payloads missing the `ver` field', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Anything plausible-looking but without `ver`.
          tab: fc.oneof(fc.constant(null), fc.string()),
          viewState: fc.object()
        }),
        (payload) => {
          const encoded = encodeBase64Json(payload)
          expect(decodeShareState(encoded)).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('returns null for payloads with the wrong `ver` value', () => {
    fc.assert(
      fc.property(
        // Anything that is NOT the current version (1).
        fc.oneof(
          fc.integer().filter((number) => number !== 1),
          fc.string(),
          fc.boolean(),
          fc.constant(null),
          fc.constant(undefined),
          fc.float().filter((number) => number !== 1)
        ),
        (badVer) => {
          const encoded = encodeBase64Json({ ver: badVer, tab: null, viewState: {} })
          expect(decodeShareState(encoded)).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('returns null for non-base64 garbage strings', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 64 }).filter((string) => {
          // Skip strings that happen to be valid base64 — those are tested
          // separately. The filter is intentionally conservative.
          return !/^[A-Za-z0-9+/=]*$/.test(string) || string.includes(' ')
        }),
        (garbage) => {
          expect(decodeShareState(garbage)).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('returns null for empty / whitespace / single-char inputs', () => {
    expect(decodeShareState('')).toBeNull()
    expect(decodeShareState(' ')).toBeNull()
    expect(decodeShareState('=')).toBeNull()
    expect(decodeShareState('!')).toBeNull()
    expect(decodeShareState(null)).toBeNull()
    expect(decodeShareState(undefined)).toBeNull()
  })

  it('returns null when base64 decodes to non-object payloads', () => {
    const cases = ['"just a string"', '42', '[1, 2, 3]', 'null', 'true', 'false']
    cases.forEach((jsonPrim) => {
      const encoded = btoa(encodeURIComponent(jsonPrim))
      expect(decodeShareState(encoded)).toBeNull()
    })
  })

  it('returns null when JSON payload is structurally invalid', () => {
    // Valid base64 but invalid JSON inside.
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 32 }), (junk) => {
        // Only test when the JSON would actually be invalid. The try/catch
        // here is test-control flow (skip the iteration when fast-check
        // accidentally generates a parseable string) — not service error
        // swallowing, so the lint rule is intentionally suppressed.
        // eslint-disable-next-line azion-architecture/no-try-catch-in-services
        try {
          JSON.parse(junk)
          // If it happens to parse, skip.
          return
        } catch {
          /* expected */
        }
        const encoded = btoa(junk)
        // The decoder has a second fallback (`atob` only, no URI decode);
        // both paths should still reject non-JSON.
        expect(decodeShareState(encoded)).toBeNull()
      }),
      { numRuns: 100 }
    )
  })
})

// ---------------------------------------------------------------------------
// Positive property: valid roundtrip stays equal
// ---------------------------------------------------------------------------

describe('panels-service · decodeShareState positive control (Task 5.3*)', () => {
  const DATASETS = ['workloadEvents', 'functionEvents', 'edgeDnsQueriesEvents']

  const arbValidShareState = fc.record({
    tab: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 16 })),
    viewState: fc.record({
      filters: fc.oneof(fc.constant(null), fc.dictionary(fc.string(), fc.string())),
      dataset: fc.constantFrom(...DATASETS),
      pageSize: fc.integer({ min: 10, max: 500 })
    })
  })

  it('valid ShareState is idempotent under encode → decode → encode', () => {
    fc.assert(
      fc.property(arbValidShareState, (state) => {
        const encoded1 = encodeShareState(state)
        const decoded = decodeShareState(encoded1)
        expect(decoded).not.toBeNull()
        const encoded2 = encodeShareState(decoded)
        expect(encoded2).toBe(encoded1)
      }),
      { numRuns: 100 }
    )
  })

  it('valid ShareState preserves all keys (no field is dropped)', () => {
    fc.assert(
      fc.property(arbValidShareState, (state) => {
        const decoded = decodeShareState(encodeShareState(state))
        expect(decoded.tab).toEqual(state.tab)
        expect(decoded.viewState).toEqual(state.viewState)
        expect(decoded.ver).toBe(1)
      }),
      { numRuns: 100 }
    )
  })
})
