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
      variationType: 'regular'
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
    }
  ]
}
