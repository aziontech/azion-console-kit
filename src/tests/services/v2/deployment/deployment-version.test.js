/**
 * Coverage-matrix claims (spec versioning-test-coverage / TEST-ARCHITECTURE §3.4).
 * The matrix (tests/coverage-matrix.json) is DERIVED from these markers —
 * run `node scripts/check-coverage-matrix.mjs --write` after changing them.
 * @covers deployment:J1 component partial
 * @covers deployment:J2 component
 * @covers deployment:J3 component partial
 * @covers deployment:J4 component
 * @covers deployment:J5 component partial
 * @covers deployment:J6 component partial
 * @covers deployment:J7 component
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { RESOURCE_TEST_REGISTRY } from '@/tests/support/versioning/registry'
import { DeploymentVersionService } from '@/services/v2/deployment/deployment-version-service'

const deployment = RESOURCE_TEST_REGISTRY.deployment
const adapter = deployment.adapter

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

describe('deployment — resource bindings', () => {
  it('binds the deployment-api baseURL + versions query keys', () => {
    expect(service.baseURL).toBe(deployment.baseURL)
    expect(service.versionKeys).toBe(queryKeys.deployments.versions)
    expect(service.getUrl(DID, VID, '/build')).toBe(`${BASE}/${VID}/build`)
  })
})

describe('deployment — bespoke reads: listVersionsService returns { body, count }', () => {
  const stubEnsure = () =>
    vi.spyOn(queryClient, 'ensureQueryData').mockImplementation(({ queryFn }) => queryFn())

  it('GETs /versions and returns the adapted body + count from a {results,count} envelope', async () => {
    stubEnsure()
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({
      data: { results: [{ id: VID, name: 'v1', state: 'draft', resources: [] }], count: 1 }
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

  it('reads version_id and last_editor from a flat version payload', async () => {
    stubEnsure()
    vi.spyOn(httpService, 'request').mockResolvedValueOnce({
      data: {
        results: [
          {
            version_id: VID,
            name: 'v1',
            version_state: 'ready',
            last_editor: 'editor@azion.com',
            ready_at: '2026-07-08T12:00:00Z',
            resources: []
          }
        ],
        count: 1
      }
    })

    const { body } = await service.listVersionsService(DID)

    expect(body[0]).toMatchObject({ id: VID, state: 'ready', lastEditor: 'editor@azion.com' })
  })

  it('maps pageSize to page_size when listing versions', async () => {
    stubEnsure()
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { results: [], count: 0 } })

    await service.listVersionsService(DID, { page: 2, pageSize: 20, skipCache: true })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: BASE,
      params: { page: 2, page_size: 20 }
    })
  })

  it('defaults to { body: [], count: 0 } when the cache yields nothing', async () => {
    vi.spyOn(service, 'useEnsureQueryData').mockResolvedValueOnce(undefined)

    expect(await service.listVersionsService(DID)).toEqual({ body: [], count: 0 })
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

  // The skip-cache decision is `skipCache || hasFilter || search`. Each trigger
  // must independently force the bypass, and the absence of all three must
  // KEEP the cache — asserting the full truth table so no single condition can
  // rot silently (mutation-proven).
  it.each([
    { params: { skipCache: true }, label: 'explicit skipCache' },
    { params: { hasFilter: true }, label: 'hasFilter flag' },
    { params: { search: 'x' }, label: 'search term' }
  ])('skips cache when $label is present', async ({ params }) => {
    const ensureSpy = vi
      .spyOn(service, 'useEnsureQueryData')
      .mockResolvedValueOnce({ body: [], count: 0 })

    await service.listVersionsService(DID, params)

    expect(ensureSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Function),
      expect.objectContaining({ persist: false, skipCache: true })
    )
  })

  it('KEEPS the cache when no filter/search/skipCache is present', async () => {
    const ensureSpy = vi
      .spyOn(service, 'useEnsureQueryData')
      .mockResolvedValueOnce({ body: [], count: 0 })

    await service.listVersionsService(DID, { page: 1 })

    expect(ensureSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Function),
      expect.objectContaining({ persist: true, skipCache: false })
    )
  })
})

describe('deployment — bespoke: dual cache invalidation (version + deployment detail)', () => {
  const expectBothCaches = (removeSpy, invalidateSpy) => {
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: queryKeys.deployments.versions.all(DID) })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.deployments.detail(DID) })
  }

  it('createVersionService POSTs /versions, returns { data }, invalidates both caches', async () => {
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
    expectBothCaches(removeSpy, invalidateSpy)
  })

  it('invalidateAfterMutation extends the base hook with the deployment detail', () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {})

    service.invalidateAfterMutation(DID)

    expect(removeSpy).toHaveBeenCalledWith({ queryKey: queryKeys.deployments.versions.all(DID) })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.deployments.detail(DID) })
  })

  it('updateDraft PATCHes /versions/{vid} under deployment-api and invalidates both caches', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {})
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { id: VID, state: 'draft', resources: [] } })

    await service.updateDraft(DID, VID, { strategy: 'canary' })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'PATCH',
      url: `${BASE}/${VID}`,
      body: { strategy: 'canary' }
    })
    expectBothCaches(removeSpy, invalidateSpy)
  })

  it('build POSTs /versions/{vid}/build under deployment-api and invalidates both caches', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await service.build(DID, VID, { comment: 'go-live' })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${BASE}/${VID}/build`,
      body: { comment: 'go-live' }
    })
    expectBothCaches(removeSpy, invalidateSpy)
  })

  it('cancelBuild POSTs /versions/{vid}/cancel under deployment-api and invalidates both caches', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await service.cancelBuild(DID, VID, { reason: 'aborted' })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${BASE}/${VID}/cancel`,
      body: { reason: 'aborted' }
    })
    expectBothCaches(removeSpy, invalidateSpy)
  })

  it('deleteVersion DELETEs /versions/{vid} under deployment-api and invalidates both caches', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await service.deleteVersion(DID, VID)

    expect(requestSpy).toHaveBeenCalledWith({ method: 'DELETE', url: `${BASE}/${VID}` })
    expectBothCaches(removeSpy, invalidateSpy)
  })

  it('revert POSTs /versions/{versionId}/revert with an empty body and invalidates both caches', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    const feedback = await service.revert({ id: DID, versionId: VID })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${BASE}/${VID}/revert`,
      body: {}
    })
    expect(feedback).toBe('Deployment successfully reverted')
    expectBothCaches(removeSpy, invalidateSpy)
  })
})

describe('deployment — bespoke adapter: resources[] snapshot, status, no config/version_id', () => {
  const deploymentVersion = (overrides = {}) => ({
    id: 'AVDEP0001',
    deployment_id: 'ADEP0001',
    name: 'release-42',
    state: 'ready',
    state_detail: null,
    description: 'ship it',
    updated_at: '2026-06-18T10:05:00Z',
    created_at: '2026-06-18T10:00:00Z',
    last_editor: 'editor@azion.com',
    created_by: 'creator@azion.com',
    resources: [
      {
        resource_id: 900,
        resource_type: 'application',
        resource_name: 'my-app',
        resource_version_id: 'AVAPP0007'
      },
      {
        resource_id: 901,
        resource_type: 'firewall',
        resource_name: 'my-fw',
        resource_version_id: 'AVFW0007'
      }
    ],
    ...overrides
  })

  it('normalizes meta, derives status from state and prefers last_editor', () => {
    const result = adapter.transformLoadVersion(deploymentVersion())

    expect(result.id).toBe('AVDEP0001')
    expect(result.deployment_id).toBe('ADEP0001')
    expect(result.name).toBe('release-42')
    expect(result.state).toBe('ready')
    expect(result.comment).toBe('ship it')
    expect(result.status).toEqual({ content: 'Ready', severity: 'success' })
    expect(result.lastEditor).toBe('editor@azion.com')
  })

  it('maps each snapshot resource to its label/icon + pinned version id', () => {
    const { resources } = adapter.transformLoadVersion(deploymentVersion())

    expect(resources).toHaveLength(2)
    expect(resources[0]).toEqual({
      id: 900,
      type: 'application',
      label: 'Application',
      icon: 'ai ai-edge-application',
      name: 'my-app',
      versionId: 'AVAPP0007'
    })
    expect(resources[1]).toMatchObject({
      type: 'firewall',
      label: 'Firewall',
      versionId: 'AVFW0007'
    })
  })

  it('reads state/description from the nested meta envelope', () => {
    const result = adapter.transformLoadVersion({
      id: 'AVDEP0002',
      meta: { version_state: 'building', description: 'from meta' }
    })

    expect(result.state).toBe('building')
    expect(result.status).toEqual({ content: 'Building', severity: 'info' })
    expect(result.comment).toBe('from meta')
  })

  it('falls back to created_by and Unknown status when the payload is sparse', () => {
    const result = adapter.transformLoadVersion({
      id: 'AVDEP0003',
      created_by: 'creator@azion.com'
    })

    expect(result.lastEditor).toBe('creator@azion.com')
    expect(result.state).toBeNull()
    expect(result.status).toEqual({ content: 'Unknown', severity: 'secondary' })
    expect(result.resources).toEqual([])
  })

  it('returns null for a nullish payload', () => {
    expect(adapter.transformLoadVersion(null)).toBeNull()
    expect(adapter.transformLoadVersion(undefined)).toBeNull()
  })

  it('transformListVersions maps an array with status per item; [] for non-arrays', () => {
    const result = adapter.transformListVersions([
      deploymentVersion(),
      deploymentVersion({ id: 'AVDEP0002', state: 'draft', resources: [] })
    ])

    expect(result).toHaveLength(2)
    expect(result[0].status).toEqual({ content: 'Ready', severity: 'success' })
    expect(result[1].status).toEqual({ content: 'Draft', severity: 'info' })
    expect(adapter.transformListVersions(null)).toEqual([])
    expect(adapter.transformListVersions({ results: [] })).toEqual([])
  })

  it('payload transforms keep only resource {id, resource_type} + strategy/origin/reason', () => {
    const create = adapter.transformCreateDraftPayload({
      strategy: 'canary',
      origin: 'console',
      resources: [
        { id: 900, resource_type: 'application', extra: 'dropped' },
        { id: 901, resource_type: 'firewall' }
      ]
    })
    expect(create).toEqual({
      strategy: 'canary',
      origin: 'console',
      resources: [
        { id: 900, resource_type: 'application' },
        { id: 901, resource_type: 'firewall' }
      ]
    })

    const edit = adapter.transformDraftPayload({ strategy: 'atomic' })
    expect(edit).toEqual({ strategy: 'atomic' })
    expect(edit).not.toHaveProperty('resources')

    expect(adapter.transformBuildPayload({ reason: 'go-live', comment: 'note' })).toEqual({
      reason: 'go-live',
      comment: 'note'
    })
    expect(adapter.transformArchivePayload({ comment: 'bye' })).toEqual({ comment: 'bye' })
    expect(adapter.transformBuildPayload({})).toEqual({})
  })

  it('exposes the pre-contract aliases the service relies on', () => {
    expect(adapter.transformList).toBe(adapter.transformListVersions)
    expect(adapter.transformItem).toBe(adapter.transformLoadVersion)
    expect(adapter.transformCreatePayload).toBe(adapter.transformCreateDraftPayload)
    expect(adapter.transformCancelPayload).toBe(adapter.transformBuildPayload)
  })
})
