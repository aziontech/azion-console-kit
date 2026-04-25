import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import fc from 'fast-check'
import { useEventsData } from '../useEventsData.js'

/**
 * Feature: real-time-events-refactor, Property 3: Locale-aware number formatting
 *
 * Validates: Requirements 4.3
 *
 * For any valid locale string and positive integer, the formatting output
 * matches Intl.NumberFormat(locale).format(n) using the user's configured
 * locale, not a hardcoded locale.
 */

const LOCALE_STRINGS = [
  'en-US',
  'en-GB',
  'pt-BR',
  'fr-FR',
  'de-DE',
  'ja-JP',
  'zh-CN',
  'ko-KR',
  'es-ES',
  'it-IT',
  'ru-RU',
  'ar-SA',
  'hi-IN',
  'nl-NL',
  'sv-SE',
  'pl-PL',
  'tr-TR',
  'th-TH',
  'vi-VN',
  'id-ID'
]

const arbLocale = fc.constantFrom(...LOCALE_STRINGS)
const arbPositiveInt = fc.integer({ min: 0, max: 1_000_000_000 })

/**
 * Helper to create a minimal useEventsData instance with a given locale.
 * We only need the setRecordsFound function and recordsFound ref.
 */
function createEventsData(locale) {
  return useEventsData({
    filterData: ref({ tsRange: null, fields: [] }),
    listService: ref(vi.fn()),
    loadChartAggregation: ref(vi.fn()),
    tabSelected: ref({ dataset: 'test' }),
    pageSize: ref(50),
    hasChartConfig: ref(false),
    onError: vi.fn(),
    locale
  })
}

describe('Feature: real-time-events-refactor, Property 3: Locale-aware number formatting', () => {
  it('setRecordsFound output matches Intl.NumberFormat(locale).format(n) for any locale and positive integer', () => {
    fc.assert(
      fc.property(arbLocale, arbPositiveInt, (locale, n) => {
        const { setRecordsFound, recordsFound } = createEventsData(locale)

        setRecordsFound(n)

        const expected = new Intl.NumberFormat(locale).format(n)
        expect(recordsFound.value).toBe(expected)
      }),
      { numRuns: 100 }
    )
  })

  it('formatting uses the provided locale, not a hardcoded one', () => {
    fc.assert(
      fc.property(arbPositiveInt.filter((n) => n >= 1000), (n) => {
        const { setRecordsFound: setUS, recordsFound: foundUS } = createEventsData('en-US')
        const { setRecordsFound: setDE, recordsFound: foundDE } = createEventsData('de-DE')

        setUS(n)
        setDE(n)

        // en-US uses commas (1,000), de-DE uses periods (1.000)
        // For n >= 1000 these should always differ
        expect(foundUS.value).not.toBe(foundDE.value)
      }),
      { numRuns: 100 }
    )
  })

  it('formatting produces a non-empty string that matches Intl output for every locale', () => {
    fc.assert(
      fc.property(arbLocale, arbPositiveInt, (locale, n) => {
        const { setRecordsFound, recordsFound } = createEventsData(locale)

        setRecordsFound(n)

        // The result should be a non-empty string
        expect(typeof recordsFound.value).toBe('string')
        expect(recordsFound.value.length).toBeGreaterThan(0)

        // Verify it exactly matches the Intl.NumberFormat output for the same locale
        const expected = new Intl.NumberFormat(locale).format(n)
        expect(recordsFound.value).toBe(expected)
      }),
      { numRuns: 100 }
    )
  })
})
