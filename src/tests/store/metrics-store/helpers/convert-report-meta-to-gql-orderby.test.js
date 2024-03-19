import GqlRules from '@/modules/real-time-metrics/helpers/convert-report-meta-to-gql'
import { describe, expect, it } from 'vitest'
import FIXTURES from './fixtures/convert-report-fixtures'

const makeSut = (report) => {
  const sut = new GqlRules(report)

  return { sut }
}

const orderByScenarios = [
  {
    type: 'xAxis',
    report: { xAxis: FIXTURES.xAxisSumReport.xAxis },
    expected: FIXTURES.xAxisSumReport.expected
  },
  {
    type: 'xAxis ts_ASC',
    report: FIXTURES.orderReport,
    expected: FIXTURES.orderReport.expected
  },
  {
    type: 'aggregation',
    report: FIXTURES.orderByAggregationReport,
    expected: FIXTURES.orderByAggregationReport.expected
  },
  {
    type: 'field',
    report: FIXTURES.orderByFieldReport,
    expected: FIXTURES.orderByFieldReport.expected
  }
]

describe('Convert Report Meta To GQL', () => {
  describe('OrderBy rules', () => {
    it.each(orderByScenarios)('should order by $type', ({ report, expected }) => {
      const { sut } = makeSut(report)
      sut.setOrderBy()

      expect(sut.orderBy).toEqual(expected)
    })
  })
})
