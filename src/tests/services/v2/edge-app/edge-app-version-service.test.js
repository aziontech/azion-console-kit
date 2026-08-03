/**
 * Coverage-matrix claims (spec versioning-test-coverage / TEST-ARCHITECTURE §3.4).
 * The matrix (tests/coverage-matrix.json) is DERIVED from these markers —
 * run `node scripts/check-coverage-matrix.mjs --write` after changing them.
 * @covers application:J1 component partial
 * @covers application:J2 component
 * @covers application:J3 component partial
 * @covers application:J4 component
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { EdgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'

const RID = 'app-42'
const VID = 'AVAPP0001'
const BASE = `v4/workspace/applications/${RID}/versions`

let service

beforeEach(() => {
  service = new EdgeAppVersionService()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('EdgeAppVersionService - resource bindings', () => {
  it('binds the applications baseURL and the application.version key group', () => {
    expect(service.baseURL).toBe('v4/workspace/applications')
    expect(service.versionKeys).toBe(queryKeys.application.version)
    expect(service.getUrl(RID, VID, '/build')).toBe(`${BASE}/${VID}/build`)
  })
})

describe('EdgeAppVersionService - mutations invalidate the version cache', () => {
  it('createDraft POSTs /versions with the mapped payload and removes the version cache', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { version_id: VID, state: 'draft' } })

    const result = await service.createDraft(RID, {
      sourceVersionId: 'AVAPP0000',
      comment: 'clone'
    })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: BASE,
      body: { source_version: 'AVAPP0000', comment: 'clone' }
    })
    expect(result).toMatchObject({ id: VID })
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: queryKeys.application.version.all(RID) })
  })

  it('updateDraft PATCHes /versions/{vid} with the root modules payload and invalidates', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { version_id: VID, state: 'draft' } })

    await service.updateDraft(RID, VID, { name: 'app', isActive: true, edgeCacheEnabled: true })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'PATCH',
      url: `${BASE}/${VID}`,
      body: expect.objectContaining({
        name: 'app',
        active: true,
        modules: expect.objectContaining({ cache: { enabled: true } })
      })
    })
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: queryKeys.application.version.all(RID) })
  })

  it('build POSTs /versions/{vid}/build and invalidates', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await service.build(RID, VID, { comment: 'ship' })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${BASE}/${VID}/build`,
      body: { comment: 'ship' }
    })
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: queryKeys.application.version.all(RID) })
  })

  it('cancelBuild POSTs /versions/{vid}/cancel and invalidates', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await service.cancelBuild(RID, VID, {})

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${BASE}/${VID}/cancel`,
      body: {}
    })
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: queryKeys.application.version.all(RID) })
  })

  it('deleteVersion DELETEs /versions/{vid} and invalidates', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await service.deleteVersion(RID, VID)

    expect(requestSpy).toHaveBeenCalledWith({ method: 'DELETE', url: `${BASE}/${VID}` })
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: queryKeys.application.version.all(RID) })
  })

  it('archive rejects an empty comment before touching the network', async () => {
    const requestSpy = vi.spyOn(httpService, 'request')
    await expect(service.archive(RID, VID, { comment: '  ' })).rejects.toThrow(/comment/)
    expect(requestSpy).not.toHaveBeenCalled()
  })
})
