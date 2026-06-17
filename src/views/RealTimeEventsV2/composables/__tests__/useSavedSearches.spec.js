/* eslint-disable no-console */
/* global globalThis */
/**
 * useSavedSearches — behavior tests for Wave 2 Tasks 7.1 + 7.2.
 *
 * Existing coverage in `regression.test.js` (Requirement 13.6) verifies
 * the happy path (save / delete / max-50 / empty-name / persistence).
 * This file adds the V2-spec behaviors layered in Wave 2:
 *
 *   - Corrupted entries on load are skipped (Req 3.6, Property P4)
 *   - localStorage quota errors flip `localStorageAvailable` (Req 3.5, P7)
 *   - `onQuotaExceeded` callback fires at most once (Req N.6)
 *   - `applySearch` returns a defensive deep clone (Req 3.3)
 *   - New schema fields (`pageSize`, `description`, `selectedFields`,
 *     `updatedAt`) are persisted alongside legacy ones.
 *
 * The vitest setup file (`src/tests/setup-tests.js`) installs a polyfill
 * for `localStorage` that may NOT be a real `Storage` instance, so
 * prototype-level spies don't always intercept it. We seed via the
 * `localStorage` accessor itself and replace the accessor with a stub
 * when we need to force a failure path.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/stores/account', () => ({
  useAccountStore: () => ({
    account: {
      client_id: 'test-client-saved-searches',
      user_id: 'test-user-saved-searches'
    }
  })
}))

import { useSavedSearches } from '../useSavedSearches'

const STORAGE_KEY = 'rte-saved-searches:test-client-saved-searches:test-user-saved-searches'

/**
 * Replace the global `localStorage` with a stub for a single test.
 * Returns a `restore()` thunk for symmetric cleanup in `afterEach`.
 *
 * We use `Object.defineProperty` because the setup file installed the
 * polyfill with `configurable: true, writable: true`, so we can swap
 * the value freely. This is more reliable than prototype spies for the
 * polyfilled environment.
 */
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

describe('useSavedSearches — Wave 2 enhancements', () => {
  let restoreStorage = null

  beforeEach(() => {
    // Start from a clean slate. setup-tests.js clears storage already,
    // but be explicit so the seeding step below is the only writer.
    try {
      window.localStorage.clear()
    } catch {
      /* ignore */
    }
    // Silence the deliberate console.* calls the composable emits — N.10
    // logs are useful in prod but noisy here.
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
    try {
      window.localStorage.clear()
    } catch {
      /* ignore */
    }
  })

  describe('Requirement 3.6 — validation on load', () => {
    it('skips entries missing required fields and keeps valid siblings', () => {
      // Seed via the real accessor — works on both jsdom Storage and the
      // setup polyfill, and avoids the prototype-spy pitfall.
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([
          { id: 'a', name: 'Valid', dataset: 'workloadEvents', filterData: null },
          { id: 'b' }, // missing name + dataset
          null, // outright bad entry
          { id: '', name: 'EmptyId', dataset: 'workloadEvents', filterData: null },
          { id: 'c', name: 'Valid Two', dataset: '', filterData: null },
          { id: 'd', name: '   ', dataset: 'workloadEvents', filterData: null }
        ])
      )
      const { savedSearches } = useSavedSearches()
      const names = savedSearches.value.map((entry) => entry.name)
      expect(names).toEqual(['Valid', 'Valid Two'])
      expect(console.warn).toHaveBeenCalled()
    })

    it('returns empty array when the persisted root is not valid JSON', () => {
      window.localStorage.setItem(STORAGE_KEY, '{not json')
      const { savedSearches } = useSavedSearches()
      expect(savedSearches.value).toEqual([])
      expect(console.error).toHaveBeenCalled()
    })

    it('returns empty array when persisted root is not an array', () => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }))
      const { savedSearches } = useSavedSearches()
      expect(savedSearches.value).toEqual([])
    })
  })

  describe('Requirement 3.5 / N.6 — localStorage unavailable degrades gracefully', () => {
    it('flips localStorageAvailable=false when setItem throws QuotaExceededError', () => {
      restoreStorage = withStubStorage({
        getItem: () => null,
        setItem: () => {
          throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' })
        },
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null
      })
      const { saveSearch, localStorageAvailable } = useSavedSearches()
      saveSearch({
        name: 'Big',
        filterData: null,
        selectedColumns: [],
        dataset: 'workloadEvents'
      })
      expect(localStorageAvailable.value).toBe(false)
    })

    it('invokes onQuotaExceeded callback exactly once across multiple failures', () => {
      const onQuotaExceeded = vi.fn()
      restoreStorage = withStubStorage({
        getItem: () => null,
        setItem: () => {
          throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' })
        },
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null
      })
      const { saveSearch } = useSavedSearches({ onQuotaExceeded })
      saveSearch({ name: 'one', filterData: null, selectedColumns: [], dataset: 'a' })
      saveSearch({ name: 'two', filterData: null, selectedColumns: [], dataset: 'a' })
      saveSearch({ name: 'three', filterData: null, selectedColumns: [], dataset: 'a' })
      expect(onQuotaExceeded).toHaveBeenCalledTimes(1)
    })

    it('keeps the in-memory list when persistence fails (graceful degradation)', () => {
      restoreStorage = withStubStorage({
        getItem: () => null,
        setItem: () => {
          throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' })
        },
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null
      })
      const { saveSearch, savedSearches } = useSavedSearches()
      const entry = saveSearch({
        name: 'session-only',
        filterData: null,
        selectedColumns: [],
        dataset: 'workloadEvents'
      })
      // The user can still see and use the search in this session even
      // though it never reaches localStorage.
      expect(entry).toBeDefined()
      expect(savedSearches.value).toHaveLength(1)
    })

    it('does not throw when the onQuotaExceeded callback itself throws', () => {
      const onQuotaExceeded = vi.fn(() => {
        throw new Error('toast subsystem on fire')
      })
      restoreStorage = withStubStorage({
        getItem: () => null,
        setItem: () => {
          throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' })
        },
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null
      })
      const { saveSearch } = useSavedSearches({ onQuotaExceeded })
      expect(() =>
        saveSearch({ name: 'x', filterData: null, selectedColumns: [], dataset: 'a' })
      ).not.toThrow()
    })
  })

  describe('Requirement 3.3 — applySearch returns a defensive clone', () => {
    it('returns null for unknown ids', () => {
      const { applySearch } = useSavedSearches()
      expect(applySearch('does-not-exist')).toBeNull()
    })

    it('returns a clone whose mutation does not affect the stored entry', () => {
      const { saveSearch, applySearch, savedSearches } = useSavedSearches()
      const original = saveSearch({
        name: 'Clone Me',
        filterData: { fields: [{ valueField: 'host' }] },
        selectedColumns: ['host'],
        dataset: 'workloadEvents'
      })
      const applied = applySearch(original.id)
      expect(applied).not.toBeNull()
      applied.filterData.fields.push({ valueField: 'mutated' })
      // The in-memory list must be unchanged.
      expect(savedSearches.value[0].filterData.fields).toHaveLength(1)
    })
  })

  describe('Schema — new V2 fields are persisted', () => {
    it('persists pageSize, description, selectedFields, and updatedAt', () => {
      const { saveSearch } = useSavedSearches()
      const entry = saveSearch({
        name: 'Full',
        filterData: { fields: [] },
        selectedColumns: ['host'],
        selectedFields: ['host', 'status'],
        dataset: 'workloadEvents',
        pageSize: 100,
        description: 'Trace 5xx on api.example.com'
      })
      expect(entry.pageSize).toBe(100)
      expect(entry.description).toBe('Trace 5xx on api.example.com')
      expect(entry.selectedFields).toEqual(['host', 'status'])
      expect(entry.updatedAt).toBeDefined()
      expect(entry.createdAt).toBeDefined()
    })

    it('falls back to selectedColumns when selectedFields is omitted', () => {
      const { saveSearch } = useSavedSearches()
      const entry = saveSearch({
        name: 'No fields explicitly',
        filterData: null,
        selectedColumns: ['col1', 'col2'],
        dataset: 'workloadEvents'
      })
      expect(entry.selectedFields).toEqual(['col1', 'col2'])
    })
  })
})
