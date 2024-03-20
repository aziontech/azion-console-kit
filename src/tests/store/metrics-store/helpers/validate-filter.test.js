import ValidateFilters from '@modules/real-time-metrics/helpers/validate-filters'
import { describe, expect, it } from 'vitest'
import FIXTURE from './fixtures/validate-filter-fixtures'

const makeSut = () => {
  const sut = ValidateFilters
  return { sut }
}

const scenarios = [
  {
    description: 'valid time series filter',
    scenario: 'SCENARIO_TIME_SERIES',
    resultProp: 'tsRange',
    expected: FIXTURE.SCENARIO_TIME_SERIES.filters.tsRange
  },
  {
    description: 'valid AND filters',
    scenario: 'SCENARIO_AND_DEFAULT',
    resultProp: 'and',
    expected: FIXTURE.SCENARIO_AND_DEFAULT.filters.and
  },
  {
    description: 'valid dataset filters',
    scenario: 'SCENARIO_DATASET_DEFAULT',
    resultProp: 'datasets',
    expected: FIXTURE.SCENARIO_DATASET_DEFAULT.filters.datasets
  },
  {
    description: 'invalid dataset filters',
    scenario: 'SCENARIO_DATASET_NOT_VALID',
    resultProp: 'datasets',
    expected: FIXTURE.SCENARIO_DATASET_NOT_VALID.expectedFilter
  },
  {
    description: 'dataset filters with missing fieldAlias',
    scenario: 'SCENARIO_DATASET_MISSING_FIELD_ALIAS',
    resultProp: 'datasets',
    expected: []
  },
  {
    description: 'dataset filters with missing in array',
    scenario: 'SCENARIO_DATASET_MISSING_IN_ARRAY',
    resultProp: 'datasets',
    expected: []
  },
  {
    description: 'dataset filters with missing meta',
    scenario: 'SCENARIO_DATASET_MISSING_META',
    resultProp: 'datasets',
    expected: []
  },
  {
    description: 'valid IntRange filter',
    scenario: 'SCENARIO_AND_INT_RANGE',
    resultProp: 'and',
    expected: FIXTURE.SCENARIO_AND_INT_RANGE.filters.and
  },
  {
    description: 'invalid IntRange filter',
    scenario: 'SCENARIO_AND_INVALID_INT_RANGE',
    resultProp: 'and',
    expected: {}
  },
  {
    description: 'valid FloatRange filter',
    scenario: 'SCENARIO_AND_FLOAT_RANGE',
    resultProp: 'and',
    expected: FIXTURE.SCENARIO_AND_FLOAT_RANGE.filters.and
  },
  {
    description: 'invalid FloatRange filter',
    scenario: 'SCENARIO_AND_INVALID_FLOAT_RANGE',
    resultProp: 'and',
    expected: FIXTURE.SCENARIO_AND_INVALID_FLOAT_RANGE.filters.and
  },
  {
    description: 'valid DateTimeRange filter',
    scenario: 'SCENARIO_AND_DATA_TIME_RANGE',
    resultProp: 'and',
    expected: FIXTURE.SCENARIO_AND_DATA_TIME_RANGE.filters.and
  },
  {
    description: 'invalid DateTimeRange filter',
    scenario: 'SCENARIO_AND_INVALID_DATA_TIME_RANGE',
    resultProp: 'and',
    expected: {}
  }
]

describe('validateFilters', () => {
  describe('should validate filters', () => {
    it.each(scenarios)('should validate $description', ({ scenario, resultProp, expected }) => {
      const { filters, availableFilters } = FIXTURE[scenario]
      const { sut } = makeSut()

      const result = sut(filters, availableFilters)

      expect(result[resultProp]).toEqual(expected)
    })
  })
})
