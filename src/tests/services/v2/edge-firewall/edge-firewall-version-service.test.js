import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { parse } from '@babel/parser'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { EdgeFirewallVersionService } from '@/services/v2/edge-firewall/edge-firewall-version-service'
import {
  isComposableImport,
  isStoreImport,
  isDomImport
} from '../../../../../eslint/plugin/lib/utils/import-resolver.js'

const RID = 'fw-1'
const VID = 'AVFW0001'

let service

const stubEnsure = () =>
  vi.spyOn(queryClient, 'ensureQueryData').mockImplementation(({ queryFn }) => queryFn())

beforeEach(() => {
  service = new EdgeFirewallVersionService()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('EdgeFirewallVersionService - reads', () => {
  it('loadVersion GETs the version detail under the firewall base URL', async () => {
    stubEnsure()
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { version_id: VID, state: 'ready', name: 'fw' } })

    const result = await service.loadVersion(RID, VID)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: `v4/workspace/firewalls/${RID}/versions/${VID}`
    })
    expect(result.id).toBe(VID)
  })
})

describe('EdgeFirewallVersionService - mutations', () => {
  it('createDraft POSTs the mapped payload and invalidates the version cache', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { version_id: 'NEW', state: 'draft' } })

    const result = await service.createDraft(RID, { sourceVersionId: VID, name: 'fw' })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `v4/workspace/firewalls/${RID}/versions`,
      body: { source_version: VID, name: 'fw' }
    })
    expect(result.id).toBe('NEW')
    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.firewall.version.all(RID)
    })
  })

  it('updateDraft PUTs to the version URL and invalidates', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { version_id: VID, state: 'draft' } })

    await service.updateDraft(RID, VID, { name: 'fw', wafEnabled: true })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'PUT',
      url: `v4/workspace/firewalls/${RID}/versions/${VID}`,
      body: { name: 'fw', waf_enabled: true }
    })
    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.firewall.version.all(RID)
    })
  })

  it('build POSTs to /build and invalidates', async () => {
    vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await service.build(RID, VID, { comment: 'go' })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `v4/workspace/firewalls/${RID}/versions/${VID}/build`,
      body: { comment: 'go' }
    })
  })

  it('cancelBuild POSTs to /cancel', async () => {
    vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await service.cancelBuild(RID, VID, {})

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `v4/workspace/firewalls/${RID}/versions/${VID}/cancel`,
      body: {}
    })
  })

  it('archive requires a non-empty comment', async () => {
    await expect(service.archive(RID, VID, { comment: '   ' })).rejects.toThrow(/comment/)
  })

  it('archive POSTs to /archive when a comment is present', async () => {
    vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await service.archive(RID, VID, { comment: 'bye' })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `v4/workspace/firewalls/${RID}/versions/${VID}/archive`,
      body: { comment: 'bye' }
    })
  })

  it('deleteVersion DELETEs the version URL and invalidates', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await service.deleteVersion(RID, VID)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'DELETE',
      url: `v4/workspace/firewalls/${RID}/versions/${VID}`
    })
    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.firewall.version.all(RID)
    })
  })
})

describe('P5: services-http-only - the service imports no composables/stores/DOM', () => {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const servicePath = resolve(
    __dirname,
    '../../../../services/v2/edge-firewall/edge-firewall-version-service.js'
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
