import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { formatTimestampCompact } from '../format-timestamp.js'

/**
 * Feature: real-time-events-refactor, Property 4: Timezone-parameterized timestamp formatting
 *
 * Validates: Requirements 7.2
 *
 * For any valid ISO 8601 timestamp and IANA timezone string,
 * formatTimestampCompact(timestamp, timezone) produces output
 * reflecting the provided timezone.
 */

const IANA_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
  'Pacific/Honolulu',
  'Africa/Cairo',
  'Africa/Johannesburg'
]

const arbTimezone = fc.constantFrom(...IANA_TIMEZONES)

// Generate timestamps between 2000-01-01 and 2035-12-31 using integer millis
// to avoid fc.date() producing Invalid Date in some edge cases
const MIN_MS = new Date('2000-01-01T00:00:00Z').getTime()
const MAX_MS = new Date('2035-12-31T23:59:59Z').getTime()

const arbTimestamp = fc
  .integer({ min: MIN_MS, max: MAX_MS })
  .map((ms) => new Date(ms).toISOString())

describe('Feature: real-time-events-refactor, Property 4: Timezone-parameterized timestamp formatting', () => {
  it('should produce output matching Date.toLocaleString with the same timezone options', () => {
    fc.assert(
      fc.property(arbTimestamp, arbTimezone, (isoTimestamp, timezone) => {
        const result = formatTimestampCompact(isoTimestamp, timezone)

        const expected = new Date(isoTimestamp).toLocaleString('en-US', {
          timeZone: timezone,
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })

        expect(result).toBe(expected)
      }),
      { numRuns: 100 }
    )
  })

  it('should reflect the provided timezone, not a hardcoded one', () => {
    fc.assert(
      fc.property(arbTimestamp, (isoTimestamp) => {
        const resultUTC = formatTimestampCompact(isoTimestamp, 'UTC')
        const resultTokyo = formatTimestampCompact(isoTimestamp, 'Asia/Tokyo')
        const resultNY = formatTimestampCompact(isoTimestamp, 'America/New_York')

        // At least two of the three timezone outputs should differ
        // (they could match in rare edge cases, but across 100 random timestamps
        // this property will hold for the vast majority)
        const allSame = resultUTC === resultTokyo && resultTokyo === resultNY
        expect(allSame).toBe(false)
      }),
      { numRuns: 100 }
    )
  })

  it('should default to UTC when no timezone is provided', () => {
    fc.assert(
      fc.property(arbTimestamp, (isoTimestamp) => {
        const resultDefault = formatTimestampCompact(isoTimestamp)
        const resultUTC = formatTimestampCompact(isoTimestamp, 'UTC')

        expect(resultDefault).toBe(resultUTC)
      }),
      { numRuns: 100 }
    )
  })
})
