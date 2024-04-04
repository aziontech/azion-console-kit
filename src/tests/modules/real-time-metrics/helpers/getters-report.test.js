import { describe, expect, it } from 'vitest'
import { getCurrentReportsData } from '@modules/real-time-metrics/helpers/getters'

const fixtures = {
  reports: {
    all: [],
    current: [
      {
        id: '123',
        chartOwner: 'owner',
        label: 'Label',
        description: 'description',
        aggregationType: 'sum',
        columns: 1,
        type: 'line',
        xAxis: 'ts',
        isTopX: false,
        rotated: false,
        dataUnit: 'unit',
        dataset: 'dataset',
        limit: 1,
        fields: [],
        groupBy: [],
        orderDirection: 'ASC',
        dashboardId: '123',
        helpCenterPath: 'path'
      }
    ]
  }
}

describe('RealTimeMetricsModule', () => {
  describe('Report getters', () => {
    it('should return the current reports data', () => {
      const expectedResult = fixtures.reports.current

      expect(getCurrentReportsData({ reports: fixtures.reports })).toEqual(expectedResult)

      expect(getCurrentReportsData({ reports: fixtures.reports })).toBeDefined()
    })
  })
})
