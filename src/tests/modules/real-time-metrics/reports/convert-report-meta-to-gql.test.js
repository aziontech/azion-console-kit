import { describe, expect, it } from 'vitest'
import GqlRules from '@/modules/real-time-metrics/reports/convert-report-meta-to-gql'
import REPORTS from '@modules/real-time-metrics/constants/reports'
import REPORT_GQL_FIXTURES from './fixtures/gql-fixtures'

const makeSut = (constructorProps) => {
  const sut = new GqlRules(constructorProps)
  return {
    sut
  }
}

describe('RealTimeMetricsModule', () => {
  describe('ConvertReportMetaToGql', () => {
    it('should generate a default query', () => {
      const { sut } = makeSut({ dataset: 'test' })
      expect(sut.generateGqlQuery()).toEqual({
        query: `query () {
      test (
        limit: 2000
        
        groupBy: [ts]
        orderBy: [ts_ASC]
        filter: {
          
        }
        ) {
          ts
        }
      }`,
        variables: {}
      })
    })

    it.each(REPORTS)('should generate a query for the report - $label', (reportData) => {
      const tsRange = {
        meta: { option: 'custom' },
        begin: '2024-01-01T12:00:00',
        end: '2024-12-01T12:00:00'
      }
      const fixtureData = REPORT_GQL_FIXTURES.find((fixture) => fixture.id === reportData.id)

      const constructorProps = {
        dataset: reportData.dataset,
        aggregations: reportData.aggregations,
        filters: {
          ...reportData.filters,
          tsRange
        },
        fields: reportData.fields,
        groupBy: reportData.groupBy,
        orderBy: reportData.orderBy,
        limit: reportData.limit,
        isTopX: reportData.isTopX,
        xAxis: reportData.xAxis,
        orderDirection: reportData.orderDirection,
        aggregationType: reportData.aggregationType
      }
      const { sut } = makeSut(constructorProps)

      expect(sut.generateGqlQuery()).toEqual(fixtureData.gqlQuery)
    })
  })
})
