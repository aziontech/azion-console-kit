import GqlRules from '@/modules/real-time-metrics/helpers/convert-report-meta-to-gql'
import { describe, expect, it } from 'vitest'
import FIXTURES from './fixtures/convert-report-fixtures'

const makeSut = (report) => {
  const sut = new GqlRules(report)

  return { sut }
}

const groupByScenarios = [
  {
    type: 'not group when no group is set',
    report: [],
    expected: ['ts']
  },
  {
    type: 'group by report payload groupBy',
    report: { groupBy: FIXTURES.groupByReport.groupBy },
    expected: FIXTURES.groupByReport.expected
  },
  {
    type: 'group by report payload xAxis',
    report: { xAxis: FIXTURES.xAxisReport.xAxis },
    groupBy: FIXTURES.xAxisReport.groupBy,
    expected: FIXTURES.xAxisReport.expected
  },
  {
    type: 'add xAxis at the first position when isTopX',
    report: FIXTURES.isTopXReport,
    groupBy: FIXTURES.isTopXReport.groupBy,
    expected: FIXTURES.isTopXReport.expected
  }
]

describe('Convert Report Meta To GQL', () => {
  describe('GroupBy rules', () => {
    it.each(groupByScenarios)('should $type', ({ report, groupBy, expected }) => {
      const { sut } = makeSut(report)
      sut.setGroupBy(groupBy)

      expect(sut.groupBy).toEqual(expected)
    })
  })
})
