import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Single shared action router (task 3.1). Asserts that every listing routes the
 * 5 menu actions identically: OPEN_CONFIGURATION → router.push by resourceType;
 * PROMOTE → drawer with { scopedType, pin, workloadId }; ROLLBACK → no-op;
 * ARCHIVE/DELETE → delegated to use-version-row-actions (the only mutation seam).
 */

const rowHandle = vi.fn()
const rowActionsApi = {
  handleRowAction: rowHandle,
  dialogConfig: { value: null },
  dialogProps: { value: {} },
  dialogVisible: { value: false },
  isExecuting: { value: false },
  handleConfirm: vi.fn(),
  handleVisibility: vi.fn()
}
vi.mock('@/composables/versioning/use-version-row-actions', () => ({
  useVersionRowActions: vi.fn(() => rowActionsApi)
}))

import {
  useVersionMenuActions,
  RESOURCE_VERSION_ROUTES
} from '@/composables/versioning/use-version-menu-actions'
import { useVersionRowActions } from '@/composables/versioning/use-version-row-actions'

const item = { id: 'v123', state: 'ready' }

const makeRouter = () => ({ push: vi.fn() })

beforeEach(() => {
  rowHandle.mockReset()
  useVersionRowActions.mockClear()
})

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
  it('does nothing (no navigation, no delegation)', () => {
    const router = makeRouter()
    const openPromoteDrawer = vi.fn()
    const api = useVersionMenuActions({
      resourceType: 'application',
      resourceId: 'res9',
      router,
      openPromoteDrawer
    })

    api.handleRowAction({ action: 'ROLLBACK', item })

    expect(router.push).not.toHaveBeenCalled()
    expect(openPromoteDrawer).not.toHaveBeenCalled()
    expect(rowHandle).not.toHaveBeenCalled()
  })
})

describe('useVersionMenuActions — ARCHIVE/DELETE delegation', () => {
  it.each(['ARCHIVE', 'DELETE'])('delegates %s to use-version-row-actions', (action) => {
    const api = useVersionMenuActions({
      resourceType: 'application',
      resourceId: 'res9',
      versionService: {},
      router: makeRouter()
    })

    api.handleRowAction({ action, item })

    expect(rowHandle).toHaveBeenCalledWith({ action, item })
  })

  it('forwards resourceId/service/onSuccess into use-version-row-actions', () => {
    const versionService = { archive: vi.fn(), deleteVersion: vi.fn() }
    const onSuccess = vi.fn()
    useVersionMenuActions({
      resourceType: 'application',
      resourceId: 'res9',
      versionService,
      router: makeRouter(),
      onSuccess
    })

    expect(useVersionRowActions).toHaveBeenCalledWith({
      resourceId: 'res9',
      service: versionService,
      onSuccess
    })
  })

  it('re-exposes the row-actions dialog state/handlers for the host', () => {
    const api = useVersionMenuActions({
      resourceType: 'application',
      resourceId: 'res9',
      router: makeRouter()
    })

    expect(api.dialogConfig).toBe(rowActionsApi.dialogConfig)
    expect(api.dialogProps).toBe(rowActionsApi.dialogProps)
    expect(api.dialogVisible).toBe(rowActionsApi.dialogVisible)
    expect(api.handleConfirm).toBe(rowActionsApi.handleConfirm)
    expect(api.handleVisibility).toBe(rowActionsApi.handleVisibility)
  })
})
