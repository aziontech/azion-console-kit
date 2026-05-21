import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { encodeShareState, decodeShareState } from '@/services/panels-service'

/**
 * Feature: real-time-events-enhancements
 *
 * **Validates: Requirements 4.1, 4.4, 4.5, 10.3**
 */

// ---------------------------------------------------------------------------
// Shared arbitraries
// ---------------------------------------------------------------------------

const DATASETS = [
  'httpRequests',
  'edgeFunctions',
  'edgeFunctionsConsole',
  'imageProcessor',
  'tieredCache',
  'edgeDNS',
  'dataStream',
  'activityHistory'
]

const arbViewState = fc.record({
  filters: fc.array(fc.record({ key: fc.string(), value: fc.string() }), { maxLength: 5 }),
  tsRange: fc.record({ begin: fc.string(), end: fc.string() }),
  dataset: fc.constantFrom(...DATASETS),
  pageSize: fc.integer({ min: 10, max: 200 })
})

// ---------------------------------------------------------------------------
// Task 5.2 — Property 5: Share_State round-trip with `eventsTab`
// **Validates: Property 5, Requirements 4.1, 4.4, 10.3**
// ---------------------------------------------------------------------------

describe('Property 5: Share_State round-trip with eventsTab', () => {
  const arbEventsTab = fc.record({
    label: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim() !== ''),
    dataset: fc.constantFrom(...DATASETS)
  })

  const arbShareState = fc.record({
    tab: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 20 })),
    viewState: arbViewState,
    eventsTab: arbEventsTab
  })

  it('encodeShareState then decodeShareState yields a deep-equal object', () => {
    fc.assert(
      fc.property(arbShareState, ({ tab, viewState, eventsTab }) => {
        const encoded = encodeShareState({ tab, viewState, eventsTab })
        const decoded = decodeShareState(encoded)

        expect(decoded).not.toBeNull()
        expect(decoded.tab).toEqual(tab)
        expect(decoded.viewState).toEqual(viewState)
        expect(decoded.eventsTab).toEqual(eventsTab)
      }),
      { numRuns: 100 }
    )
  })
})

// ---------------------------------------------------------------------------
// Task 5.3 — Property 6: Share_State backward compatibility
// **Validates: Property 6, Requirement 4.5**
// ---------------------------------------------------------------------------

describe('Property 6: Share_State backward compatibility', () => {
  /**
   * Inline base64/JSON helper — mirrors the internal `safeDecodeBase64Json`
   * without importing it (it is not exported from panels-service).
   *
   * The encoder uses `btoa(encodeURIComponent(JSON.stringify(payload)))`, so
   * the decoder must reverse that: `JSON.parse(decodeURIComponent(atob(encoded)))`.
   * A plain `JSON.parse(atob(encoded))` fallback handles any legacy payloads
   * that were encoded without URI-encoding.
   */
  function safeDecodeBase64Json(encoded) {
    try {
      return JSON.parse(decodeURIComponent(atob(encoded)))
    } catch {
      try {
        return JSON.parse(atob(encoded))
      } catch {
        return null
      }
    }
  }

  /**
   * Reference decoder (pre-extension) — captured fixture.
   * Same logic as the current decodeShareState but without eventsTab handling:
   * just decode and return the raw object if ver === 1.
   */
  function referenceDecodeShareState(encoded) {
    const state = safeDecodeBase64Json(encoded)
    if (!state || typeof state !== 'object' || state.ver !== 1) return null
    return state
  }

  // Old-shape payloads: no eventsTab field
  const arbOldShapeState = fc.record({
    tab: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 20 })),
    viewState: arbViewState
  })

  it('extended decoder output equals reference decoder output for old-shape payloads', () => {
    fc.assert(
      fc.property(arbOldShapeState, ({ tab, viewState }) => {
        const encoded = encodeShareState({ tab, viewState }) // no eventsTab

        // Extended decoder
        const decoded = decodeShareState(encoded)

        // Reference decoder
        const reference = referenceDecodeShareState(encoded)

        // Extended decoder output must equal reference output
        expect(decoded).toEqual(reference)

        // eventsTab must be absent (undefined)
        expect(decoded?.eventsTab).toBeUndefined()
      }),
      { numRuns: 100 }
    )
  })
})
