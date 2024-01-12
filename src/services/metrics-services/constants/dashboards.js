const GROUP_DASHBOARDS = [
  {
    label: 'Build',
    value: 'Build',
    id: 1,
    pagesDashboards: [
      {
        id: 1,
        label: 'Edge Applications',
        url: 'edge-applications',
        groupId: 1,
        dashboards: [
          {
            id: 357548608166298191n,
            label: 'Data Transferred',
            url: 'data-transferred',
            dataset: 'httpMetrics'
          },
          {
            id: 357548623571976783n,
            label: 'Requests',
            url: 'requests',
            dataset: 'httpMetrics'
          },
          {
            id: 357548642810200653n,
            label: 'Status Codes',
            url: 'status-codes',
            dataset: 'httpMetrics'
          },
          {
            id: 357549179454620239n,
            label: 'Bandwidth Saving',
            url: 'bandwidth-saving',
            dataset: 'httpMetrics'
          }
        ]
      },
      {
        id: 2,
        label: 'L2 Caching',
        url: 'l2-caching',
        groupId: 1,
        dashboards: [
          {
            id: 357549371218199219n,
            label: 'caching-offload',
            url: 'caching-offload',
            dataset: 'l2CacheMetrics'
          }
        ]
      },
      {
        id: 3,
        label: 'Edge Functions',
        url: 'edge-functions',
        groupId: 1,
        dashboards: [
          {
            id: 357549319029523021n,
            label: 'Invocations',
            url: 'invocations',
            dataset: 'edgeFunctionsMetrics'
          }
        ]
      },
      {
        id: 4,
        label: 'Image Processor',
        url: 'image-processor',
        groupId: 1,
        dashboards: [
          {
            id: 357549422933967445n,
            label: 'Requests',
            url: 'requests',
            dataset: 'imagesProcessedMetrics'
          }
        ]
      }
    ]
  },
  {
    label: 'Secure',
    value: 'Secure',
    id: 2,
    pagesDashboards: [
      {
        id: 6,
        label: 'WAF',
        url: 'waf',
        groupId: 2,
        dashboards: [
          {
            id: 357548675837198933n,
            label: 'Threats',
            url: 'threats',
            dataset: 'httpMetrics'
          }
        ]
      },
      {
        id: 7,
        label: 'Intelligent DNS',
        url: 'intelligent-dns',
        groupId: 2,
        dashboards: [
          {
            id: 357549371218199119n,
            label: 'Standard Queries',
            url: 'standard-queries',
            dataset: 'idnsQueriesMetrics'
          }
        ]
      }
    ]
  },
  {
    label: 'Observe',
    value: 'Observe',
    id: 3,
    pagesDashboards: [
      {
        id: 8,
        label: 'Data Streaming',
        url: 'data-streaming',
        groupId: 3,
        dashboards: [
          {
            id: 352149476039721549n,
            label: 'Data Streamed',
            url: 'requests',
            dataset: 'dataStreamedMetrics'
          }
        ]
      }
    ]
  }
]

export default GROUP_DASHBOARDS
