import { describe, expect, it } from 'vitest'
import { GROUP_DASHBOARDS } from '@modules/real-time-metrics/constants'

describe('RealTimeMetricsModule', () => {
  describe('Dashboard constants', () => {
    it('should be defined', () => {
      expect(GROUP_DASHBOARDS).toBeDefined()
    })

    it('should have the correct array values', () => {
      const groupDashboards = [
        {
          label: 'Build',
          value: 'build',
          id: 1,
          pagesDashboards: [
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
          ]
        },
        {
          label: 'Secure',
          value: 'secure',
          id: 2,
          pagesDashboards: [
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
              label: 'Bot Manager Advanced',
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
                  dataset: 'securityMetrics'
                }
              ]
            }
          ]
        },
        {
          label: 'Observe',
          value: 'observe',
          id: 3,
          pagesDashboards: [
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
      ]

      expect(GROUP_DASHBOARDS).toEqual(groupDashboards)
    })
  })
})
