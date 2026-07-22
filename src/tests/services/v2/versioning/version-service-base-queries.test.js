import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { VersionServiceBase } from '@/services/v2/versioning/version-service-base'

const RID = 'res-9'
const VID = 'AVTEST01'
const BASE = 'v4/workspace/tests'
const VERSIONS_URL = `${BASE}/${RID}/versions`

const versionKeys = {
  all: (rid) => ['test-version', rid, 'versions'],
  list: (rid, params) =>
    params === undefined
      ? ['test-version', rid, 'versions', 'list']
      : ['test-version', rid, 'versions', 'list', params],
  detail: (rid, vid) => ['test-version', rid, 'versions', 'detail', vid]
}

class TestVersionService extends VersionServiceBase {
  baseURL = BASE
  versionKeys = versionKeys
  adapter = {
    transformLoadVersion: vi.fn((data) => ({ loaded: true, raw: data })),
    transformListVersions: vi.fn((data) => data)
  }
}

let service

const stubEnsure = () =>
  vi.spyOn(queryClient, 'ensureQueryData').mockImplementation(({ queryFn }) => queryFn())

beforeEach(() => {
  service = new TestVersionService()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('VersionServiceBase.getUrl', () => {
  it('builds the collection URL when no versionId is given', () => {
    expect(service.getUrl(RID)).toBe(VERSIONS_URL)
  })

  it('appends the versionId for a single-version URL', () => {
    expect(service.getUrl(RID, VID)).toBe(`${VERSIONS_URL}/${VID}`)
  })

  it('appends a suffix after the versionId (action endpoints)', () => {
    expect(service.getUrl(RID, VID, '/build')).toBe(`${VERSIONS_URL}/${VID}/build`)
  })

  it('appends a suffix onto the collection URL when versionId is absent', () => {
    expect(service.getUrl(RID, null, '/import')).toBe(`${VERSIONS_URL}/import`)
  })
})

describe('VersionServiceBase.loadVersion', () => {
  it('GETs the version detail URL and returns the adapter transform of the payload', async () => {
    stubEnsure()
    const raw = { version_id: VID, state: 'ready', name: 'wl' }
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: raw })

    const result = await service.loadVersion(RID, VID)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: `${VERSIONS_URL}/${VID}`
    })
    expect(service.adapter.transformLoadVersion).toHaveBeenCalledWith(raw)
    expect(result).toEqual({ loaded: true, raw })
  })
})

describe('VersionServiceBase.listVersions', () => {
  it('returns the adapted list body when the result carries one', async () => {
    stubEnsure()
    vi.spyOn(httpService, 'request').mockResolvedValueOnce({
      data: { count: 1, body: [{ id: VID, state: 'ready' }] }
    })

    const result = await service.listVersions(RID)

    expect(result).toEqual([{ id: VID, state: 'ready' }])
  })

  it('falls back to an empty array when the result has no body', async () => {
    stubEnsure()
    vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    const result = await service.listVersions(RID)

    expect(result).toEqual([])
  })
})

describe('VersionServiceBase.useListVersionsQuery — skipCache / params split', () => {
  const spyUseQuery = () =>
    vi
      .spyOn(service, 'useQuery')
      .mockImplementation((queryKey, queryFn, options) => ({ queryKey, queryFn, options }))

  it('strips skipCache from BOTH the queryKey and the HTTP params, and disables persist', async () => {
    const useQuerySpy = spyUseQuery()
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { count: 0, results: [] } })

    const { queryKey, queryFn, options } = service.useListVersionsQuery(RID, { skipCache: true })
    await queryFn()

    expect(queryKey).toEqual(versionKeys.list(RID))
    expect(options).toMatchObject({ persist: false, skipCache: true })
    expect(requestSpy).toHaveBeenCalledWith({ method: 'GET', url: VERSIONS_URL })
    expect(useQuerySpy).toHaveBeenCalledTimes(1)
  })

  it('forwards real params into BOTH the queryKey and the HTTP request, and keeps persist on', async () => {
    spyUseQuery()
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { count: 0, results: [] } })

    const { queryKey, queryFn, options } = service.useListVersionsQuery(RID, {
      page: 2,
      ordering: 'name'
    })
    await queryFn()

    expect(queryKey).toEqual(versionKeys.list(RID, { page: 2, ordering: 'name' }))
    expect(options).toMatchObject({ persist: true })
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: VERSIONS_URL,
      params: { page: 2, ordering: 'name' }
    })
  })

  it('splits skipCache away while keeping the co-located real params on both sides', async () => {
    spyUseQuery()
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { count: 0, results: [] } })

    const { queryKey, queryFn, options } = service.useListVersionsQuery(RID, {
      skipCache: true,
      page: 3
    })
    await queryFn()

    expect(queryKey).toEqual(versionKeys.list(RID, { page: 3 }))
    expect(options).toMatchObject({ persist: false, skipCache: true })
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: VERSIONS_URL,
      params: { page: 3 }
    })
  })

  it('omits the params segment from the queryKey entirely when no params are passed', () => {
    spyUseQuery()

    const withoutParams = service.useListVersionsQuery(RID).queryKey
    const withParams = service.useListVersionsQuery(RID, { page: 2 }).queryKey

    expect(withoutParams).toEqual(versionKeys.list(RID))
    expect(withParams).toEqual(versionKeys.list(RID, { page: 2 }))
    expect(withParams.length).toBe(withoutParams.length + 1)
    expect(withoutParams).not.toEqual(withParams)
  })

  it('persist reflects !skipCache across both branches', () => {
    spyUseQuery()

    const cached = service.useListVersionsQuery(RID, { page: 1 }).options
    const uncached = service.useListVersionsQuery(RID, { page: 1, skipCache: true }).options

    expect(cached.persist).toBe(true)
    expect(cached.skipCache).toBe(false)
    expect(uncached.persist).toBe(false)
    expect(uncached.skipCache).toBe(true)
  })
})
