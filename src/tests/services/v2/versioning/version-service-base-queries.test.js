import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'
import {
  VersionServiceBase,
  buildVersionListParams,
  VERSION_LIST_DEFAULT_PAGE_SIZE,
  VERSION_LIST_MAX_PAGE_SIZE
} from '@/services/v2/versioning/version-service-base'

const RID = 'res-9'
const VID = 'AVTEST01'
const BASE = 'v4/workspace/tests'
const VERSIONS_URL = `${BASE}/${RID}/versions`
const DEFAULT_PARAMS = { page: 1, page_size: VERSION_LIST_DEFAULT_PAGE_SIZE }

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

describe('buildVersionListParams', () => {
  it('always emits page and page_size, defaulting to page 1', () => {
    expect(buildVersionListParams()).toEqual({
      page: 1,
      page_size: VERSION_LIST_DEFAULT_PAGE_SIZE
    })
  })

  it('accepts pageSize and page_size aliases and clamps to the ceiling', () => {
    expect(buildVersionListParams({ pageSize: 500 }).page_size).toBe(VERSION_LIST_MAX_PAGE_SIZE)
    expect(buildVersionListParams({ page_size: 50 }).page_size).toBe(50)
  })

  it('falls back to page 1 and the default size for non-positive input', () => {
    expect(buildVersionListParams({ page: 0, pageSize: -5 })).toEqual({
      page: 1,
      page_size: VERSION_LIST_DEFAULT_PAGE_SIZE
    })
  })

  it('drops client-side cache directives', () => {
    expect(buildVersionListParams({ skipCache: true, hasFilter: true })).toEqual({
      page: 1,
      page_size: VERSION_LIST_DEFAULT_PAGE_SIZE
    })
  })

  it('passes unknown params through untouched', () => {
    expect(buildVersionListParams({ fields: 'version_id' }).fields).toBe('version_id')
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

describe('VersionServiceBase.listVersionsPage', () => {
  it('returns both the adapted body and the server count', async () => {
    stubEnsure()
    vi.spyOn(httpService, 'request').mockResolvedValueOnce({
      data: { count: 42, body: [{ id: VID, state: 'ready' }] }
    })

    const result = await service.listVersionsPage(RID)

    expect(result).toEqual({ count: 42, body: [{ id: VID, state: 'ready' }] })
  })

  it('sends an explicit page and page_size when called with no params', async () => {
    stubEnsure()
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { count: 0, body: [] } })

    await service.listVersionsPage(RID)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: VERSIONS_URL,
      params: DEFAULT_PARAMS
    })
  })

  it('clamps the requested page size to the ceiling', async () => {
    stubEnsure()
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { count: 0, body: [] } })

    await service.listVersionsPage(RID, { page: 3, pageSize: 500 })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: VERSIONS_URL,
      params: { page: 3, page_size: VERSION_LIST_MAX_PAGE_SIZE }
    })
  })

  it('falls back to an empty body and a zero count when the result is empty', async () => {
    stubEnsure()
    vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    expect(await service.listVersionsPage(RID)).toEqual({ body: [], count: 0 })
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

    expect(queryKey).toEqual(versionKeys.list(RID, DEFAULT_PARAMS))
    expect(options).toMatchObject({ persist: false, skipCache: true })
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: VERSIONS_URL,
      params: DEFAULT_PARAMS
    })
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

    const expectedParams = {
      page: 2,
      ordering: 'name',
      page_size: VERSION_LIST_DEFAULT_PAGE_SIZE
    }
    expect(queryKey).toEqual(versionKeys.list(RID, expectedParams))
    expect(options).toMatchObject({ persist: true })
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: VERSIONS_URL,
      params: expectedParams
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

    const expectedParams = { page: 3, page_size: VERSION_LIST_DEFAULT_PAGE_SIZE }
    expect(queryKey).toEqual(versionKeys.list(RID, expectedParams))
    expect(options).toMatchObject({ persist: false, skipCache: true })
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: VERSIONS_URL,
      params: expectedParams
    })
  })

  it('always carries a normalized params segment in the queryKey', () => {
    spyUseQuery()

    const withoutParams = service.useListVersionsQuery(RID).queryKey
    const withParams = service.useListVersionsQuery(RID, { page: 2 }).queryKey

    expect(withoutParams).toEqual(versionKeys.list(RID, DEFAULT_PARAMS))
    expect(withParams).toEqual(
      versionKeys.list(RID, { page: 2, page_size: VERSION_LIST_DEFAULT_PAGE_SIZE })
    )
    expect(withParams.length).toBe(withoutParams.length)
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
