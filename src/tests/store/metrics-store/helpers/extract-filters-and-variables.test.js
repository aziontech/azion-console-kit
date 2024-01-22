import extractFilters from '@/stores/metrics-store/helpers/extract-filters-and-variables'
import { describe, expect, it } from 'vitest'
import { FIXTURE } from './fixtures/extract-filters-and-variables-fixtures'

const makeSut = () => {
  const sut = extractFilters

  return { sut }
}

describe('extractFilters', () => {
  it('should extract time series filter', () => {
    const { sut } = makeSut()
    const { filters, expected } = FIXTURE.SCENARIO_EXTRACT_TIME_SERIES
    const result = sut(filters)

    expect(result.filters.tsRange).toBeDefined()
    expect(result.params).toHaveLength(2)
    expect(result.variables).toEqual(expected)
  })

  it('should extract dataset filters', () => {
    const { sut } = makeSut()
    const { filters, expected } = FIXTURE.SCENARIO_EXTRACT_DATASET
    const result = sut(filters)

    expect(result.filters.field1).toBeDefined()
    expect(result.filters.field2).toBeDefined()
    expect(result.params).toHaveLength(4)
    expect(result.variables).toEqual(expected)
  })

  it('should extract "and" filters with single values', () => {
    const { sut } = makeSut()
    const { filters, expected } = FIXTURE.SCENARIO_EXTRACT_AND_SINGLE
    const result = sut(filters)

    expect(result.filters.and.filter1).toBeDefined()
    expect(result.filters.and.filter2).toBeDefined()
    expect(result.params).toHaveLength(4)
    expect(result.variables).toEqual(expected)
  })

  it('should extract "and" filters with range values', () => {
    const { sut } = makeSut()
    const { filters, expected } = FIXTURE.SCENARIO_EXTRACT_AND_RANGE
    const result = sut(filters)

    expect(result.filters.and.filter1).toBeDefined()
    expect(result.params).toHaveLength(4)
    expect(result.variables).toEqual(expected)
  })

  it.each([
    { type: 'empty dataset filters', params: FIXTURE.SCENARIO_EXTRACT_EMPTY_DATASET },
    { type: 'empty and filter', params: FIXTURE.SCENARIO_EXTRACT_EMPTY_AND }
  ])('should handle $type', ({ params }) => {
    const { sut } = makeSut()
    const { filters, expected } = params
    const result = sut(filters)

    expect(result.params).toHaveLength(2)
    expect(result.variables).toEqual(expected)
  })
})
