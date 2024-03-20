import GqlRules from '@modules/real-time-metrics/helpers/convert-report-meta-to-gql'
import { describe, expect, it } from 'vitest'
import FIXTURES from './fixtures/convert-report-fixtures'

const makeSut = (report) => {
  const sut = new GqlRules(report)

  return { sut }
}

const queryScenarios = [
  {
    type: 'with all params setted',
    report: FIXTURES.allParamsSetted.params,
    expected: {
      query: FIXTURES.allParamsSetted.queryResult,
      variables: {
        tsRange_begin: FIXTURES.allParamsSetted.variablesResult.tsRange_begin,
        tsRange_end: FIXTURES.allParamsSetted.variablesResult.tsRange_end
      }
    }
  },
  {
    type: 'with aggregation',
    report: FIXTURES.withAggregation.params,
    expected: {
      query: FIXTURES.withAggregation.queryResult,
      variables: {
        tsRange_begin: FIXTURES.withAggregation.variablesResult.tsRange_begin,
        tsRange_end: FIXTURES.withAggregation.variablesResult.tsRange_end
      }
    }
  },
  {
    type: 'with empty filters',
    report: FIXTURES.withoutFilters.params,
    expected: {
      query: FIXTURES.withoutFilters.queryResult,
      variables: {}
    }
  }
]

describe('Convert Report Meta To GQL', () => {
  describe('Generating Query', () => {
    it.each(queryScenarios)('should build query $type', ({ report, expected }) => {
      const { sut } = makeSut(report)

      const query = sut.generateGqlQuery()

      expect(query.query).toEqual(expected.query)
      expect(query.variables).toEqual(expected.variables)
    })
  })
})
