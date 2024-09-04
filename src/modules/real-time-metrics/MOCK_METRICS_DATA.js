export const MOCK_NEW_PAGE_INFO = {
  page: [
    {
      id: 0,
      label: 'New Charts',
      path: 'new-charts',
      groupId: 0,
      dashboards: [
        {
          id: '11111111111111111',
          label: 'New Charts',
          path: 'new-charts',
          dataset: 'httpMetrics'
        }
      ]
    }
  ],
  group: {
    label: 'New',
    value: 'new',
    id: 1,
    pagesDashboards: [
      {
        id: 0,
        label: 'New Charts',
        path: 'new-charts',
        groupId: 0,
        dashboards: [
          {
            id: '11111111111111111',
            label: 'New Charts',
            path: 'new-charts',
            dataset: 'httpMetrics'
          }
        ]
      }
    ]
  },
  dashboard: [
    {
      id: '888888888888888888',
      chartOwner: 'azion',
      label: 'Stacked Bar Chart',
      description: 'description',
      aggregationType: 'sum',
      columns: 6,
      type: 'stacked-bar',
      xAxis: 'ts',
      isTopX: false,
      rotated: false,
      dataUnit: 'bytes',
      dataset: 'httpMetrics',
      limit: 5000,
      fields: ['dataTransferredOut', 'dataTransferredIn'],
      groupBy: [],
      orderDirection: 'ASC',
      dashboardId: '11111111111111111',
      helpCenterPath: 'path'
    },
    {
      id: '777777777777777777',
      chartOwner: 'azion',
      label: 'Gauge Chart',
      description: 'description',
      aggregationType: 'sum',
      columns: 6,
      type: 'gauge',
      xAxis: 'ts',
      isTopX: true,
      rotated: true,
      dataUnit: 'bytes',
      dataset: 'httpMetrics',
      limit: 5,
      fields: ['bandwidthTotal'],
      groupBy: ['geolocCountryName'],
      aggregations: [
        {
          aggregation: 'count',
          variable: 'rows'
        }
      ],
      orderDirection: 'DESC',
      dashboardId: '11111111111111111',
      helpCenterPath: 'path',
      variationType: 'regular',
      threshold: [1000000, 30000000, 100000000]
    },
    {
      id: '666666666666666666',
      chartOwner: 'azion',
      label: 'Big Numbers Chart',
      description: 'description',
      aggregationType: 'sum',
      columns: 6,
      type: 'big-numbers',
      xAxis: 'ts',
      isTopX: true,
      rotated: true,
      dataUnit: 'bytes',
      dataset: 'httpMetrics',
      limit: 5,
      fields: ['bandwidthTotal'],
      groupBy: ['geolocCountryName'],
      aggregations: [
        {
          aggregation: 'count',
          variable: 'rows'
        }
      ],
      orderDirection: 'DESC',
      dashboardId: '11111111111111111',
      helpCenterPath: 'path',
      variationType: 'regular'
    },
    {
      id: '555555555555555555',
      chartOwner: 'azion',
      label: 'Maps Chart',
      description: 'description',
      aggregationType: 'sum',
      columns: 6,
      type: 'map',
      xAxis: 'cat',
      isTopX: true,
      rotated: true,
      dataUnit: 'bytes',
      dataset: 'httpMetrics',
      limit: 5,
      fields: ['bandwidthTotal'],
      groupBy: ['geolocCountryName'],
      aggregations: [
        {
          aggregation: 'count',
          variable: 'rows'
        }
      ],
      orderDirection: 'DESC',
      dashboardId: '11111111111111111',
      helpCenterPath: 'path',
      variationType: 'regular'
    },
    {
      id: '444444444444444444',
      chartOwner: 'azion',
      label: 'Ordered Bar Chart',
      description: 'description',
      aggregationType: 'sum',
      columns: 6,
      type: 'ordered-bar',
      xAxis: 'cat',
      isTopX: true,
      rotated: true,
      dataUnit: 'bytes',
      dataset: 'httpMetrics',
      limit: 5,
      fields: ['bandwidthTotal'],
      groupBy: ['geolocCountryName'],
      aggregations: [
        {
          aggregation: 'count',
          variable: 'rows'
        }
      ],
      orderDirection: 'DESC',
      dashboardId: '11111111111111111',
      helpCenterPath: 'path'
    },
    {
      id: '333333333333333333',
      chartOwner: 'azion',
      label: 'Donut Chart',
      description: 'description',
      aggregationType: 'sum',
      columns: 6,
      type: 'donut',
      xAxis: 'cat',
      isTopX: true,
      rotated: false,
      dataUnit: 'bytes',
      dataset: 'httpMetrics',
      limit: 5,
      fields: ['bandwidthTotal'],
      groupBy: ['geolocCountryName'],
      aggregations: [
        {
          aggregation: 'count',
          variable: 'rows'
        }
      ],
      orderDirection: 'DESC',
      dashboardId: '11111111111111111',
      helpCenterPath: 'path'
    },
    {
      id: '222222222222222222',
      chartOwner: 'azion',
      label: 'Pie Chart',
      description: 'description',
      aggregationType: 'sum',
      columns: 6,
      type: 'pie',
      xAxis: 'cat',
      isTopX: true,
      rotated: false,
      dataUnit: 'bytes',
      dataset: 'httpMetrics',
      limit: 5,
      fields: ['bandwidthTotal'],
      groupBy: ['geolocCountryName'],
      aggregations: [
        {
          aggregation: 'count',
          variable: 'rows'
        }
      ],
      orderDirection: 'DESC',
      dashboardId: '11111111111111111',
      helpCenterPath: 'path'
    },
    {
      id: '999999999999999999',
      chartOwner: 'azion',
      label: 'Stacked Area Chart',
      description: 'description',
      aggregationType: 'sum',
      columns: 6,
      type: 'stacked-area',
      xAxis: 'ts',
      isTopX: true,
      rotated: false,
      dataUnit: 'bytes',
      dataset: 'httpMetrics',
      limit: 5,
      fields: ['dataTransferredOut', 'dataTransferredIn'],
      groupBy: ['ts'],
      aggregations: [
        {
          aggregation: 'count',
          variable: 'rows'
        }
      ],
      orderDirection: 'DESC',
      dashboardId: '11111111111111111',
      helpCenterPath: 'path'
    },
    {
      id: '11111111111111111',
      chartOwner: 'azion',
      label: 'List Chart',
      description: 'description',
      aggregationType: 'sum',
      columns: 12,
      type: 'list',
      xAxis: 'cat',
      isTopX: true,
      rotated: false,
      dataUnit: 'bytes',
      dataset: 'httpMetrics',
      limit: 5,
      fields: ['bandwidthTotal', 'bandwidthMissedData'],
      groupBy: ['geolocCountryName'],
      aggregations: [
        {
          aggregation: 'count',
          variable: 'rows'
        }
      ],
      orderDirection: 'DESC',
      dashboardId: '11111111111111111',
      helpCenterPath: 'path'
    }
  ]
}
