import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { parse } from '@babel/parser'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { WafVersionService } from '@/services/v2/waf/waf-version-service'
import {
  isComposableImport,
  isStoreImport,
  isDomImport
} from '../../../../../eslint/plugin/lib/utils/import-resolver.js'

const RID = 'waf-1'
const VID = 'AVWAF0001'
const BASE = `v4/workspace/wafs/${RID}/versions`

// Version snapshot mirroring `GET .../versions/{vid}`: WAF Main Settings clone
// (name/active + engine_settings thresholds per threat).
const wafSnapshot = (overrides = {}) => ({
  version_id: VID,
  version: 2,
  state: 'draft',
  created_at: '2026-06-18T10:00:00Z',
  id: 902,
  name: 'waf-main',
  active: true,
  engine_settings: {
    attributes: {
      thresholds: [
        { threat: 'sql_injection', sensitivity: 'high' },
        { threat: 'cross_site_scripting', sensitivity: 'low' }
      ]
    }
  },
  ...overrides
})

let service

beforeEach(() => {
  service = new WafVersionService()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('WafVersionService - reads', () => {
  it('fetchList GETs /versions and normalizes via the adapter ({ count, body })', async () => {
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: [wafSnapshot()] })

    const useQuerySpy = vi
      .spyOn(service, 'useQuery')
      .mockImplementation((_key, queryFn) => ({ queryFn }))

    const { queryFn } = service.useListVersionsQuery(RID)
    const result = await queryFn()

    expect(useQuerySpy).toHaveBeenCalledWith(
      queryKeys.waf.version.list(RID),
      expect.any(Function),
      expect.any(Object)
    )
    expect(requestSpy).toHaveBeenCalledWith({ method: 'GET', url: BASE })
    expect(result.count).toBe(1)
    expect(result.body[0]).toMatchObject({ id: VID, state: 'draft', version: 2 })
    expect(result.body[0].config).toMatchObject({ id: 902, name: 'waf-main', active: true })
  })

  it('fetchOne GETs /versions/{vid} and extracts the Main Settings snapshot into config', async () => {
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: wafSnapshot() })

    vi.spyOn(service, 'useQuery').mockImplementation((_key, queryFn) => ({ queryFn }))

    const { queryFn } = service.useLoadVersionQuery(RID, VID)
    const result = await queryFn()

    expect(requestSpy).toHaveBeenCalledWith({ method: 'GET', url: `${BASE}/${VID}` })
    expect(result.config.name).toBe('waf-main')
    expect(result.config.sqlInjection).toBe(true)
    expect(result.config.sqlInjectionSensitivity).toBe('high')
    expect(result.config.crossSiteScripting).toBe(true)
    expect(result.config.crossSiteScriptingSensitivity).toBe('low')
    expect(result.config.fileUpload).toBe(false)
  })
})

describe('WafVersionService - mutations + cache invalidation', () => {
  it('createDraft POSTs to /versions and invalidates the version cache', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { version_id: VID, state: 'draft' } })

    const result = await service.createDraft(RID, { sourceVersionId: 'AVWAF0000' })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: BASE,
      body: expect.objectContaining({ source_version: 'AVWAF0000' })
    })
    expect(result).toMatchObject({ id: VID })
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: queryKeys.waf.version.all(RID) })
  })

  it('updateDraft PUTs the WAF Main Settings payload to /versions/{vid} and invalidates', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { version_id: VID, state: 'draft' } })

    await service.updateDraft(RID, VID, {
      name: 'waf-main',
      active: true,
      sqlInjection: true,
      sqlInjectionSensitivity: 'high'
    })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'PUT',
      url: `${BASE}/${VID}`,
      body: expect.objectContaining({
        name: 'waf-main',
        active: true,
        engine_settings: {
          attributes: { thresholds: [{ threat: 'sql_injection', sensitivity: 'high' }] }
        }
      })
    })
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: queryKeys.waf.version.all(RID) })
  })

  it('deleteVersion DELETEs /versions/{vid} and invalidates', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await service.deleteVersion(RID, VID)

    expect(requestSpy).toHaveBeenCalledWith({ method: 'DELETE', url: `${BASE}/${VID}` })
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: queryKeys.waf.version.all(RID) })
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

describe('WafVersionService - resource bindings', () => {
  it('extends VersionServiceBase contract: baseURL + versionKeys point at wafs', () => {
    expect(service.baseURL).toBe('v4/workspace/wafs')
    expect(service.versionKeys).toBe(queryKeys.waf.version)
    expect(service.getUrl(RID, VID, '/build')).toBe(`${BASE}/${VID}/build`)
  })
})

describe('services-http-only - the service imports no composables/stores/DOM', () => {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const servicePath = resolve(__dirname, '../../../../services/v2/waf/waf-version-service.js')

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
