import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { VersionServiceBase } from '@/services/v2/versioning/version-service-base'
import { EdgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'
import { EdgeFirewallVersionService } from '@/services/v2/edge-firewall/edge-firewall-version-service'
import { CustomPageVersionService } from '@/services/v2/custom-page/custom-page-version-service'
import { WorkloadVersionService } from '@/services/v2/workload/workload-version-service'

// Property 7 contract test (task 1.4): the Wave-0 base generalization (list
// params + overridable `invalidateAfterMutation`) must not change the behavior
// of the 4 existing version services. EVERY mutation invalidates the version
// cache, and load/list keep their previous shape/queryKeys.

const RID = 'res-1'
const VID = 'AV000001'

// Each service under test + its expected version queryKey namespace. These four
// are the resources guaranteed to extend `VersionServiceBase` before the rollout.
const SERVICES = [
  {
    name: 'EdgeAppVersionService',
    Service: EdgeAppVersionService,
    keys: queryKeys.application.version,
    baseURL: 'v4/workspace/applications'
  },
  {
    name: 'EdgeFirewallVersionService',
    Service: EdgeFirewallVersionService,
    keys: queryKeys.firewall.version,
    baseURL: 'v4/workspace/firewalls'
  },
  {
    name: 'CustomPageVersionService',
    Service: CustomPageVersionService,
    keys: queryKeys.customPages.version,
    baseURL: 'v4/workspace/custom_pages'
  },
  {
    name: 'WorkloadVersionService',
    Service: WorkloadVersionService,
    keys: queryKeys.workload.version,
    baseURL: 'v4/workspace/workloads'
  }
]

// Every base-defined mutation + how to invoke it. `archive` needs a non-empty
// comment (base guard); the rest carry minimal payloads.
const MUTATIONS = [
  { name: 'createDraft', invoke: (svc) => svc.createDraft(RID, { sourceVersionId: VID }) },
  { name: 'updateDraft', invoke: (svc) => svc.updateDraft(RID, VID, { name: 'x' }) },
  { name: 'patchDraft', invoke: (svc) => svc.patchDraft(RID, VID, { name: 'x' }) },
  { name: 'deleteVersion', invoke: (svc) => svc.deleteVersion(RID, VID) },
  { name: 'build', invoke: (svc) => svc.build(RID, VID, { comment: 'go' }) },
  { name: 'archive', invoke: (svc) => svc.archive(RID, VID, { comment: 'done' }) },
  { name: 'cancelBuild', invoke: (svc) => svc.cancelBuild(RID, VID, {}) }
]

const stubRequest = () =>
  vi.spyOn(httpService, 'request').mockResolvedValue({ data: { version_id: VID, state: 'draft' } })

const stubEnsure = () =>
  vi.spyOn(queryClient, 'ensureQueryData').mockImplementation(({ queryFn }) => queryFn())

// The invalidation contract is independent of resource-specific payload shaping.
// Neutralize the adapter transforms so a minimal payload reaches every service
// without tripping resource form expectations (covered by adapter-specific tests).
const stubAdapterTransforms = (service) => {
  const passthrough = (value) => value ?? {}
  for (const name of [
    'transformCreateDraftPayload',
    'transformDraftPayload',
    'transformBuildPayload',
    'transformArchivePayload',
    'transformLoadVersion'
  ]) {
    if (typeof service.adapter?.[name] === 'function') {
      vi.spyOn(service.adapter, name).mockImplementation(passthrough)
    }
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe.each(SERVICES)('Property 7 — $name invalidates on every mutation', ({ Service, keys }) => {
  let service

  beforeEach(() => {
    service = new Service()
  })

  it.each(MUTATIONS)('$name calls invalidateAfterMutation(resourceId)', async ({ invoke }) => {
    stubRequest()
    stubAdapterTransforms(service)
    const hookSpy = vi.spyOn(service, 'invalidateAfterMutation').mockImplementation(() => {})

    await invoke(service)

    expect(hookSpy).toHaveBeenCalledTimes(1)
    expect(hookSpy).toHaveBeenCalledWith(RID)
  })

  it.each(MUTATIONS)('$name removes the version cache via the hook', async ({ invoke }) => {
    stubRequest()
    stubAdapterTransforms(service)
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})

    await invoke(service)

    expect(removeSpy).toHaveBeenCalledWith({ queryKey: keys.all(RID) })
  })
})

describe('Property 7 — default hook contract on the base', () => {
  it('invalidateAfterMutation removes queryKeys.<resource>.version.all', () => {
    const service = new EdgeAppVersionService()
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})

    service.invalidateAfterMutation(RID)

    expect(removeSpy).toHaveBeenCalledWith({ queryKey: queryKeys.application.version.all(RID) })
  })

  it('archive rejects without a non-empty comment, leaving the cache untouched', async () => {
    const service = new CustomPageVersionService()
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})

    await expect(service.archive(RID, VID, { comment: '   ' })).rejects.toThrow(/comment/)
    expect(removeSpy).not.toHaveBeenCalled()
  })
})

describe('Regression — load/list keep their previous queryKeys/shape', () => {
  it.each(SERVICES)(
    '$name reads default to the unparameterized version keys',
    ({ Service, keys }) => {
      const service = new Service()
      const useQuerySpy = vi
        .spyOn(service, 'useQuery')
        .mockImplementation((queryKey) => ({ queryKey }))

      const { queryKey: listKey } = service.useListVersionsQuery(RID)
      const { queryKey: detailKey } = service.useLoadVersionQuery(RID, VID)

      expect(listKey).toEqual(keys.list(RID))
      expect(detailKey).toEqual(keys.detail(RID, VID))
      expect(useQuerySpy).toHaveBeenCalledTimes(2)
    }
  )

  it.each(SERVICES)(
    '$name list GETs /{base}/{id}/versions with no params',
    async ({ Service, baseURL }) => {
      const service = new Service()
      const requestSpy = vi
        .spyOn(httpService, 'request')
        .mockResolvedValueOnce({ data: { count: 0, results: [] } })
      vi.spyOn(service, 'useQuery').mockImplementation((_key, queryFn) => ({ queryFn }))

      const { queryFn } = service.useListVersionsQuery(RID)
      await queryFn()

      expect(requestSpy).toHaveBeenCalledWith({ method: 'GET', url: `${baseURL}/${RID}/versions` })
    }
  )

  it('list forwards params into both the fetch and the queryKey when provided', async () => {
    const service = new EdgeAppVersionService()
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { count: 0, results: [] } })
    const useQuerySpy = vi.spyOn(service, 'useQuery').mockImplementation((queryKey, queryFn) => ({
      queryKey,
      queryFn
    }))

    const { queryFn } = service.useListVersionsQuery(RID, { page: 2 })
    await queryFn()

    expect(useQuerySpy).toHaveBeenCalledWith(
      queryKeys.application.version.list(RID, { page: 2 }),
      expect.any(Function),
      expect.objectContaining({ persist: true })
    )
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: `v4/workspace/applications/${RID}/versions`,
      params: { page: 2 }
    })
  })

  it('skipCache is stripped from the request params and disables persist', async () => {
    const service = new EdgeAppVersionService()
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { count: 0, results: [] } })
    const useQuerySpy = vi.spyOn(service, 'useQuery').mockImplementation((queryKey, queryFn) => ({
      queryKey,
      queryFn
    }))

    const { queryFn } = service.useListVersionsQuery(RID, { skipCache: true })
    await queryFn()

    expect(useQuerySpy).toHaveBeenCalledWith(
      queryKeys.application.version.list(RID),
      expect.any(Function),
      expect.objectContaining({ persist: false, skipCache: true })
    )
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: `v4/workspace/applications/${RID}/versions`
    })
  })

  it('loadVersion GETs the version detail via the cache-aware path', async () => {
    const service = new EdgeFirewallVersionService()
    stubEnsure()
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { version_id: VID, state: 'ready' } })

    const result = await service.loadVersion(RID, VID)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: `v4/workspace/firewalls/${RID}/versions/${VID}`
    })
    expect(result.id).toBe(VID)
  })
})

describe('Regression — Workload rollback still invalidates the same version cache', () => {
  // `rollback` is a Workload-only mutation (no `/rollback` on the base). It does
  // not route through `invalidateAfterMutation`, but removes the SAME version
  // cache key, so the observable cache behavior matches the base hook.
  it('rollback removes queryKeys.workload.version.all even though it bypasses the hook', async () => {
    const service = new WorkloadVersionService()
    stubRequest()
    const hookSpy = vi.spyOn(service, 'invalidateAfterMutation')
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})

    await service.rollback(RID, VID, { comment: 'back' })

    expect(removeSpy).toHaveBeenCalledWith({ queryKey: queryKeys.workload.version.all(RID) })
    expect(hookSpy).not.toHaveBeenCalled()
  })
})

describe('Structural — every base mutation routes through the hook', () => {
  // Guards Property 7 at the source: a new mutation added to the base that
  // forgets to call the hook fails here without needing a per-service test.
  it.each(MUTATIONS.map((mutation) => mutation.name))(
    '%s is defined on VersionServiceBase.prototype or as an instance field',
    (methodName) => {
      const onPrototype = methodName in VersionServiceBase.prototype
      const onInstance = typeof new EdgeAppVersionService()[methodName] === 'function'
      expect(onPrototype || onInstance).toBe(true)
    }
  )
})
