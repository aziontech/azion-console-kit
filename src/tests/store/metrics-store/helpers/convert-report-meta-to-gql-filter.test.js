import GqlRules from '@modules/real-time-metrics/helpers/convert-report-meta-to-gql'
import { describe, expect, it } from 'vitest'
import FIXTURES from './fixtures/convert-report-fixtures'

const makeSut = (report) => {
  const sut = new GqlRules(report)

  return { sut }
}

const filterScenarios = [
  {
    type: 'add variables to the filter object',
    field: 'queryFilters',
    report: { filters: FIXTURES.variablesFilterReport.filters },
    expected: FIXTURES.variablesFilterReport.expectedFilters
  },
  {
    type: 'split filter values into variables',
    field: 'queryVariables',
    report: { filters: FIXTURES.variablesFilterReport.filters },
    expected: FIXTURES.variablesFilterReport.expectedVariables
  },
  {
    type: 'build filter details',
    field: 'filterDetails',
    report: { filters: FIXTURES.variablesFilterReport.filters },
    expected: FIXTURES.variablesFilterReport.expectedFilterDetails
  }
]

describe('Convert Report Meta To GQL', () => {
  describe('Filters rules', () => {
    it.each(filterScenarios)('should $type', ({ report, field, expected }) => {
      const { sut } = makeSut(report)
      sut.setFiltersAndVariables()

      expect(sut[field]).toEqual(expected)
    })
  })
})
