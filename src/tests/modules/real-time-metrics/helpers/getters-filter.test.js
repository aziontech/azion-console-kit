import { describe, expect, it } from 'vitest'
import * as getters from '@modules/real-time-metrics/helpers/getters'

const fixtures = {
  filters: {
    selected: {},
    datasetAvailable: [],
    infoAvailable: {}
  }
}

describe('RealTimeMetricsModule', () => {
  describe('Filters getters', () => {
    const filterScenarios = [
      {
        description: 'should return the current infoAvailable',
        method: 'infoAvailableFiltersCurrent',
        filters: fixtures.filters,
        expectedResult: {}
      },
      {
        description: 'should return the current selected',
        method: 'currentFilters',
        filters: fixtures.filters,
        expectedResult: {}
      },
      {
        description: 'should return the current datasetAvailable',
        method: 'getDatasetAvailableFilters',
        filters: fixtures.filters,
        expectedResult: []
      },
      {
        description: 'should return the loading state',
        method: 'getIsLoadingFilters',
        filters: fixtures.filters,
        expectedResult: true
      },
      {
        description: 'should return the loading state',
        method: 'getIsLoadingFilters',
        filters: { ...fixtures.filters, datasetAvailable: [{}], infoAvailable: { test: 1 } },
        expectedResult: false
      }
    ]
    it.each(filterScenarios)('$description', ({ method, filters, expectedResult }) => {
      expect(getters[method]({ filters })).toEqual(expectedResult)

      expect(getters[method]({ filters })).toBeDefined()
    })
  })
})
