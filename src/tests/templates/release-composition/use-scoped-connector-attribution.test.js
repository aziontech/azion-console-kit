import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'

vi.mock('@/services/v2/edge-app/edge-app-rules-engine-service', () => ({
  rulesEngineService: {
    listConnectorDependenciesByVersion: vi.fn()
  }
}))

vi.mock('@/services/v2/custom-page/custom-page-version-service', () => ({
  customPageVersionService: {
    listConnectorDependenciesByVersion: vi.fn()
  }
}))

import { rulesEngineService } from '@/services/v2/edge-app/edge-app-rules-engine-service'
import { customPageVersionService } from '@/services/v2/custom-page/custom-page-version-service'
import { useScopedConnectorAttribution } from '@/templates/release-composition/use-scoped-connector-attribution'

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  rulesEngineService.listConnectorDependenciesByVersion.mockReset()
  customPageVersionService.listConnectorDependenciesByVersion.mockReset()
})

describe('useScopedConnectorAttribution - dispatch by scope', () => {
  it('resolves the application connector manifest via the rules-engine service', async () => {
    rulesEngineService.listConnectorDependenciesByVersion.mockResolvedValue([
      { connectorId: 10, ruleCount: 1 },
      { connectorId: 20, ruleCount: 2 }
    ])

    const attribution = useScopedConnectorAttribution()
    await attribution.ensure('ds-1', {
      scopedType: 'application',
      parentId: 'app-1',
      versionId: 'v-1'
    })
    await flushPromises()

    expect(rulesEngineService.listConnectorDependenciesByVersion).toHaveBeenCalledWith(
      'app-1',
      'v-1'
    )
    expect(attribution.ownedConnectorIdsFor('ds-1')).toEqual(new Set(['10', '20']))
    expect(attribution.hasError('ds-1')).toBe(false)
    expect(attribution.isResolving('ds-1')).toBe(false)
  })

  it('resolves the custom_page connector manifest via the custom-page version service', async () => {
    customPageVersionService.listConnectorDependenciesByVersion.mockResolvedValue([
      { connectorId: 30, pageCount: 1 }
    ])

    const attribution = useScopedConnectorAttribution()
    await attribution.ensure('ds-2', {
      scopedType: 'custom_page',
      parentId: 'page-1',
      versionId: 'v-2'
    })
    await flushPromises()

    expect(customPageVersionService.listConnectorDependenciesByVersion).toHaveBeenCalledWith(
      'page-1',
      'v-2'
    )
    expect(attribution.ownedConnectorIdsFor('ds-2')).toEqual(new Set(['30']))
  })
})

describe('useScopedConnectorAttribution - no-op cases', () => {
  it('does nothing for a firewall scope (firewall owns no connectors)', async () => {
    const attribution = useScopedConnectorAttribution()
    await attribution.ensure('ds-1', {
      scopedType: 'firewall',
      parentId: 'fw-1',
      versionId: 'v-1'
    })
    await flushPromises()

    expect(rulesEngineService.listConnectorDependenciesByVersion).not.toHaveBeenCalled()
    expect(customPageVersionService.listConnectorDependenciesByVersion).not.toHaveBeenCalled()
    expect(attribution.ownedConnectorIdsFor('ds-1')).toBeNull()
  })

  it('does nothing when parentId or versionId is missing', async () => {
    const attribution = useScopedConnectorAttribution()
    await attribution.ensure('ds-1', {
      scopedType: 'application',
      parentId: null,
      versionId: 'v-1'
    })
    await attribution.ensure('ds-1', {
      scopedType: 'application',
      parentId: 'app-1',
      versionId: null
    })
    await flushPromises()

    expect(rulesEngineService.listConnectorDependenciesByVersion).not.toHaveBeenCalled()
    expect(attribution.ownedConnectorIdsFor('ds-1')).toBeNull()
  })
})

describe('useScopedConnectorAttribution - error degradation', () => {
  it('flags the error and keeps the owned set null (hidden) when the service rejects', async () => {
    rulesEngineService.listConnectorDependenciesByVersion.mockRejectedValue(new Error('boom'))

    const attribution = useScopedConnectorAttribution()
    await attribution.ensure('ds-1', {
      scopedType: 'application',
      parentId: 'app-1',
      versionId: 'v-1'
    })
    await flushPromises()

    expect(attribution.hasError('ds-1')).toBe(true)
    expect(attribution.ownedConnectorIdsFor('ds-1')).toBeNull()
    expect(attribution.isResolving('ds-1')).toBe(false)
  })
})

describe('useScopedConnectorAttribution - caching', () => {
  it('does not refetch the same (scope, parent, version) key for a DS', async () => {
    rulesEngineService.listConnectorDependenciesByVersion.mockResolvedValue([
      { connectorId: 10, ruleCount: 1 }
    ])

    const attribution = useScopedConnectorAttribution()
    const target = { scopedType: 'application', parentId: 'app-1', versionId: 'v-1' }
    await attribution.ensure('ds-1', target)
    await flushPromises()
    await attribution.ensure('ds-1', target)
    await flushPromises()

    expect(rulesEngineService.listConnectorDependenciesByVersion).toHaveBeenCalledTimes(1)
  })

  it('refetches when the active version for the DS changes', async () => {
    rulesEngineService.listConnectorDependenciesByVersion.mockImplementation((_id, verId) =>
      Promise.resolve(
        verId === 'v-2' ? [{ connectorId: 20, ruleCount: 1 }] : [{ connectorId: 10, ruleCount: 1 }]
      )
    )

    const attribution = useScopedConnectorAttribution()
    await attribution.ensure('ds-1', {
      scopedType: 'application',
      parentId: 'app-1',
      versionId: 'v-1'
    })
    await flushPromises()
    expect(attribution.ownedConnectorIdsFor('ds-1')).toEqual(new Set(['10']))

    await attribution.ensure('ds-1', {
      scopedType: 'application',
      parentId: 'app-1',
      versionId: 'v-2'
    })
    await flushPromises()

    expect(rulesEngineService.listConnectorDependenciesByVersion).toHaveBeenCalledTimes(2)
    expect(attribution.ownedConnectorIdsFor('ds-1')).toEqual(new Set(['20']))
  })
})
