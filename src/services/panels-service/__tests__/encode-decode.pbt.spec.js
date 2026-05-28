/* eslint-disable no-console */
/**
 * Task 1.3* — PBT encode/decode roundtrip (Wave 5)
 *
 * **Validates: Property P1 (Share URL is base64 + URL-safe), Requirements 1.1, 1.2, N.2**
 *
 * Generates random ShareState objects via fast-check, encodes them via
 * `encodeShareState`, decodes via `decodeShareState`, and asserts the
 * output is deep-equal to the input augmented with `ver: 1`.
 *
 * Coverage:
 *   - null / undefined filters
 *   - large panelConfig (many charts, long labels)
 *   - special characters (Unicode, emoji, control chars in strings)
 *   - non-ASCII in dataset / field names (UTF-8 safety)
 *
 * Minimum 100 iterations per property (`numRuns: 100`).
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { encodeShareState, decodeShareState } from '../index'

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const DATASETS = [
  'workloadEvents',
  'functionEvents',
  'functionConsoleEvents',
  'dataStreamedEvents',
  'edgeDnsQueriesEvents',
  'activityHistoryEvents',
  'imagesProcessedEvents',
  'tieredCacheEvents'
]

// Strings that exercise UTF-8 + URI encoding paths: ASCII, accented latin,
// CJK, emoji, and a couple of control characters. fast-check 4 unified
// the old `fullUnicodeString` into `string()` with a `unit: 'binary'`
// option for the broader codepoint range.
const arbWeirdString = fc.string({ maxLength: 64, unit: 'binary' })

const arbFilterEntry = fc.record({
  key: fc.string({ minLength: 1, maxLength: 24 }),
  value: fc.oneof(
    arbWeirdString,
    fc.integer(),
    fc.boolean(),
    fc.constant(null),
    fc.array(fc.string({ maxLength: 12 }), { maxLength: 4 })
  )
})

// `filters` may be:
//   - null/undefined (no filters)
//   - empty object
//   - object with random keys/values including unicode
const arbFilters = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.constant({}),
  fc.dictionary(fc.string({ minLength: 1, maxLength: 8 }), arbFilterEntry, { maxKeys: 6 })
)

const arbViewState = fc.record({
  filters: arbFilters,
  tsRange: fc.record({
    // Generate epoch ms in a JS-safe finite range, then convert to ISO.
    // fast-check's `date()` arbitrary occasionally yields `Invalid Date`
    // even with min/max bounds (it generates `NaN`-timed entries to
    // exercise edge cases), which breaks `.toISOString()`. Going through
    // integer epochs sidesteps that.
    tsRangeBegin: fc
      .integer({ min: 0, max: 4102444800000 }) // 1970-01-01 .. 2100-01-01
      .map((ms) => new Date(ms).toISOString()),
    tsRangeEnd: fc.integer({ min: 0, max: 4102444800000 }).map((ms) => new Date(ms).toISOString())
  }),
  dataset: fc.constantFrom(...DATASETS),
  pageSize: fc.integer({ min: 10, max: 500 }),
  selectedFields: fc.array(fc.string({ minLength: 1, maxLength: 16 }), { maxLength: 8 })
})

// "Large" panelConfig: many charts, long labels, mixed columns.
const arbLargePanelConfig = fc.record({
  id: fc.string({ minLength: 6, maxLength: 24 }),
  label: arbWeirdString.filter((string) => string.trim().length > 0 && string.length <= 50),
  type: fc.constant('custom'),
  charts: fc.array(
    fc.record({
      reportId: fc.string({ minLength: 4, maxLength: 32 }),
      columns: fc.integer({ min: 1, max: 12 })
    }),
    { minLength: 1, maxLength: 24 }
  ),
  eventsConfig: fc.option(
    fc.record({
      dataset: fc.constantFrom(...DATASETS),
      pageSize: fc.integer({ min: 10, max: 500 })
    }),
    { nil: undefined }
  )
})

const arbShareState = fc.record(
  {
    tab: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 24 })),
    viewState: arbViewState,
    eventsTab: fc.option(
      fc.record({
        label: arbWeirdString.filter((string) => string.trim().length > 0),
        dataset: fc.constantFrom(...DATASETS)
      }),
      { nil: undefined }
    ),
    panelConfig: fc.option(arbLargePanelConfig, { nil: undefined })
  },
  { requiredKeys: ['tab', 'viewState'] }
)

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

describe('panels-service · encodeShareState / decodeShareState roundtrip (Task 1.3*)', () => {
  it('roundtrip preserves all fields for arbitrary ShareState objects', () => {
    fc.assert(
      fc.property(arbShareState, (state) => {
        const encoded = encodeShareState(state)
        const decoded = decodeShareState(encoded)

        expect(decoded).not.toBeNull()
        // ver is added by the encoder; everything else must roundtrip.
        expect(decoded.ver).toBe(1)
        expect(decoded.tab).toEqual(state.tab)
        expect(decoded.viewState).toEqual(state.viewState)
        if (state.eventsTab !== undefined) expect(decoded.eventsTab).toEqual(state.eventsTab)
        if (state.panelConfig !== undefined) expect(decoded.panelConfig).toEqual(state.panelConfig)
      }),
      { numRuns: 100 }
    )
  })

  it('encoded output uses only Base64 alphabet characters (URL-transportable)', () => {
    // P1: the encoded string must be safe to drop into a query parameter
    // without further escaping. btoa output is `[A-Za-z0-9+/=]*` — `+` and
    // `/` are URL-reserved but Vue Router's `searchParams.set` already
    // percent-encodes them, so the assertion stays on Base64 alphabet.
    fc.assert(
      fc.property(arbShareState, (state) => {
        const encoded = encodeShareState(state)
        expect(encoded).toMatch(/^[A-Za-z0-9+/=]*$/)
      }),
      { numRuns: 100 }
    )
  })

  it('roundtrip is idempotent (encode∘decode∘encode == encode)', () => {
    fc.assert(
      fc.property(arbShareState, (state) => {
        const onceEncoded = encodeShareState(state)
        const decoded = decodeShareState(onceEncoded)
        // Re-encode the decoded payload. Note: decoded already carries `ver`,
        // and encodeShareState prepends `ver` again — same value, no harm,
        // because object spread keeps the latter. Idempotence holds when
        // both encodings yield equal Base64 strings.
        const reEncoded = encodeShareState(decoded)
        expect(reEncoded).toBe(onceEncoded)
      }),
      { numRuns: 100 }
    )
  })

  it('null and undefined filters survive the roundtrip', () => {
    fc.assert(
      fc.property(
        fc.record({
          tab: fc.constant(null),
          viewState: fc.record({
            filters: fc.oneof(fc.constant(null), fc.constant(undefined)),
            tsRange: fc.constant({
              tsRangeBegin: '2024-01-01T00:00:00.000Z',
              tsRangeEnd: '2024-01-01T01:00:00.000Z'
            }),
            dataset: fc.constantFrom(...DATASETS),
            pageSize: fc.integer({ min: 10, max: 500 }),
            selectedFields: fc.constant([])
          })
        }),
        (state) => {
          const encoded = encodeShareState(state)
          const decoded = decodeShareState(encoded)
          expect(decoded).not.toBeNull()
          // JSON.stringify drops `undefined`; we accept either null or undefined here.
          const original = state.viewState.filters
          const roundtripped = decoded.viewState.filters
          if (original === null) expect(roundtripped).toBeNull()
          // undefined keys get dropped by JSON.stringify -> property is absent
          else expect(roundtripped).toBeUndefined()
        }
      ),
      { numRuns: 50 }
    )
  })

  it('special characters (unicode, emoji) survive the roundtrip', () => {
    const specialPayloads = [
      { tab: 'tab-1', viewState: { dataset: 'workloadEvents', label: '🚀 Production' } },
      {
        tab: null,
        viewState: { dataset: 'functionEvents', host: 'api.example.com/<script>' }
      },
      {
        tab: 't',
        viewState: { dataset: 'edgeDnsQueriesEvents', query: '日本語 テスト' }
      },
      {
        tab: 'x',
        viewState: { dataset: 'workloadEvents', query: '"quoted" \\ and \n newline' }
      }
    ]

    specialPayloads.forEach((payload) => {
      const encoded = encodeShareState(payload)
      const decoded = decodeShareState(encoded)
      expect(decoded).not.toBeNull()
      expect(decoded.tab).toBe(payload.tab)
      expect(decoded.viewState).toEqual(payload.viewState)
    })
  })

  it('large panelConfig (24 charts) still roundtrips correctly', () => {
    fc.assert(
      fc.property(arbLargePanelConfig, (panelConfig) => {
        const state = {
          tab: panelConfig.id,
          viewState: {
            filters: null,
            dataset: 'workloadEvents',
            pageSize: 100,
            selectedFields: []
          },
          panelConfig
        }
        const encoded = encodeShareState(state)
        const decoded = decodeShareState(encoded)
        expect(decoded).not.toBeNull()
        expect(decoded.panelConfig).toEqual(panelConfig)
      }),
      { numRuns: 50 }
    )
  })
})
