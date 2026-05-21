import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import safeStructuredClone from '../structured-clone.js'

/**
 * Feature: real-time-events-refactor, Property 9: structuredClone type preservation
 *
 * Validates: Requirements 12.3
 *
 * For any filterData object containing Date instances, the cloning operation
 * SHALL preserve Date types. structuredClone handles Date, Map, Set and other
 * non-JSON-safe types correctly, unlike JSON.parse(JSON.stringify()).
 */

// Arbitrary: Date instances from a reasonable range
const arbDate = fc
  .integer({ min: 946684800000, max: 1924991999000 }) // 2000-01-01 to 2030-12-31
  .map((ms) => new Date(ms))

// Arbitrary: plain objects with string keys and primitive values
const arbPlainObject = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-zA-Z]/.test(s)),
  fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null))
)

describe('Feature: real-time-events-refactor, Property 9: structuredClone type preservation', () => {
  it('preserves Date instances after cloning', () => {
    fc.assert(
      fc.property(arbDate, (date) => {
        const obj = { createdAt: date, nested: { updatedAt: date } }
        const clone = safeStructuredClone(obj)

        expect(clone.createdAt).toBeInstanceOf(Date)
        expect(clone.createdAt.getTime()).toBe(date.getTime())
        expect(clone.nested.updatedAt).toBeInstanceOf(Date)
        expect(clone.nested.updatedAt.getTime()).toBe(date.getTime())

        // Clone must not be the same reference
        expect(clone).not.toBe(obj)
        expect(clone.createdAt).not.toBe(date)
      }),
      { numRuns: 100 }
    )
  })

  it('preserves Map instances after cloning', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.string({ minLength: 1, maxLength: 8 }), fc.integer()), {
          minLength: 1,
          maxLength: 10
        }),
        (entries) => {
          const map = new Map(entries)
          const obj = { data: map }
          const clone = safeStructuredClone(obj)

          expect(clone.data).toBeInstanceOf(Map)
          expect(clone.data.size).toBe(map.size)
          for (const [key, value] of map) {
            expect(clone.data.get(key)).toBe(value)
          }
          expect(clone.data).not.toBe(map)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('preserves Set instances after cloning', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 1, maxLength: 20 }),
        (values) => {
          const set = new Set(values)
          const obj = { items: set }
          const clone = safeStructuredClone(obj)

          expect(clone.items).toBeInstanceOf(Set)
          expect(clone.items.size).toBe(set.size)
          for (const value of set) {
            expect(clone.items.has(value)).toBe(true)
          }
          expect(clone.items).not.toBe(set)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('produces deep-equal results for plain objects', () => {
    fc.assert(
      fc.property(arbPlainObject, (obj) => {
        const clone = safeStructuredClone(obj)

        expect(clone).toEqual(obj)
        expect(clone).not.toBe(obj)
      }),
      { numRuns: 100 }
    )
  })
})
