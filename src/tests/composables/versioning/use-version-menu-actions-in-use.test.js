/**
 * Coverage-matrix claims (spec versioning-test-coverage / TEST-ARCHITECTURE §3.4).
 * The matrix (tests/coverage-matrix.json) is DERIVED from these markers —
 * run `node scripts/check-coverage-matrix.mjs --write` after changing them.
 * @covers application:J6 component
 * @covers application:J7 component
 * @covers application,connector,custom_page,firewall,function,network_list,waf,workload:J10 component partial
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const toastAdd = vi.fn()
vi.mock('@aziontech/webkit/use-toast', () => ({ useToast: () => ({ add: toastAdd }) }))

import { useVersionMenuActions } from '@/composables/versioning/use-version-menu-actions'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
const item = { id: 'v123', state: 'ready' }
const makeRouter = () => ({ push: vi.fn() })

beforeEach(() => {
  toastAdd.mockReset()
})

describe('useVersionMenuActions — backend "in use" rejection surfaces a toast', () => {
  it('surfaces the archive rejection message in an error toast', async () => {
    const versionService = {
      archive: vi.fn().mockRejectedValue(new Error('Version in use as Current in 2 environments')),
      deleteVersion: vi.fn()
    }
    const api = useVersionMenuActions({
      resourceType: 'application',
      resourceId: 'app1',
      versionService,
      router: makeRouter()
    })

    api.handleRowAction({ action: 'ARCHIVE', item })
    await flush()

    expect(versionService.archive).toHaveBeenCalledOnce()
    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        detail: 'Version in use as Current in 2 environments'
      })
    )
  })

  it('surfaces the delete rejection message after confirmation', async () => {
    const versionService = {
      archive: vi.fn(),
      deleteVersion: vi.fn().mockRejectedValue(new Error('Version in use as Current'))
    }
    const api = useVersionMenuActions({
      resourceType: 'application',
      resourceId: 'app1',
      versionService,
      router: makeRouter()
    })

    api.handleRowAction({ action: 'DELETE', item })
    api.handleConfirm()
    await flush()

    expect(versionService.deleteVersion).toHaveBeenCalledWith('app1', 'v123')
    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', detail: 'Version in use as Current' })
    )
  })
})
