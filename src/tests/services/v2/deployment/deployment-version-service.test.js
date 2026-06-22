import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { DeploymentVersionService } from '@/services/v2/deployment/deployment-version-service'

// Task 4.4 (non-regression): after extending VersionServiceBase, the deployment
// service must keep its consumer-facing shapes — `{ body, count }` on the list —
// and invalidate BOTH the version cache and the deployment detail on create.

const DID = 'dep-1'
const VID = 'AVDEP001'
const BASE = `/deployment-api/v4/deployments/${DID}/versions`

let service

beforeEach(() => {
  service = new DeploymentVersionService()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DeploymentVersionService - listVersionsService returns { body, count }', () => {
  const stubEnsure = () =>
    vi.spyOn(queryClient, 'ensureQueryData').mockImplementation(({ queryFn }) => queryFn())

  it('GETs /versions and returns the adapted body + count from a {results,count} envelope', async () => {
    stubEnsure()
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({
      data: {
        results: [{ id: VID, name: 'v1', state: 'draft', resources: [] }],
        count: 1
      }
    })

    const result = await service.listVersionsService(DID)

    expect(requestSpy).toHaveBeenCalledWith({ method: 'GET', url: BASE, params: {} })
    expect(result.count).toBe(1)
    expect(Array.isArray(result.body)).toBe(true)
    expect(result.body[0]).toMatchObject({ id: VID, name: 'v1', state: 'draft' })
  })

  it('unwraps a bare array response into { body, count }', async () => {
    stubEnsure()
    vi.spyOn(httpService, 'request').mockResolvedValueOnce({
      data: [
        { id: 'AVDEP001', name: 'a', state: 'ready', resources: [] },
        { id: 'AVDEP002', name: 'b', state: 'draft', resources: [] }
      ]
    })

    const result = await service.listVersionsService(DID)

    expect(result.count).toBe(2)
    expect(result.body).toHaveLength(2)
  })

  it('defaults to { body: [], count: 0 } when the cache yields nothing', async () => {
    vi.spyOn(service, 'useEnsureQueryData').mockResolvedValueOnce(undefined)

    const result = await service.listVersionsService(DID)

    expect(result).toEqual({ body: [], count: 0 })
  })

  it('keys the list query under deployments.versions.list and skips cache on search', async () => {
    const ensureSpy = vi
      .spyOn(service, 'useEnsureQueryData')
      .mockResolvedValueOnce({ body: [], count: 0 })

    await service.listVersionsService(DID, { search: 'foo' })

    expect(ensureSpy).toHaveBeenCalledWith(
      queryKeys.deployments.versions.list(DID, { search: 'foo' }),
      expect.any(Function),
      expect.objectContaining({ persist: false, skipCache: true })
    )
  })
})

describe('DeploymentVersionService - createVersionService invalidates both caches', () => {
  it('POSTs to /versions and removes the version cache + invalidates the deployment detail', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {})
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { id: VID, state: 'draft', resources: [] } })

    const result = await service.createVersionService(DID, { strategy: 'clone' })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: BASE,
      body: expect.objectContaining({ strategy: 'clone' })
    })
    expect(result).toEqual({ data: expect.objectContaining({ id: VID }) })

    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.deployments.versions.all(DID)
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.deployments.detail(DID)
    })
  })

  it('invalidateAfterMutation extends the base hook with the deployment detail', () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {})

    service.invalidateAfterMutation(DID)

    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.deployments.versions.all(DID)
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.deployments.detail(DID)
    })
  })
})
