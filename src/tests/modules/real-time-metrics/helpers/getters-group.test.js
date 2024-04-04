import { describe, expect, it } from 'vitest'
import * as getters from '@modules/real-time-metrics/helpers/getters'

const groupFixture = {
  label: 'Group',
  value: 'group',
  id: 1,
  pagesDashboards: [
    {
      id: 1,
      label: 'Page',
      path: 'page',
      groupId: 1,
      dashboards: [
        {
          id: '123',
          label: 'Dashboard',
          path: 'dashboard',
          dataset: 'dataset'
        }
      ]
    }
  ]
}

const fixtures = {
  group: {
    all: [groupFixture],
    current: { ...groupFixture },
    currentPage: { ...groupFixture.pagesDashboards[0] },
    currentDashboard: { ...groupFixture.pagesDashboards[0].dashboards[0] }
  }
}

describe('RealTimeMetricsModule', () => {
  describe('Group getters', () => {
    const groupScenarios = [
      {
        description: 'should return all groups',
        method: 'getGroupPages',
        group: fixtures.group,
        expectedResult: fixtures.group.all
      },
      {
        description: 'should return the current group',
        method: 'groupPageCurrent',
        group: fixtures.group,
        expectedResult: fixtures.group.current
      },
      {
        description: 'should return the current page',
        method: 'pageCurrent',
        group: fixtures.group,
        expectedResult: fixtures.group.currentPage
      },
      {
        description: 'should return the current dashboard',
        method: 'dashboardCurrent',
        group: fixtures.group,
        expectedResult: fixtures.group.currentDashboard
      },
      {
        description: 'should return the current info',
        method: 'getCurrentInfo',
        group: fixtures.group,
        expectedResult: {
          Page: 'Page',
          Dashboard: 'Dashboard',
          Group: 'Group'
        }
      },
      {
        description: 'should return the current page info',
        method: 'getPages',
        group: fixtures.group,
        expectedResult: [
          {
            idx: 0,
            id: 1,
            label: 'Page',
            path: 'page',
            dashboards: [
              {
                id: '123',
                label: 'Dashboard',
                path: 'dashboard',
                dataset: 'dataset'
              }
            ]
          }
        ]
      },
      {
        description: 'should return the dashboards by selected page',
        method: 'dashboardBySelectedPage',
        group: fixtures.group,
        expectedResult: [
          {
            id: '123',
            label: 'Dashboard',
            path: 'dashboard',
            dataset: 'dataset'
          }
        ]
      },
      {
        description: 'should return an empty array when selected page does not have dashboards',
        method: 'dashboardBySelectedPage',
        group: {},
        expectedResult: []
      },
      {
        description: 'should return the current id for page and dashboard',
        method: 'currentIdPageAndDashboard',
        group: fixtures.group,
        expectedResult: {
          pageId: 'page',
          dashboardId: 'dashboard'
        }
      }
    ]
    it.each(groupScenarios)('$description', ({ method, group, expectedResult }) => {
      expect(getters[method]({ group })).toEqual(expectedResult)

      expect(getters[method]({ group })).toBeDefined()
    })
  })
})
