/* global globalThis */
/* eslint-disable no-console */
/**
 * Tasks 7.3* and 7.4* — Property-based tests for useSavedSearches.
 *
 * Task 7.3* — Saved Search Persistence & Validation
 *   **Validates: Property P4 (corrupted entries skipped on load),
 *    Requirements 3.1, 3.2, 3.6, N.3**
 *   - Generate valid SavedSearch objects → save → reload → assert equality
 *   - Corrupt one entry mid-array → assert load skips it, siblings survive
 *   - 50+ entries → assert load < 200ms (perf budget)
 *
 * Task 7.4* — localStorage Unavailable Graceful Degradation
 *   **Validates: Property P7 (graceful degradation + warning toast),
 *    Requirements 3.5, N.6**
 *   - Mock setItem to throw QuotaExceededError
 *   - Assert `localStorageAvailable = false`
 *   - Assert warning callback fires once
 *   - Assert subsequent saves stay in-memory (no crash)
 *
 * The existing `useSavedSearches.spec.js` covers single-shot example cases.
 * This file generalizes via fast-check arbitraries with 100+ iterations,
 * ensuring the property holds for a wide input space (long names, unicode
 * dataset identifiers, large filterData objects, etc.).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'

vi.mock('@/stores/account', () => ({
  useAccountStore: () => ({
    account: {
      client_id: 'pbt-client',
      user_id: 'pbt-user'
    }
  })
}))

import { useSavedSearches } from '../useSavedSearches'

const STORAGE_KEY = 'rte-saved-searches:pbt-client:pbt-user'

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const DATASETS = [
  'workloadEvents',
  'functionEvents',
  'functionConsoleEvents',
  'dataStreamedEvents',
  'edgeDnsQueriesEvents',
  'activityHistoryEvents'
]

// Name must be a non-empty trimmed string.
const arbName = fc
  .string({ minLength: 1, maxLength: 64 })
  .filter((string) => string.trim().length > 0)

// filterData: either null or a small plain object with arbitrary string keys.
const arbFilterData = fc.oneof(
  fc.constant(null),
  fc.record({
    fields: fc.array(
      fc.record({
        valueField: fc.string({ minLength: 1, maxLength: 12 }),
        value: fc.oneof(fc.string(), fc.integer(), fc.constant(null))
      }),
      { maxLength: 6 }
    )
  })
)

const arbSaveInput = fc.record({
  name: arbName,
  filterData: arbFilterData,
  selectedColumns: fc.array(fc.string({ minLength: 1, maxLength: 16 }), { maxLength: 8 }),
  selectedFields: fc.array(fc.string({ minLength: 1, maxLength: 16 }), { maxLength: 8 }),
  dataset: fc.constantFrom(...DATASETS),
  pageSize: fc.integer({ min: 10, max: 500 }),
  description: fc.string({ maxLength: 120 })
})

// ---------------------------------------------------------------------------
// Storage stub installer (mirrors the pattern in useSavedSearches.spec.js)
// ---------------------------------------------------------------------------

function withStubStorage(stub) {
  const original = window.localStorage
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    writable: true,
    value: stub
  })
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: stub
  })
  return () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: original
    })
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      writable: true,
      value: original
    })
  }
}

function clearStorage() {
  try {
    window.localStorage.clear()
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Task 7.3* — Persistence & Validation
// ---------------------------------------------------------------------------

describe('useSavedSearches · persistence & validation PBT (Task 7.3*)', () => {
  beforeEach(() => {
    clearStorage()
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    clearStorage()
  })

  it('save → reload roundtrips the entry (PBT)', () => {
    fc.assert(
      fc.property(arbSaveInput, (input) => {
        clearStorage()
        const { saveSearch } = useSavedSearches()
        const saved = saveSearch(input)
        expect(saved).toBeDefined()
        expect(saved.name).toBe(input.name.trim())

        // Re-instantiate to force a load from localStorage.
        const { savedSearches } = useSavedSearches()
        const found = savedSearches.value.find((entry) => entry.id === saved.id)
        expect(found).toBeDefined()
        expect(found.name).toBe(input.name.trim())
        expect(found.dataset).toBe(input.dataset)
        expect(found.pageSize).toBe(input.pageSize)
        expect(found.description).toBe(input.description)
      }),
      { numRuns: 100 }
    )
  })

  it('corrupted entries are skipped on load; valid siblings survive (PBT)', () => {
    fc.assert(
      fc.property(
        // Generate N valid + M corrupted entries interleaved.
        fc.array(arbSaveInput, { minLength: 2, maxLength: 8 }),
        fc.array(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.constant({}),
            fc.constant({ id: 'no-name', dataset: 'workloadEvents' }),
            fc.record({ id: fc.string(), name: fc.constant('   ') }),
            fc.record({ id: fc.constant(''), name: fc.string({ minLength: 1 }) }),
            fc.constant({ id: 'x', name: 'ok', dataset: 'workloadEvents', filterData: 'string!' }),
            fc.constant({
              id: 'y',
              name: 'ok',
              dataset: 'workloadEvents',
              selectedColumns: 'not-an-array'
            })
          ),
          { minLength: 1, maxLength: 6 }
        ),
        (validInputs, corruptions) => {
          clearStorage()

          // Build the persisted array manually so we control the layout.
          const validEntries = validInputs.map((input, idx) => ({
            id: `valid-${idx}`,
            name: input.name.trim(),
            dataset: input.dataset,
            filterData: input.filterData,
            selectedColumns: input.selectedColumns,
            selectedFields: input.selectedFields,
            pageSize: input.pageSize,
            description: input.description,
            createdAt: Date.now() - idx,
            updatedAt: Date.now() - idx
          }))

          const interleaved = []
          const max = Math.max(validEntries.length, corruptions.length)
          for (let idx = 0; idx < max; idx += 1) {
            if (idx < validEntries.length) interleaved.push(validEntries[idx])
            if (idx < corruptions.length) interleaved.push(corruptions[idx])
          }

          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(interleaved))

          const { savedSearches } = useSavedSearches()
          // All valid entries survive; corrupted ones are dropped.
          expect(savedSearches.value).toHaveLength(validEntries.length)
          validEntries.forEach((expectedEntry) => {
            const match = savedSearches.value.find((entry) => entry.id === expectedEntry.id)
            expect(match).toBeDefined()
            expect(match.name).toBe(expectedEntry.name)
          })
          // The composable logs a warning for at least one corruption.
          expect(console.warn).toHaveBeenCalled()
        }
      ),
      { numRuns: 50 } // each iteration writes/reads N entries
    )
  })

  it('loads 50+ entries in under 200ms (perf budget)', () => {
    // Build 60 valid entries directly (skip the saveSearch loop because
    // it MAX_SAVED-truncates to 50; we want the load path to see >= 50).
    const entries = Array.from({ length: 60 }, (unused, idx) => ({
      id: `perf-${idx}`,
      name: `entry-${idx}`,
      dataset: DATASETS[idx % DATASETS.length],
      filterData: { fields: [{ valueField: 'host', value: `host-${idx}.example.com` }] },
      selectedColumns: ['host', 'status'],
      selectedFields: ['host', 'status'],
      pageSize: 100,
      description: `entry number ${idx}`,
      createdAt: Date.now() - idx,
      updatedAt: Date.now() - idx
    }))
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))

    const start = performance.now()
    const { savedSearches } = useSavedSearches()
    const elapsed = performance.now() - start

    expect(savedSearches.value.length).toBeGreaterThanOrEqual(50)
    // 200ms budget is generous — typical load on jsdom is <10ms. The budget
    // catches accidental O(n²) or heavyweight per-entry deep work.
    expect(elapsed).toBeLessThan(200)
  })
})

// ---------------------------------------------------------------------------
// Task 7.4* — localStorage Unavailable Graceful Degradation
// ---------------------------------------------------------------------------

describe('useSavedSearches · localStorage unavailable PBT (Task 7.4*)', () => {
  let restoreStorage = null

  beforeEach(() => {
    clearStorage()
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    if (restoreStorage) {
      restoreStorage()
      restoreStorage = null
    }
    vi.restoreAllMocks()
    clearStorage()
  })

  function installQuotaExceededStub() {
    restoreStorage = withStubStorage({
      getItem: () => null,
      setItem: () => {
        const error = new Error('Quota exceeded')
        error.name = 'QuotaExceededError'
        throw error
      },
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null
    })
  }

  it('flips localStorageAvailable=false and keeps app responsive for any save input (PBT)', () => {
    fc.assert(
      fc.property(arbSaveInput, (input) => {
        if (restoreStorage) {
          restoreStorage()
          restoreStorage = null
        }
        installQuotaExceededStub()

        const onQuotaExceeded = vi.fn()
        const { saveSearch, localStorageAvailable, savedSearches } = useSavedSearches({
          onQuotaExceeded
        })
        const entry = saveSearch(input)

        // The save is in-memory only — flag flipped, entry still returned.
        expect(localStorageAvailable.value).toBe(false)
        expect(entry).toBeDefined()
        expect(savedSearches.value).toHaveLength(1)
        // Warning toast callback fires exactly once.
        expect(onQuotaExceeded).toHaveBeenCalledTimes(1)
      }),
      { numRuns: 50 }
    )
  })

  it('callback fires AT MOST ONCE across many consecutive failures (PBT)', () => {
    fc.assert(
      fc.property(fc.array(arbSaveInput, { minLength: 2, maxLength: 10 }), (inputs) => {
        if (restoreStorage) {
          restoreStorage()
          restoreStorage = null
        }
        installQuotaExceededStub()

        const onQuotaExceeded = vi.fn()
        const { saveSearch } = useSavedSearches({ onQuotaExceeded })
        inputs.forEach((input) => saveSearch(input))

        expect(onQuotaExceeded).toHaveBeenCalledTimes(1)
      }),
      { numRuns: 30 }
    )
  })

  it('does not crash when localStorage.getItem throws on initial load', () => {
    restoreStorage = withStubStorage({
      getItem: () => {
        const error = new Error('Read denied')
        error.name = 'SecurityError'
        throw error
      },
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null
    })

    let composable
    expect(() => {
      composable = useSavedSearches()
    }).not.toThrow()

    expect(composable.savedSearches.value).toEqual([])
    expect(composable.localStorageAvailable.value).toBe(false)
  })

  it('does not crash when onQuotaExceeded callback itself throws (defensive)', () => {
    installQuotaExceededStub()
    const onQuotaExceeded = vi.fn(() => {
      throw new Error('toast subsystem on fire')
    })
    const { saveSearch } = useSavedSearches({ onQuotaExceeded })

    expect(() => {
      saveSearch({
        name: 'will-not-explode',
        filterData: null,
        selectedColumns: [],
        dataset: 'workloadEvents'
      })
    }).not.toThrow()
  })
})
