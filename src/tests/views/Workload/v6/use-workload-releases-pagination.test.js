import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { deploymentReleaseService } from '@/services/v2/deployment/deployment-release-service'
import { deploymentService } from '@/services/v2/deployment/deployment-service'
import {
  useWorkloadReleases,
  RELEASES_PAGE_SIZE
} from '@/views/Workload/v6/composables/useWorkloadReleases'

vi.mock('@aziontech/webkit/use-toast', () => ({ useToast: () => ({ add: vi.fn() }) }))

const withDeployments = (ids) =>
  useWorkloadReleases({
    workloadId: 'w1',
    getWorkload: () => ({ bindings: ids.map((id) => ({ deployment_id: id })) })
  })

beforeEach(() => {
  vi.spyOn(deploymentService, 'listDeploymentsService').mockResolvedValue({ body: [] })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useWorkloadReleases pagination', () => {
  it('requests an explicit first page at the API ceiling for each deployment', async () => {
    const spy = vi
      .spyOn(deploymentReleaseService, 'listReleasesService')
      .mockResolvedValue({ body: [], count: 0 })

    const { reload } = withDeployments(['d1', 'd2'])
    await reload()

    expect(spy).toHaveBeenCalledWith('d1', { page: 1, pageSize: RELEASES_PAGE_SIZE })
    expect(spy).toHaveBeenCalledWith('d2', { page: 1, pageSize: RELEASES_PAGE_SIZE })
  })

  it('flags truncation when a deployment reports more releases than the page holds', async () => {
    vi.spyOn(deploymentReleaseService, 'listReleasesService').mockResolvedValue({
      body: new Array(RELEASES_PAGE_SIZE).fill({ id: 'r' }),
      count: 250
    })

    const { reload, truncated } = withDeployments(['d1'])
    await reload()

    expect(truncated.value).toBe(true)
  })

  it('leaves truncation off when the count fits in the page', async () => {
    vi.spyOn(deploymentReleaseService, 'listReleasesService').mockResolvedValue({
      body: [{ id: 'r1' }],
      count: 1
    })

    const { reload, truncated } = withDeployments(['d1'])
    await reload()

    expect(truncated.value).toBe(false)
  })

  it('resets the truncation flag on a subsequent reload', async () => {
    const spy = vi.spyOn(deploymentReleaseService, 'listReleasesService').mockResolvedValue({
      body: new Array(RELEASES_PAGE_SIZE).fill({ id: 'r' }),
      count: 250
    })

    const { reload, truncated } = withDeployments(['d1'])
    await reload()
    expect(truncated.value).toBe(true)

    spy.mockResolvedValue({ body: [{ id: 'r1' }], count: 1 })
    await reload()

    expect(truncated.value).toBe(false)
  })
})
