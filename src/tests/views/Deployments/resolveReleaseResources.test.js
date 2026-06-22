import { describe, it, expect, vi, beforeEach } from 'vitest'

// One spy per service method the registry calls; the factories below forward to
// these so every entry (application/firewall/connector/function/custom_page) can
// be driven independently.
const listEdgeApplicationsService = vi.fn()
const loadAppVersion = vi.fn()
const listEdgeFirewallService = vi.fn()
const listFirewallVersions = vi.fn()
const listEdgeConnectorsService = vi.fn()
const loadConnectorVersion = vi.fn()
const listEdgeFunctionsService = vi.fn()
const loadFunctionVersion = vi.fn()
const listCustomPagesService = vi.fn()
const loadCustomPageVersion = vi.fn()

vi.mock('@/services/v2/edge-app/edge-app-service', () => ({
  edgeAppService: { listEdgeApplicationsService: (...args) => listEdgeApplicationsService(...args) }
}))
vi.mock('@/services/v2/edge-app/edge-app-version-service', () => ({
  edgeAppVersionService: { loadVersion: (...args) => loadAppVersion(...args) }
}))
vi.mock('@/services/v2/edge-firewall/edge-firewall-service', () => ({
  edgeFirewallService: {
    listEdgeFirewallService: (...args) => listEdgeFirewallService(...args),
    listFirewallVersions: (...args) => listFirewallVersions(...args)
  }
}))
vi.mock('@/services/v2/edge-connectors/edge-connectors-service', () => ({
  edgeConnectorsService: {
    listEdgeConnectorsService: (...args) => listEdgeConnectorsService(...args)
  }
}))
vi.mock('@/services/v2/edge-connectors/edge-connector-version-service', () => ({
  edgeConnectorVersionService: { loadVersion: (...args) => loadConnectorVersion(...args) }
}))
vi.mock('@/services/v2/edge-function/edge-function-service', () => ({
  edgeFunctionService: { listEdgeFunctionsService: (...args) => listEdgeFunctionsService(...args) }
}))
vi.mock('@/services/v2/edge-function/edge-function-version-service', () => ({
  edgeFunctionVersionService: { loadVersion: (...args) => loadFunctionVersion(...args) }
}))
vi.mock('@/services/v2/custom-page/custom-page-service', () => ({
  customPageService: { listCustomPagesService: (...args) => listCustomPagesService(...args) }
}))
vi.mock('@/services/v2/custom-page/custom-page-version-service', () => ({
  customPageVersionService: { loadVersion: (...args) => loadCustomPageVersion(...args) }
}))

import { resolveReleaseResources } from '@/views/Deployments/utils/resolveReleaseResources'

describe('resolveReleaseResources — name resolution for the new resource types', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the input untouched when there is nothing to resolve', async () => {
    expect(await resolveReleaseResources([])).toEqual([])
    expect(await resolveReleaseResources(null)).toBeNull()
    // Unknown type or missing id passes through with no service call.
    const passthrough = [{ type: 'unknown', id: 'x' }, { type: 'connector' }]
    expect(await resolveReleaseResources(passthrough)).toEqual(passthrough)
    expect(listEdgeConnectorsService).not.toHaveBeenCalled()
  })

  it('resolves connector name (by id) and version name from its version service', async () => {
    listEdgeConnectorsService.mockResolvedValue({ body: [{ id: 'c1', name: 'My Connector' }] })
    loadConnectorVersion.mockResolvedValue({ comment: 'v3 draft', id: 'cv1' })

    const [resolved] = await resolveReleaseResources([
      { type: 'connector', id: 'c1', versionId: 'cv1' }
    ])

    expect(listEdgeConnectorsService).toHaveBeenCalledWith({ page: 1, pageSize: 100 })
    expect(loadConnectorVersion).toHaveBeenCalledWith('c1', 'cv1')
    expect(resolved).toMatchObject({ name: 'My Connector', versionName: 'v3 draft' })
  })

  it('resolves function name and version name from its version service', async () => {
    listEdgeFunctionsService.mockResolvedValue({ body: [{ id: 'f1', name: 'My Function' }] })
    loadFunctionVersion.mockResolvedValue({ comment: 'release-7', id: 'fv1' })

    const [resolved] = await resolveReleaseResources([
      { type: 'function', id: 'f1', versionId: 'fv1' }
    ])

    expect(listEdgeFunctionsService).toHaveBeenCalledWith({ page: 1, pageSize: 100 })
    expect(loadFunctionVersion).toHaveBeenCalledWith('f1', 'fv1')
    expect(resolved).toMatchObject({ name: 'My Function', versionName: 'release-7' })
  })

  it('resolves custom_page name (closes the previous registry gap)', async () => {
    listCustomPagesService.mockResolvedValue({ body: [{ id: 'p1', name: 'Custom 404' }] })
    loadCustomPageVersion.mockResolvedValue({ comment: 'v1', id: 'pv1' })

    const [resolved] = await resolveReleaseResources([
      { type: 'custom_page', id: 'p1', versionId: 'pv1' }
    ])

    expect(listCustomPagesService).toHaveBeenCalledWith({ page: 1, pageSize: 100 })
    expect(loadCustomPageVersion).toHaveBeenCalledWith('p1', 'pv1')
    expect(resolved).toMatchObject({ name: 'Custom 404', versionName: 'v1' })
  })

  it('resolves a mix of types loading each name list exactly once', async () => {
    listEdgeConnectorsService.mockResolvedValue({
      body: [
        { id: 'c1', name: 'Conn A' },
        { id: 'c2', name: 'Conn B' }
      ]
    })
    loadConnectorVersion.mockResolvedValue({ comment: 'cv', id: 'cv' })
    listEdgeFunctionsService.mockResolvedValue({ body: [{ id: 'f1', name: 'Fn A' }] })
    loadFunctionVersion.mockResolvedValue({ comment: 'fv', id: 'fv' })

    const resolved = await resolveReleaseResources([
      { type: 'connector', id: 'c1' },
      { type: 'connector', id: 'c2' },
      { type: 'function', id: 'f1' }
    ])

    // One list call per type, not per resource.
    expect(listEdgeConnectorsService).toHaveBeenCalledTimes(1)
    expect(listEdgeFunctionsService).toHaveBeenCalledTimes(1)
    expect(resolved.map((resource) => resource.name)).toEqual(['Conn A', 'Conn B', 'Fn A'])
  })

  it('falls back to the existing name when the id is not in the list', async () => {
    listEdgeConnectorsService.mockResolvedValue({ body: [{ id: 'other', name: 'Other' }] })
    loadConnectorVersion.mockResolvedValue({ comment: 'cv', id: 'cv' })

    const [resolved] = await resolveReleaseResources([
      { type: 'connector', id: 'c1', name: 'fallback-name', versionId: 'cv1' }
    ])

    expect(resolved.name).toBe('fallback-name')
  })

  it('keeps the raw versionId when version resolution rejects', async () => {
    listEdgeFunctionsService.mockResolvedValue({ body: [{ id: 'f1', name: 'Fn A' }] })
    loadFunctionVersion.mockRejectedValue(new Error('boom'))

    const [resolved] = await resolveReleaseResources([
      { type: 'function', id: 'f1', versionId: 'fv-raw' }
    ])

    expect(resolved.name).toBe('Fn A')
    expect(resolved.versionName).toBe('fv-raw')
  })

  it('does not throw when the name list rejects; name stays as provided', async () => {
    listEdgeConnectorsService.mockRejectedValue(new Error('list down'))
    loadConnectorVersion.mockResolvedValue({ comment: 'cv', id: 'cv' })

    const [resolved] = await resolveReleaseResources([
      { type: 'connector', id: 'c1', name: 'provided', versionId: 'cv1' }
    ])

    expect(resolved.name).toBe('provided')
    expect(resolved.versionName).toBe('cv')
  })

  it('reads list item name from { text } shape (StatusTag-style names)', async () => {
    listEdgeConnectorsService.mockResolvedValue({ body: [{ id: 'c1', name: { text: 'Wrapped' } }] })
    loadConnectorVersion.mockResolvedValue({ comment: 'cv', id: 'cv' })

    const [resolved] = await resolveReleaseResources([
      { type: 'connector', id: 'c1', versionId: 'cv1' }
    ])

    expect(resolved.name).toBe('Wrapped')
  })
})
