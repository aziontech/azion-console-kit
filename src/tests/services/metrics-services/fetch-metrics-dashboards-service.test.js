import { fetchMetricsDashboardsService } from '@/services/metrics-services'
import { describe, expect, it } from 'vitest'

const fixtures = {
  edgeApplications: [
    {
      id: 357548608166298191n,
      label: 'Data Transferred',
      dataset: 'httpMetrics',
      path: 'data-transferred'
    },
    {
      id: 357548623571976783n,
      label: 'Requests',
      dataset: 'httpMetrics',
      path: 'requests'
    },
    {
      id: 357548642810200653n,
      label: 'Status Codes',
      dataset: 'httpMetrics',
      path: 'status-codes'
    },
    {
      id: 357549179454620239n,
      label: 'Bandwidth Saving',
      dataset: 'httpMetrics',
      path: 'bandwidth-saving'
    }
  ],
  l2Caching: [
    {
      id: 357549371218199219n,
      label: 'Caching Offload',
      dataset: 'l2CacheMetrics',
      path: 'caching-offload'
    }
  ],
  edgeFunctions: [
    {
      id: 357549319029523021n,
      label: 'Invocations',
      dataset: 'edgeFunctionsMetrics',
      path: 'invocations'
    }
  ],
  imageProcessor: [
    {
      id: 357549422933967445n,
      label: 'Requests',
      dataset: 'imagesProcessedMetrics',
      path: 'requests'
    }
  ],
  waf: [
    {
      id: 357548675837198933n,
      label: 'Threats',
      dataset: 'httpMetrics',
      path: 'threats'
    }
  ],
  intelligentDns: [
    {
      id: 357549371218199119n,
      label: 'Standard Queries',
      dataset: 'idnsQueriesMetrics',
      path: 'standard-queries'
    }
  ],
  dataStreaming: [
    {
      id: 352149476039721549n,
      label: 'Data Streamed',
      dataset: 'dataStreamedMetrics',
      path: 'requests'
    }
  ]
}

const makeSut = () => {
  const sut = fetchMetricsDashboardsService

  return {
    sut
  }
}

const scenarios = [
  {
    group: 'build',
    page: 'edgeApplications',
    pageUrl: 'edge-applications',
    groupId: 1,
    pageId: 1,
    expected: fixtures.edgeApplications
  },
  {
    group: 'build',
    page: 'l2Caching',
    pageUrl: 'l2-caching',
    groupId: 1,
    pageId: 2,
    expected: fixtures.l2Caching
  },
  {
    group: 'build',
    page: 'edgeFunctions',
    pageUrl: 'edge-functions',
    groupId: 1,
    pageId: 3,
    expected: fixtures.edgeFunctions
  },
  {
    group: 'build',
    page: 'imageProcessor',
    pageUrl: 'image-processor',
    groupId: 1,
    pageId: 4,
    expected: fixtures.imageProcessor
  },
  {
    group: 'secure',
    page: 'waf',
    pageUrl: 'waf',
    groupId: 2,
    pageId: 6,
    expected: fixtures.waf
  },
  {
    group: 'secure',
    page: 'intelligentDns',
    pageUrl: 'intelligent-dns',
    groupId: 2,
    pageId: 7,
    expected: fixtures.intelligentDns
  },
  {
    group: 'observe',
    page: 'dataStreaming',
    pageUrl: 'data-streaming',
    groupId: 3,
    pageId: 8,
    expected: fixtures.dataStreaming
  }
]

describe('MetricsServices', () => {
  it.each(scenarios)(
    'should return a list of dashboards within %group group and %page page',
    async ({ group, pageUrl, expected }) => {
      const { sut } = makeSut()

      const dashboards = await sut(group, pageUrl)

      expect(dashboards).toEqual(expected)
    }
  )

  it.each([
    { group: 'build', product: 'undefined', expected: [] },
    { group: 'undefined', product: 'edge-applications', expected: [] }
  ])('should return an empty list on not found group or product', async () => {
    const { sut } = makeSut()

    const dashboards = await sut()

    expect(dashboards).toEqual([])
  })

  it('should return an empty list on undefined group', async () => {
    const { sut } = makeSut()

    const dashboards = await sut()

    expect(dashboards).toEqual([])
  })
})
