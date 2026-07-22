/**
 * Coverage-matrix claims (spec versioning-test-coverage / TEST-ARCHITECTURE §3.4).
 * The matrix (tests/coverage-matrix.json) is DERIVED from these markers —
 * run `node scripts/check-coverage-matrix.mjs --write` after changing them.
 * @covers application,connector,function,network_list,waf,workload:J3 component partial
 * @covers application:J6 component
 * @covers application,connector,custom_page,firewall,workload:J8 component
 * @covers application:J10 component partial
 */
import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'

vi.mock('@aziontech/webkit/use-toast', () => ({ useToast: () => ({ add: vi.fn() }) }))

import {
  useVersionMenuActions,
  RESOURCE_VERSION_ROUTES
} from '@/composables/versioning/use-version-menu-actions'

const item = { id: 'v123', state: 'ready' }

const makeRouter = () => ({ push: vi.fn() })

describe('useVersionMenuActions — OPEN_CONFIGURATION navigation', () => {
  const cases = Object.entries(RESOURCE_VERSION_ROUTES)

  it.each(cases)('routes %s to its version editor with id + versionId', (resourceType, name) => {
    const router = makeRouter()
    const api = useVersionMenuActions({ resourceType, resourceId: 'res9', router })

    api.handleRowAction({ action: 'OPEN_CONFIGURATION', item })

    expect(router.push).toHaveBeenCalledWith({
      name,
      params: { id: 'res9', versionId: 'v123' }
    })
  })

  it('does not navigate for an unknown resourceType', () => {
    const router = makeRouter()
    const api = useVersionMenuActions({ resourceType: 'unknown', resourceId: 'res9', router })

    api.handleRowAction({ action: 'OPEN_CONFIGURATION', item })

    expect(router.push).not.toHaveBeenCalled()
  })
})

describe('useVersionMenuActions — BUILD execution', () => {
  it('calls the version /build endpoint directly without navigating (has /build)', async () => {
    const router = makeRouter()
    const versionService = { build: vi.fn().mockResolvedValue(undefined) }
    const onSuccess = vi.fn()
    const api = useVersionMenuActions({
      resourceType: 'firewall',
      resourceId: 'res9',
      versionService,
      router,
      onSuccess
    })

    await api.handleRowAction({ action: 'BUILD', item })

    expect(versionService.build).toHaveBeenCalledWith('res9', 'v123')
    expect(onSuccess).toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('does not call onSuccess when the build request fails', async () => {
    const router = makeRouter()
    const versionService = { build: vi.fn().mockRejectedValue(new Error('boom')) }
    const onSuccess = vi.fn()
    const api = useVersionMenuActions({
      resourceType: 'firewall',
      resourceId: 'res9',
      versionService,
      router,
      onSuccess
    })

    await api.handleRowAction({ action: 'BUILD', item })

    expect(versionService.build).toHaveBeenCalledWith('res9', 'v123')
    expect(onSuccess).not.toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('navigates with the build intent for auto-build-on-save resources (workload)', async () => {
    const router = makeRouter()
    const versionService = { build: vi.fn() }
    const api = useVersionMenuActions({
      resourceType: 'workload',
      resourceId: 'res9',
      versionService,
      router
    })

    await api.handleRowAction({ action: 'BUILD', item })

    expect(router.push).toHaveBeenCalledWith({
      name: 'edit-workload-version',
      params: { id: 'res9', versionId: 'v123' },
      query: { intent: 'build' }
    })
    expect(versionService.build).not.toHaveBeenCalled()
  })

  it('does nothing for an unknown resourceType without a build service', async () => {
    const router = makeRouter()
    const api = useVersionMenuActions({ resourceType: 'unknown', resourceId: 'res9', router })

    await api.handleRowAction({ action: 'BUILD', item })

    expect(router.push).not.toHaveBeenCalled()
  })
})

describe('useVersionMenuActions — DEPLOY opens the release composer', () => {
  it('routes to the composer scoped to this version (scoped resource)', () => {
    const router = makeRouter()
    const api = useVersionMenuActions({ resourceType: 'application', resourceId: 'res9', router })

    api.handleRowAction({ action: 'DEPLOY', item })

    expect(router.push).toHaveBeenCalledWith({
      name: 'release-composer',
      query: {
        fromVersion: 'true',
        scopedType: 'application',
        versionId: 'v123',
        resourceId: 'res9'
      }
    })
  })
})

describe('useVersionMenuActions — PROMOTE drawer', () => {
  it('opens the promote drawer pinned to the version', () => {
    const openPromoteDrawer = vi.fn()
    const api = useVersionMenuActions({
      resourceType: 'application',
      resourceId: 'res9',
      router: makeRouter(),
      openPromoteDrawer,
      workloadId: 'wl1'
    })

    api.handleRowAction({ action: 'PROMOTE', item })

    expect(openPromoteDrawer).toHaveBeenCalledWith({
      scopedType: 'application',
      pin: 'v123',
      workloadId: 'wl1'
    })
  })

  it('is a no-op when no opener is supplied', () => {
    const api = useVersionMenuActions({
      resourceType: 'application',
      resourceId: 'res9',
      router: makeRouter()
    })
    expect(() => api.handleRowAction({ action: 'PROMOTE', item })).not.toThrow()
  })
})

describe('useVersionMenuActions — ROLLBACK deferred', () => {
  it('does nothing (no navigation, no drawer, no mutation)', () => {
    const router = makeRouter()
    const openPromoteDrawer = vi.fn()
    const versionService = { archive: vi.fn(), deleteVersion: vi.fn() }
    const api = useVersionMenuActions({
      resourceType: 'application',
      resourceId: 'res9',
      versionService,
      router,
      openPromoteDrawer
    })

    api.handleRowAction({ action: 'ROLLBACK', item })

    expect(router.push).not.toHaveBeenCalled()
    expect(openPromoteDrawer).not.toHaveBeenCalled()
    expect(versionService.archive).not.toHaveBeenCalled()
    expect(versionService.deleteVersion).not.toHaveBeenCalled()
  })
})

describe('useVersionMenuActions — ARCHIVE/DELETE run through the row-actions seam', () => {
  it('ARCHIVE fires the archive mutation immediately with a comment, then onSuccess', async () => {
    const versionService = {
      archive: vi.fn().mockResolvedValue(undefined),
      deleteVersion: vi.fn()
    }
    const onSuccess = vi.fn()
    const api = useVersionMenuActions({
      resourceType: 'application',
      resourceId: 'res9',
      versionService,
      router: makeRouter(),
      onSuccess
    })

    api.handleRowAction({ action: 'ARCHIVE', item })

    expect(versionService.archive).toHaveBeenCalledWith(
      'res9',
      'v123',
      expect.objectContaining({ comment: expect.any(String) })
    )
    expect(versionService.deleteVersion).not.toHaveBeenCalled()
    await flushPromises()
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('DELETE opens the confirmation dialog and defers the mutation until confirmed', async () => {
    const versionService = {
      archive: vi.fn(),
      deleteVersion: vi.fn().mockResolvedValue(undefined)
    }
    const onSuccess = vi.fn()
    const api = useVersionMenuActions({
      resourceType: 'application',
      resourceId: 'res9',
      versionService,
      router: makeRouter(),
      onSuccess
    })

    api.handleRowAction({ action: 'DELETE', item })

    expect(api.dialogVisible.value).toBe(true)
    expect(api.dialogConfig.value).not.toBeNull()
    expect(versionService.deleteVersion).not.toHaveBeenCalled()

    api.handleConfirm()

    expect(versionService.deleteVersion).toHaveBeenCalledWith('res9', 'v123')
    await flushPromises()
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('closing the dialog via handleVisibility cancels the pending delete', () => {
    const versionService = { archive: vi.fn(), deleteVersion: vi.fn() }
    const api = useVersionMenuActions({
      resourceType: 'application',
      resourceId: 'res9',
      versionService,
      router: makeRouter()
    })

    api.handleRowAction({ action: 'DELETE', item })
    expect(api.dialogVisible.value).toBe(true)

    api.handleVisibility(false)

    expect(api.dialogVisible.value).toBe(false)
    api.handleConfirm()
    expect(versionService.deleteVersion).not.toHaveBeenCalled()
  })
})
