import { fetchMetricsDashboardsService } from '@/services/metrics-services'
import { describe, expect, it } from 'vitest'

const fixtures = {
  edgeApplications: [
    {
      id: 357548608166298191n,
      label: 'Data Transferred',
      dataset: 'httpMetrics'
    },
    {
      id: 357548623571976783n,
      label: 'Requests',
      dataset: 'httpMetrics'
    },
    {
      id: 357548642810200653n,
      label: 'Status Codes',
      dataset: 'httpMetrics'
    },
    {
      id: 357549179454620239n,
      label: 'Bandwidth Saving',
      dataset: 'httpMetrics'
    }
  ],
  l2Caching: [
    {
      id: 357549371218199219n,
      label: 'caching-offload',
      dataset: 'l2CacheMetrics'
    }
  ],
  edgeFunctions: [
    {
      id: 357549319029523021n,
      label: 'Invocations',
      dataset: 'edgeFunctionsMetrics'
    }
  ],
  imageProcessor: [
    {
      id: 357549422933967445n,
      label: 'Requests',
      dataset: 'imagesProcessedMetrics'
    }
  ],
  waf: [
    {
      id: 357548675837198933n,
      label: 'Threats',
      dataset: 'httpMetrics'
    }
  ],
  intelligentDns: [
    {
      id: 357549371218199119n,
      label: 'Standard Queries',
      dataset: 'idnsQueriesMetrics'
    }
  ],
  dataStreaming: [
    {
      id: 352149476039721549n,
      label: 'Data Streamed',
      dataset: 'dataStreamedMetrics'
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
    groupId: 1,
    pageId: 1,
    expected: fixtures.edgeApplications
  },
  {
    group: 'build',
    page: 'l2Caching',
    groupId: 1,
    pageId: 2,
    expected: fixtures.l2Caching
  },
  {
    group: 'build',
    page: 'edgeFunctions',
    groupId: 1,
    pageId: 3,
    expected: fixtures.edgeFunctions
  },
  {
    group: 'build',
    page: 'imageProcessor',
    groupId: 1,
    pageId: 4,
    expected: fixtures.imageProcessor
  },
  {
    group: 'secure',
    page: 'waf',
    groupId: 2,
    pageId: 6,
    expected: fixtures.waf
  },
  {
    group: 'secure',
    page: 'intelligentDns',
    groupId: 2,
    pageId: 7,
    expected: fixtures.intelligentDns
  },
  {
    group: 'observe',
    page: 'dataStreaming',
    groupId: 3,
    pageId: 8,
    expected: fixtures.dataStreaming
  }
]

describe('MetricsServices', () => {
  it.each(scenarios)(
    'should return a list of dashboards within %group group and %page page',
    async ({ groupId, pageId, expected }) => {
      const { sut } = makeSut()

      const dashboards = await sut(groupId, pageId)

      expect(dashboards).toEqual(expected)
    }
  )

  it.each([
    { group: 1, page: 0, expected: [] },
    { group: 0, page: 1, expected: [] }
  ])('should return an empty list on not found group or page', async () => {
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
