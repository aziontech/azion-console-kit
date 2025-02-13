/**
 * @typedef {Object} Dashboard
 * @property {string} id - The unique identifier of the dashboard.
 * @property {string} label - The display name of the dashboard.
 * @property {string} path - The URL path of the dashboard.
 * @property {string} dataset - The dataset the dashboard is associated with.
 */

/**
 * @typedef {Object} Page
 * @property {number} id - The unique identifier of the page.
 * @property {string} label - The display name of the page.
 * @property {string} path - The URL path of the page.
 * @property {number} groupId - The group identifier the page belongs to.
 * @property {Dashboard[]} dashboards - The list of dashboards in the page.
 */

/**
 * @typedef {Object} Group
 * @property {string} label - The display name of the group.
 * @property {string} value - The value of the group.
 * @property {number} id - The unique identifier of the group.
 * @property {Page[]} pagesDashboards - The list of pages in the group.
 */
const PAGES_DASHBOARDS = {
  build: [
    {
      id: 1,
      label: 'Edge Applications',
      path: 'edge-applications',
      groupId: 1,
      dashboards: [
        {
          id: '357548608166298191',
          label: 'Data Transferred',
          path: 'data-transferred',
          dataset: 'httpMetrics'
        },
        {
          id: '357548623571976783',
          label: 'Requests',
          path: 'requests',
          dataset: 'httpMetrics'
        },
        {
          id: '357548642810200653',
          label: 'Status Codes',
          path: 'status-codes',
          dataset: 'httpMetrics'
        },
        {
          id: '357549179454620239',
          label: 'Bandwidth Saving',
          path: 'bandwidth-saving',
          dataset: 'httpMetrics'
        },
        {
          id: '357549179454620240',
          label: 'Request Breakdown',
          path: 'request-breakdown',
          dataset: 'httpBreakdownMetrics'
        }
      ]
    },
    {
      id: 2,
      label: 'Tiered Cache',
      path: 'tiered-cache',
      groupId: 1,
      dashboards: [
        {
          id: '357549371218199219',
          label: 'Caching Offload',
          path: 'caching-offload',
          dataset: 'l2CacheMetrics'
        }
      ]
    },
    {
      id: 3,
      label: 'Edge Functions',
      path: 'edge-functions',
      groupId: 1,
      dashboards: [
        {
          id: '357549319029523021',
          label: 'Invocations',
          path: 'invocations',
          dataset: 'edgeFunctionsMetrics'
        }
      ]
    },
    {
      id: 4,
      label: 'Image Processor',
      path: 'image-processor',
      groupId: 1,
      dashboards: [
        {
          id: '357549422933967445',
          label: 'Requests',
          path: 'requests',
          dataset: 'imagesProcessedMetrics'
        }
      ]
    }
  ],
  secure: [
    {
      id: 6,
      label: 'WAF',
      path: 'waf',
      groupId: 2,
      dashboards: [
        {
          id: '357548675837198933',
          label: 'Threats',
          path: 'threats',
          dataset: 'httpMetrics'
        }
      ]
    },
    {
      id: 7,
      label: 'Edge DNS',
      path: 'edge-dns',
      groupId: 2,
      dashboards: [
        {
          id: '357549371218199119',
          label: 'Standard Queries',
          path: 'standard-queries',
          dataset: 'idnsQueriesMetrics'
        }
      ]
    },
    {
      id: 9,
      label: 'Bot Manager',
      path: 'bot-manager-advanced',
      groupId: 2,
      dashboards: [
        {
          id: '371360344901061482',
          label: 'Overview',
          path: 'overview',
          dataset: 'botManagerMetrics'
        },
        {
          id: '659868342290523846',
          label: 'Breakdown',
          path: 'breakdown',
          dataset: 'botManagerBreakdownMetrics'
        }
      ]
    },
    {
      id: 10,
      label: 'Threats Breakdown',
      path: 'threats',
      groupId: 2,
      dashboards: [
        {
          id: '357548675837198934',
          label: 'Threats Breakdown',
          path: 'breakdown',
          dataset: 'httpBreakdownMetrics'
        }
      ]
    }
  ],
  observe: [
    {
      id: 8,
      label: 'Data Stream',
      path: 'data-stream',
      groupId: 3,
      dashboards: [
        {
          id: '352149476039721549',
          label: 'Data Streamed',
          path: 'requests',
          dataset: 'dataStreamedMetrics'
        }
      ]
    }
  ]
}

const GROUP_DASHBOARDS = [
  {
    label: 'Build',
    value: 'build',
    id: 1,
    pagesDashboards: PAGES_DASHBOARDS.build
  },
  {
    label: 'Secure',
    value: 'secure',
    id: 2,
    pagesDashboards: PAGES_DASHBOARDS.secure
  },
  {
    label: 'Observe',
    value: 'observe',
    id: 3,
    pagesDashboards: PAGES_DASHBOARDS.observe
  }
]

export default GROUP_DASHBOARDS
