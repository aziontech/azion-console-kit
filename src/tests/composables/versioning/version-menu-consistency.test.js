// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

vi.mock('@aziontech/webkit/use-toast', () => ({ useToast: () => ({ add: vi.fn() }) }))

import { useVersionMenuActions } from '@/composables/versioning/use-version-menu-actions'
import { mapVersionMenuItemsToMenu } from '@/composables/versioning/version-actions'
import { VERSION_STATES } from '@/composables/versioning/version-machine'

const LISTINGS = [
  {
    name: 'EdgeApplications VersionsTab',
    resourceType: 'application',
    file: 'src/views/EdgeApplications/v6/tabs/VersionsTab.vue'
  },
  {
    name: 'EdgeFirewall VersionsTab',
    resourceType: 'firewall',
    file: 'src/views/EdgeFirewall/v6/tabs/VersionsTab.vue'
  },
  {
    name: 'EdgeConnectors VersionsTab',
    resourceType: 'connector',
    file: 'src/views/EdgeConnectors/v6/tabs/VersionsTab.vue'
  },
  {
    name: 'CustomPages VersionsTab',
    resourceType: 'custom_page',
    file: 'src/views/CustomPages/v6/tabs/VersionsTab.vue'
  },
  {
    name: 'EdgeFunctions VersionsTab',
    resourceType: 'function',
    file: 'src/views/EdgeFunctions/v6/tabs/VersionsTab.vue'
  },
  {
    name: 'Workload VersionsTab',
    resourceType: 'workload',
    file: 'src/views/Workload/Tabs/VersionsTab.vue'
  },
  {
    name: 'NetworkLists VersionsTab',
    resourceType: 'network_list',
    file: 'src/views/NetworkLists/v6/tabs/VersionsTab.vue'
  },
  {
    name: 'WafRules VersionsTab',
    resourceType: 'waf',
    file: 'src/views/WafRules/v6/tabs/VersionsTab.vue'
  }
]

const ALL_STATES = [...Object.values(VERSION_STATES), 'deleted', 'totally-unknown']

const VERSIONED_ONLY_TYPES = new Set(['function', 'network_list', 'waf'])
const DEPLOYABLE_LISTINGS = LISTINGS.filter(
  ({ resourceType }) => !VERSIONED_ONLY_TYPES.has(resourceType)
)

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../')
const readSource = (relative) => readFileSync(resolve(REPO_ROOT, relative), 'utf8')

const stripCommands = (model) =>
  model.map((entry) => {
    const rest = { ...entry }
    delete rest.command
    return rest
  })

const item = { id: 'v123', state: 'ready' }
const makeRouter = () => ({ push: vi.fn() })
const makeVersionService = () => ({
  archive: vi.fn().mockResolvedValue(undefined),
  deleteVersion: vi.fn().mockResolvedValue(undefined)
})

describe('P6 — every listing wires the shared driver (no local menu handling)', () => {
  it.each(LISTINGS)('$name imports useVersionMenuActions and binds row-action', ({ file }) => {
    const src = readSource(file)
    expect(src).toContain('use-version-menu-actions')
    expect(src).toContain('useVersionMenuActions')
    expect(src).toMatch(/handleRowAction/)
  })

  it.each(LISTINGS)('$name builds its menu only via the shared mapper', ({ file }) => {
    const src = readSource(file)
    const rendersMenu =
      src.includes('mapVersionMenuItemsToMenu') || src.includes('VersionListDataView')
    expect(rendersMenu).toBe(true)
    expect(src).not.toContain('Promote version')
    expect(src).not.toContain('Open configuration')
    expect(src).not.toContain('Rollback to this version')
  })
})

describe('P6 — identical rendered menu across listings for the same state', () => {
  it.each(ALL_STATES)('state "%s": every resourceType yields a byte-identical model', (state) => {
    const handler = vi.fn()
    const models = DEPLOYABLE_LISTINGS.map(({ resourceType }) =>
      stripCommands(mapVersionMenuItemsToMenu(state, { resourceType }, handler, item))
    )

    const [reference, ...rest] = models
    rest.forEach((model) => expect(model).toEqual(reference))
  })

  it.each(ALL_STATES)('state "%s": labels, order and enablement match the reference', (state) => {
    const reference = stripCommands(
      mapVersionMenuItemsToMenu(state, { resourceType: 'application' }, vi.fn(), item)
    )

    DEPLOYABLE_LISTINGS.forEach(({ resourceType }) => {
      const model = stripCommands(mapVersionMenuItemsToMenu(state, { resourceType }, vi.fn(), item))
      expect(model.map((entry) => entry.label)).toEqual(reference.map((entry) => entry.label))
      expect(model.map((entry) => entry.disabled)).toEqual(reference.map((entry) => entry.disabled))
      expect(model.map((entry) => entry.separator ?? false)).toEqual(
        reference.map((entry) => entry.separator ?? false)
      )
    })
  })
})

describe('P6 — identical routing across listings (same driver, same outcome)', () => {
  it.each(LISTINGS)(
    '$name: ARCHIVE fires the service mutation identically through the seam',
    ({ resourceType }) => {
      const versionService = makeVersionService()
      const api = useVersionMenuActions({
        resourceType,
        resourceId: 'res1',
        versionService,
        router: makeRouter()
      })

      api.handleRowAction({ action: 'ARCHIVE', item })

      expect(versionService.archive).toHaveBeenCalledWith(
        'res1',
        'v123',
        expect.objectContaining({ comment: expect.any(String) })
      )
    }
  )

  it.each(LISTINGS)(
    '$name: DELETE opens the confirm dialog and defers the mutation identically',
    ({ resourceType }) => {
      const versionService = makeVersionService()
      const api = useVersionMenuActions({
        resourceType,
        resourceId: 'res1',
        versionService,
        router: makeRouter()
      })

      api.handleRowAction({ action: 'DELETE', item })

      expect(api.dialogVisible.value).toBe(true)
      expect(api.dialogConfig.value).not.toBeNull()
      expect(versionService.deleteVersion).not.toHaveBeenCalled()
    }
  )

  it.each(LISTINGS)('$name: ROLLBACK is an identical no-op (deferred)', ({ resourceType }) => {
    const router = makeRouter()
    const openPromoteDrawer = vi.fn()
    const versionService = makeVersionService()
    const api = useVersionMenuActions({
      resourceType,
      resourceId: 'res1',
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
