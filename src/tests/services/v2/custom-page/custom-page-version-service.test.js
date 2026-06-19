import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { parse } from '@babel/parser'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { CustomPageVersionService } from '@/services/v2/custom-page/custom-page-version-service'
import {
  isComposableImport,
  isStoreImport,
  isDomImport
} from '../../../../../eslint/plugin/lib/utils/import-resolver.js'

const RID = 'cp-123'
const VID = 'AVCPG002'
const BASE = `v4/workspace/custom_pages/${RID}/versions`

let service

beforeEach(() => {
  service = new CustomPageVersionService()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CustomPageVersionService - reads', () => {
  it('fetchList GETs /versions and normalizes via the adapter ({ count, body })', async () => {
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({
      data: [{ version_id: VID, version: 2, state: 'draft', created_at: 'x' }]
    })

    const useQuerySpy = vi
      .spyOn(service, 'useQuery')
      .mockImplementation((_key, queryFn) => ({ queryFn }))

    const { queryFn } = service.useListVersionsQuery(RID)
    const result = await queryFn()

    expect(useQuerySpy).toHaveBeenCalledWith(
      queryKeys.customPages.version.list(RID),
      expect.any(Function),
      expect.any(Object)
    )
    expect(requestSpy).toHaveBeenCalledWith({ method: 'GET', url: BASE })
    expect(result.count).toBe(1)
    expect(result.body[0]).toMatchObject({ id: VID, state: 'draft', version: 2 })
  })

  it('fetchOne GETs /versions/{vid} and preserves pages[] in config', async () => {
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({
      data: {
        version_id: VID,
        state: 'draft',
        name: 'pages',
        active: true,
        pages: [{ code: '404', page: { type: 'page_default', attributes: {} } }]
      }
    })

    vi.spyOn(service, 'useQuery').mockImplementation((_key, queryFn) => ({ queryFn }))

    const { queryFn } = service.useLoadVersionQuery(RID, VID)
    const result = await queryFn()

    expect(requestSpy).toHaveBeenCalledWith({ method: 'GET', url: `${BASE}/${VID}` })
    expect(result.config.name).toBe('pages')
    expect(Array.isArray(result.config.pages)).toBe(true)
    expect(result.config.pages).toHaveLength(1)
  })
})

describe('CustomPageVersionService - mutations + cache invalidation', () => {
  it('createDraft POSTs to /versions and invalidates the version cache', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { version_id: VID, state: 'draft' } })

    const result = await service.createDraft(RID, { sourceVersionId: 'AVCPG001' })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: BASE,
      body: { source_version: 'AVCPG001' }
    })
    expect(result).toMatchObject({ id: VID })
    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.customPages.version.all(RID)
    })
  })

  it('updateDraft PUTs the snake_case payload to /versions/{vid}', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { version_id: VID, state: 'draft' } })

    await service.updateDraft(RID, VID, { name: 'updated', active: false, pages: [] })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'PUT',
      url: `${BASE}/${VID}`,
      body: expect.objectContaining({ name: 'updated', active: false })
    })
    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.customPages.version.all(RID)
    })
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

  it('archive requires a non-empty comment', async () => {
    await expect(service.archive(RID, VID, { comment: '   ' })).rejects.toThrow(/comment/)
  })

  it('archive POSTs to /versions/{vid}/archive with the comment', async () => {
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

describe('services-http-only - the service imports no composables/stores/DOM', () => {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const servicePath = resolve(
    __dirname,
    '../../../../services/v2/custom-page/custom-page-version-service.js'
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
