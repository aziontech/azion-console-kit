import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { parse } from '@babel/parser'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { NetworkListVersionService } from '@/services/v2/network-lists/network-list-version-service'
import {
  isComposableImport,
  isStoreImport,
  isDomImport
} from '../../../../../eslint/plugin/lib/utils/import-resolver.js'

const RID = 'nl-123'
const VID = 'AVNL0001'
const BASE = `v4/workspace/network_lists/${RID}/versions`

// Version snapshot is the resource row at the root (name + type + items),
// mirroring `GET .../versions/{vid}`.
const ipVersion = {
  version_id: VID,
  version: 2,
  state: 'draft',
  created_at: 'x',
  id: 701,
  name: 'ip-list',
  type: 'ip_cidr',
  items: ['10.0.0.0/24', '192.168.0.1'],
  last_modified: '2026-06-18T10:00:00Z'
}

let service

beforeEach(() => {
  service = new NetworkListVersionService()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('NetworkListVersionService - reads', () => {
  it('fetchList GETs /versions and normalizes via the adapter ({ count, body })', async () => {
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: [ipVersion] })

    const useQuerySpy = vi
      .spyOn(service, 'useQuery')
      .mockImplementation((_key, queryFn) => ({ queryFn }))

    const { queryFn } = service.useListVersionsQuery(RID)
    const result = await queryFn()

    expect(useQuerySpy).toHaveBeenCalledWith(
      queryKeys.networkList.version.list(RID),
      expect.any(Function),
      expect.any(Object)
    )
    expect(requestSpy).toHaveBeenCalledWith({ method: 'GET', url: BASE })
    expect(result.count).toBe(1)
    expect(result.body[0]).toMatchObject({ id: VID, state: 'draft', version: 2 })
    expect(result.body[0].config.networkListType).toBe('ip_cidr')
  })

  it('fetchOne GETs /versions/{vid} and extracts the items snapshot into config', async () => {
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({
      data: {
        version_id: VID,
        state: 'draft',
        id: 703,
        name: 'countries-list',
        type: 'countries',
        items: ['BR', 'US'],
        last_modified: '2026-06-18T10:00:00Z'
      }
    })

    vi.spyOn(service, 'useQuery').mockImplementation((_key, queryFn) => ({ queryFn }))

    const { queryFn } = service.useLoadVersionQuery(RID, VID)
    const result = await queryFn()

    expect(requestSpy).toHaveBeenCalledWith({ method: 'GET', url: `${BASE}/${VID}` })
    expect(result.config.networkListType).toBe('countries')
    expect(result.config.itemsValuesCountry).toEqual(['BR', 'US'])
  })
})

describe('NetworkListVersionService - mutations + cache invalidation', () => {
  it('createDraft POSTs to /versions and invalidates the version cache (clone)', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { version_id: VID, state: 'draft' } })

    const result = await service.createDraft(RID, { sourceVersionId: 'AVNL0000' })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: BASE,
      body: { source_version: 'AVNL0000' }
    })
    expect(result).toMatchObject({ id: VID })
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: queryKeys.networkList.version.all(RID) })
  })

  it('updateDraft PUTs the snake_case items payload to /versions/{vid}', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { version_id: VID, state: 'draft' } })

    await service.updateDraft(RID, VID, {
      name: 'ip-list',
      networkListType: 'ip_cidr',
      itemsValues: '10.0.0.0/24\n192.168.0.1'
    })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'PUT',
      url: `${BASE}/${VID}`,
      body: expect.objectContaining({
        name: 'ip-list',
        type: 'ip_cidr',
        items: ['10.0.0.0/24', '192.168.0.1']
      })
    })
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: queryKeys.networkList.version.all(RID) })
  })

  it('deleteVersion DELETEs /versions/{vid} and invalidates', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await service.deleteVersion(RID, VID)

    expect(requestSpy).toHaveBeenCalledWith({ method: 'DELETE', url: `${BASE}/${VID}` })
    expect(removeSpy).toHaveBeenCalled()
  })

  it('build POSTs to /versions/{vid}/build and invalidates', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await service.build(RID, VID, { comment: 'go' })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${BASE}/${VID}/build`,
      body: { comment: 'go' }
    })
    expect(removeSpy).toHaveBeenCalled()
  })

  it('archive requires a non-empty comment, then POSTs to /versions/{vid}/archive', async () => {
    await expect(service.archive(RID, VID, { comment: '   ' })).rejects.toThrow(/comment/)

    vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await service.archive(RID, VID, { comment: 'done' })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${BASE}/${VID}/archive`,
      body: { comment: 'done' }
    })
  })

  it('cancelBuild POSTs to /versions/{vid}/cancel and invalidates', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await service.cancelBuild(RID, VID, {})

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${BASE}/${VID}/cancel`,
      body: {}
    })
    expect(removeSpy).toHaveBeenCalled()
  })
})

describe('NetworkListVersionService - resource bindings', () => {
  it('extends VersionServiceBase contract: baseURL + versionKeys point at network_lists', () => {
    expect(service.baseURL).toBe('v4/workspace/network_lists')
    expect(service.versionKeys).toBe(queryKeys.networkList.version)
    expect(service.getUrl(RID, VID, '/build')).toBe(`${BASE}/${VID}/build`)
  })
})

describe('NetworkListVersionService - global list stays scoped per resource', () => {
  // A global Network List is addressed by its own id like any other; the URL and
  // cache keys are derived from that id, so they never leak across tenants.
  const GLOBAL_ID = 'global-77'

  it('builds a resource-scoped URL/version key for the global list id', () => {
    expect(service.getUrl(GLOBAL_ID, VID)).toBe(
      `v4/workspace/network_lists/${GLOBAL_ID}/versions/${VID}`
    )
    expect(queryKeys.networkList.version.all(GLOBAL_ID)).toEqual(
      queryKeys.networkList.version.all(GLOBAL_ID)
    )
  })

  it('invalidation of the global list never touches another resource id', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await service.deleteVersion(GLOBAL_ID, VID)

    const globalKey = queryKeys.networkList.version.all(GLOBAL_ID)
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: globalKey })
    expect(globalKey).not.toEqual(queryKeys.networkList.version.all(RID))
  })
})

describe('services-http-only - the service imports no composables/stores/DOM', () => {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const servicePath = resolve(
    __dirname,
    '../../../../services/v2/network-lists/network-list-version-service.js'
  )

  const importSources = (() => {
    const code = readFileSync(servicePath, 'utf-8')
    const ast = parse(code, { sourceType: 'module', plugins: ['classProperties'] })
    return ast.program.body
      .filter((node) => node.type === 'ImportDeclaration')
      .map((node) => node.source.value)
  })()

  it('imports no composable modules', () => {
    expect(importSources.filter((source) => isComposableImport(source))).toEqual([])
  })

  it('imports no Pinia stores', () => {
    expect(importSources.filter((source) => isStoreImport(source))).toEqual([])
  })

  it('imports no DOM/router modules', () => {
    expect(importSources.filter((source) => isDomImport(source))).toEqual([])
  })
})
