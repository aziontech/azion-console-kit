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

    it.each(REPORT_GQL_FIXTURES)(
      'should generate a query for the report - $label',
      ({ id, gqlQuery }) => {
        const tsRange = {
          meta: { option: 'custom' },
          begin: '2024-01-01T12:00:00',
          end: '2024-12-01T12:00:00'
        }
        const reportData = REPORTS.find((report) => report.id === id)
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

        expect(sut.generateGqlQuery()).toEqual(gqlQuery)
      }
    )
  })
})
