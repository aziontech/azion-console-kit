import mountFilterTypes from '@/stores/metrics-store/helpers/mount-filter-types'
import { describe, expect, it } from 'vitest'
import FIXTURE from './fixtures/mount-filter-types-fixtures'

const makeSut = () => {
  const sut = mountFilterTypes

  return { sut }
}

const scenarios = [
  {
    type: 'map filters to include type meta for AND filters and DATASET filters',
    filters: FIXTURE.SCENARIO_VALIDATION_FILTER.filters,
    availableFilters: FIXTURE.SCENARIO_VALIDATION_FILTER.availableFilters,
    expected: FIXTURE.SCENARIO_VALIDATION_FILTER.expected
  },
  {
    type: 'handle missing filter details in availableFilters',
    filters: FIXTURE.SCENARIO_MISSING_AVAILABLE.filters,
    availableFilters: FIXTURE.SCENARIO_MISSING_AVAILABLE.availableFilters,
    expected: FIXTURE.SCENARIO_MISSING_AVAILABLE.expected
  },
  {
    type: 'handle missing filters in the input',
    filters: FIXTURE.SCENARIO_MISSING_FILTERS.filters,
    availableFilters: FIXTURE.SCENARIO_MISSING_FILTERS.availableFilters,
    expected: FIXTURE.SCENARIO_MISSING_FILTERS.expected
  }
]

describe('MountFilterTypes', () => {
  it.each(scenarios)('should $type', ({ filters, availableFilters, expected }) => {
    const { sut } = makeSut()

    const result = sut(filters, availableFilters)

    expect(result).toEqual(expected)
  })
})
