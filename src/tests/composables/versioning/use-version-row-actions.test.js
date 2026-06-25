import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Row-menu Archive/Delete execution (task 3.2). Asserts the post-3.2 contract:
 * ARCHIVE runs with no modal + success toast; DELETE opens the destructive
 * confirm dialog and only mutates after confirmation; a backend rejection
 * (e.g. "version in use as Current") surfaces as an error toast; and the
 * retired BUILD/NEW_DRAFT_FROM/CANCEL_BUILD actions are no-ops on this path.
 */

const toastAdd = vi.fn()
vi.mock('@aziontech/webkit/use-toast', () => ({ useToast: () => ({ add: toastAdd }) }))

import { useVersionRowActions } from '@/composables/versioning/use-version-row-actions'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

const makeService = (overrides = {}) => ({
  deleteVersion: vi.fn().mockResolvedValue(undefined),
  archive: vi.fn().mockResolvedValue(undefined),
  build: vi.fn().mockResolvedValue(undefined),
  createDraft: vi.fn().mockResolvedValue({ id: 'new' }),
  cancelBuild: vi.fn().mockResolvedValue(undefined),
  ...overrides
})

const item = { id: 'v123', state: 'ready' }

beforeEach(() => {
  toastAdd.mockReset()
})

describe('useVersionRowActions — Archive (no modal, success toast)', () => {
  it('archives immediately without opening a dialog', async () => {
    const service = makeService()
    const onSuccess = vi.fn()
    const api = useVersionRowActions({ resourceId: 'app1', service, onSuccess })

    api.handleRowAction({ action: 'ARCHIVE', item })
    await flush()

    expect(service.archive).toHaveBeenCalledWith('app1', 'v123', expect.objectContaining({}))
    expect(api.dialogVisible.value).toBe(false)
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
  })

  it('passes a non-empty comment so the service contract holds', async () => {
    const service = makeService()
    const api = useVersionRowActions({ resourceId: 'app1', service })

    api.handleRowAction({ action: 'ARCHIVE', item })
    await flush()

    const body = service.archive.mock.calls[0][2]
    expect(typeof body.comment).toBe('string')
    expect(body.comment.trim()).not.toBe('')
  })
})

describe('useVersionRowActions — Delete (destructive confirm dialog)', () => {
  it('opens the dialog and only deletes after confirmation', async () => {
    const service = makeService()
    const onSuccess = vi.fn()
    const api = useVersionRowActions({ resourceId: 'app1', service, onSuccess })

    api.handleRowAction({ action: 'DELETE', item })
    expect(api.dialogVisible.value).toBe(true)
    expect(service.deleteVersion).not.toHaveBeenCalled()
    expect(api.dialogProps.value.confirmSeverity).toBe('danger')

    api.handleConfirm()
    await flush()

    expect(service.deleteVersion).toHaveBeenCalledWith('app1', 'v123')
    expect(onSuccess).toHaveBeenCalledOnce()
  })
})

describe('useVersionRowActions — backend authority on "in use"', () => {
  it('surfaces the backend error message in an error toast', async () => {
    const service = makeService({
      archive: vi.fn().mockRejectedValue(new Error('Version in use as Current in 2 environments'))
    })
    const api = useVersionRowActions({ resourceId: 'app1', service })

    api.handleRowAction({ action: 'ARCHIVE', item })
    await flush()

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        detail: 'Version in use as Current in 2 environments'
      })
    )
  })

  it('delegates to err.showErrors when the rejection carries it', async () => {
    const showErrors = vi.fn()
    const service = makeService({
      deleteVersion: vi.fn().mockRejectedValue({ showErrors })
    })
    const api = useVersionRowActions({ resourceId: 'app1', service })

    api.handleRowAction({ action: 'DELETE', item })
    api.handleConfirm()
    await flush()

    expect(showErrors).toHaveBeenCalledOnce()
  })

  // Property 5: a rejection must not produce a false success — no success toast
  // and no view reload/navigation; the list stays consistent (Req 3.1/3.2/3.4).
  it('does not signal success nor reload when Archive is rejected', async () => {
    const onSuccess = vi.fn()
    const service = makeService({
      archive: vi.fn().mockRejectedValue(new Error('Version in use as Current'))
    })
    const api = useVersionRowActions({ resourceId: 'app1', service, onSuccess })

    api.handleRowAction({ action: 'ARCHIVE', item })
    await flush()

    expect(onSuccess).not.toHaveBeenCalled()
    expect(toastAdd).not.toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    expect(api.isExecuting.value).toBe(false)
  })

  it('does not signal success nor reload when Delete is rejected', async () => {
    const onSuccess = vi.fn()
    const service = makeService({
      deleteVersion: vi.fn().mockRejectedValue(new Error('Version in use as Current'))
    })
    const api = useVersionRowActions({ resourceId: 'app1', service, onSuccess })

    api.handleRowAction({ action: 'DELETE', item })
    api.handleConfirm()
    await flush()

    expect(onSuccess).not.toHaveBeenCalled()
    expect(toastAdd).not.toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    expect(api.isExecuting.value).toBe(false)
  })
})

describe('useVersionRowActions — retired row actions are no-ops', () => {
  it.each(['BUILD', 'NEW_DRAFT_FROM', 'CANCEL_BUILD'])(
    '%s does not open a dialog nor call the service',
    async (action) => {
      const service = makeService()
      const api = useVersionRowActions({ resourceId: 'app1', service })

      api.handleRowAction({ action, item })
      await flush()

      expect(api.dialogVisible.value).toBe(false)
      expect(service.build).not.toHaveBeenCalled()
      expect(service.createDraft).not.toHaveBeenCalled()
      expect(service.cancelBuild).not.toHaveBeenCalled()
    }
  )
})
