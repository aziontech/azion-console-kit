import { describe, it, expect, vi, beforeEach } from 'vitest'
import fc from 'fast-check'
import { useRouteFilterManager } from '@/helpers'
import { useRoute, useRouter } from 'vue-router'

/**
 * Feature: real-time-events-refactor, Property 12: Filter state URL hash round-trip
 *
 * Validates: Requirements 13.12
 *
 * For any valid FilterData object, serializing it to the URL hash via
 * setFilterInHash and deserializing back via getFiltersFromHash produces
 * a deeply equal object.
 */

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn()
}))

// ── Generators ──

const OPERATORS = ['In', 'Eq', 'Ne', 'Like', 'Ilike', 'Range', 'Lt', 'Lte', 'Gt', 'Gte']
const FIELD_TYPES = ['String', 'Int', 'Float', 'Boolean', 'ArrayString', 'GenericScalar']
const DATASETS = [
  'httpEvents',
  'l2CacheEvents',
  'edgeFunctionsEvents',
  'edgeFunctionsConsoleEvents',
  'imageProcessorEvents',
  'tieredCacheEvents',
  'edgeDnsEvents',
  'dataStreamedEvents'
]

const arbFieldName = fc.string({ minLength: 1, maxLength: 30 }).filter(
  (s) => s.trim().length > 0
)

const arbIdentifier = fc.stringMatching(/^[a-zA-Z_]{1,20}$/)

const arbFilterField = fc.record({
  field: arbFieldName,
  valueField: arbIdentifier,
  operator: fc.constantFrom(...OPERATORS),
  value: fc.oneof(
    fc.string({ minLength: 0, maxLength: 50 }),
    fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }).map(
      (arr) => arr.join(',')
    )
  ),
  type: fc.constantFrom(...FIELD_TYPES)
})

// Use integer timestamps to avoid invalid date issues with fc.date()
const MIN_TS = new Date('2020-01-01T00:00:00Z').getTime()
const MAX_TS = new Date('2030-01-01T00:00:00Z').getTime()

const arbIsoString = fc
  .integer({ min: MIN_TS, max: MAX_TS })
  .map((ms) => new Date(ms).toISOString().replace(/\.\d{3}/, ''))

const arbTsRange = fc.record({
  tsRangeBegin: arbIsoString,
  tsRangeEnd: arbIsoString,
  label: fc.option(fc.constantFrom('Last 5 minutes', 'Last 15 minutes', 'Last 1 hour', 'Last 24 hours', 'Custom'), { nil: undefined })
})

const arbFilterData = fc.record({
  tsRange: arbTsRange,
  fields: fc.array(arbFilterField, { minLength: 0, maxLength: 8 }),
  dataset: fc.constantFrom(...DATASETS)
})

describe('Feature: real-time-events-refactor, Property 12: Filter state URL hash round-trip', () => {
  let mockRoute
  let mockRouter

  beforeEach(() => {
    mockRoute = { query: {} }
    mockRouter = {
      push: vi.fn((newRoute) => {
        // Simulate the router updating the route query
        mockRoute.query = newRoute.query || {}
        return Promise.resolve()
      })
    }
    useRoute.mockReturnValue(mockRoute)
    useRouter.mockReturnValue(mockRouter)
  })

  it('encodeFilter → decodeFilter round-trip produces a deeply equal object for any FilterData', () => {
    fc.assert(
      fc.property(arbFilterData, (filterData) => {
        const { encodeFilter, decodeFilter } = useRouteFilterManager()

        const encoded = encodeFilter(filterData)
        const decoded = decodeFilter(encoded)

        expect(decoded).toEqual(filterData)
      }),
      { numRuns: 100 }
    )
  })

  it('setFilterInHash → getFiltersFromHash round-trip produces a deeply equal object for any FilterData', () => {
    fc.assert(
      fc.property(arbFilterData, (filterData) => {
        const { setFilterInHash, getFiltersFromHash } = useRouteFilterManager()

        // Serialize to hash
        setFilterInHash(filterData)

        // Deserialize from hash
        const result = getFiltersFromHash()

        expect(result).toEqual(filterData)
      }),
      { numRuns: 100 }
    )
  })

  it('round-trip preserves field order for any FilterData with multiple fields', () => {
    const arbMultiFieldFilter = arbFilterData.filter((fd) => fd.fields.length >= 2)

    fc.assert(
      fc.property(arbMultiFieldFilter, (filterData) => {
        const { encodeFilter, decodeFilter } = useRouteFilterManager()

        const decoded = decodeFilter(encodeFilter(filterData))

        // Fields must be in the same order
        expect(decoded.fields).toHaveLength(filterData.fields.length)
        decoded.fields.forEach((field, i) => {
          expect(field.field).toBe(filterData.fields[i].field)
          expect(field.valueField).toBe(filterData.fields[i].valueField)
          expect(field.operator).toBe(filterData.fields[i].operator)
          expect(field.value).toBe(filterData.fields[i].value)
        })
      }),
      { numRuns: 100 }
    )
  })
})
