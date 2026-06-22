import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { parse } from '@babel/parser'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { EdgeConnectorVersionService } from '@/services/v2/edge-connectors/edge-connector-version-service'
import {
  isComposableImport,
  isStoreImport,
  isDomImport
} from '../../../../../eslint/plugin/lib/utils/import-resolver.js'

const RID = 'conn-123'
const VID = 'AVCONN001'
const BASE = `v4/workspace/connectors/${RID}/versions`

const storageVersion = {
  version_id: VID,
  version: 2,
  state: 'draft',
  created_at: 'x',
  id: 902,
  name: 'storage-connector',
  type: 'storage',
  active: true,
  attributes: { bucket: 'my-bucket', prefix: '/assets' }
}

let service

beforeEach(() => {
  service = new EdgeConnectorVersionService()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('EdgeConnectorVersionService - reads', () => {
  it('fetchList GETs /versions and normalizes via the adapter ({ count, body })', async () => {
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: [storageVersion] })

    const useQuerySpy = vi
      .spyOn(service, 'useQuery')
      .mockImplementation((_key, queryFn) => ({ queryFn }))

    const { queryFn } = service.useListVersionsQuery(RID)
    const result = await queryFn()

    expect(useQuerySpy).toHaveBeenCalledWith(
      queryKeys.connector.version.list(RID),
      expect.any(Function),
      expect.any(Object)
    )
    expect(requestSpy).toHaveBeenCalledWith({ method: 'GET', url: BASE })
    expect(result.count).toBe(1)
    expect(result.body[0]).toMatchObject({ id: VID, state: 'draft', version: 2 })
    expect(result.body[0].config.type).toBe('storage')
  })

  it('fetchOne GETs /versions/{vid} and extracts the HTTP snapshot into config', async () => {
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({
      data: {
        version_id: VID,
        state: 'draft',
        id: 901,
        name: 'http-connector',
        type: 'http',
        active: true,
        attributes: {
          addresses: [
            {
              active: true,
              address: 'origin-a.example.com',
              http_port: 80,
              https_port: 443,
              modules: { load_balancer: { server_role: 'primary', weight: 1 } }
            }
          ],
          connection_options: { host: 'app.example.com', path_prefix: '/api' },
          modules: {
            load_balancer: { enabled: false, config: {} },
            origin_shield: { enabled: false, config: {} }
          }
        }
      }
    })

    vi.spyOn(service, 'useQuery').mockImplementation((_key, queryFn) => ({ queryFn }))

    const { queryFn } = service.useLoadVersionQuery(RID, VID)
    const result = await queryFn()

    expect(requestSpy).toHaveBeenCalledWith({ method: 'GET', url: `${BASE}/${VID}` })
    expect(result.config.type).toBe('http')
    expect(result.config.connectionOptions.host).toBe('app.example.com')
    expect(result.config.addresses).toHaveLength(1)
  })
})

describe('EdgeConnectorVersionService - mutations + cache invalidation', () => {
  it('createDraft POSTs to /versions and invalidates the version cache', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { version_id: VID, state: 'draft' } })

    const result = await service.createDraft(RID, { sourceVersionId: 'AVCONN000' })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: BASE,
      body: { source_version: 'AVCONN000' }
    })
    expect(result).toMatchObject({ id: VID })
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: queryKeys.connector.version.all(RID) })
  })

  it('updateDraft PUTs the snake_case Storage payload to /versions/{vid}', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { version_id: VID, state: 'draft' } })

    await service.updateDraft(RID, VID, {
      name: 'storage-connector',
      type: 'storage',
      active: true,
      connectionOptions: { bucket: 'b', prefix: '/p' }
    })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'PUT',
      url: `${BASE}/${VID}`,
      body: expect.objectContaining({
        name: 'storage-connector',
        type: 'storage',
        attributes: { bucket: 'b', prefix: '/p' }
      })
    })
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: queryKeys.connector.version.all(RID) })
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

describe('EdgeConnectorVersionService - resource bindings', () => {
  it('extends VersionServiceBase contract: baseURL + versionKeys point at connectors', () => {
    expect(service.baseURL).toBe('v4/workspace/connectors')
    expect(service.versionKeys).toBe(queryKeys.connector.version)
    expect(service.getUrl(RID, VID, '/build')).toBe(`${BASE}/${VID}/build`)
  })
})

describe('services-http-only - the service imports no composables/stores/DOM', () => {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const servicePath = resolve(
    __dirname,
    '../../../../services/v2/edge-connectors/edge-connector-version-service.js'
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
