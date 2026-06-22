import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Property P6 — menu consistency across listings (task 7.3).
 * Enumerates every version listing/consumer and asserts two things for the SAME
 * version state:
 *   (a) each routes `row-action` through the shared `useVersionMenuActions`
 *       (the single driver) and never builds/handles the menu locally; and
 *   (b) each renders an IDENTICAL menu — same set, order and enablement — built
 *       by the shared `mapVersionMenuItemsToMenu`, regardless of `resourceType`.
 * Divergence by listing is forbidden by construction (Req 1.4, 10.1, NFR-B.1).
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

import { useVersionMenuActions } from '@/composables/versioning/use-version-menu-actions'
import { mapVersionMenuItemsToMenu } from '@/composables/versioning/version-actions'
import { VERSION_STATES } from '@/composables/versioning/version-machine'

/**
 * Every version listing/consumer wired to the shared driver, with the
 * `resourceType` it injects and the source file that proves the wiring.
 * Adding a new listing without the shared driver makes this enumeration fail.
 */
const LISTINGS = [
  {
    name: 'EdgeApplications EditView',
    resourceType: 'application',
    file: 'src/views/EdgeApplications/v6/EditView.vue'
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
    name: 'DeploymentVersionsList',
    resourceType: 'deployment',
    file: 'src/views/Deployments/components/DeploymentVersionsList.vue'
  }
]

const ALL_STATES = [...Object.values(VERSION_STATES), 'deleted', 'totally-unknown']

const readSource = (relative) =>
  readFileSync(fileURLToPath(new URL(`../../../../${relative}`, import.meta.url)), 'utf8')

// Drop the per-item `command` closures (identity differs across calls) so two
// rendered models compare by their visible/structural shape (label/icon/
// disabled/class/tooltip/separator) — what the user actually perceives.
const stripCommands = (model) =>
  model.map((entry) => {
    const rest = { ...entry }
    delete rest.command
    return rest
  })

const item = { id: 'v123', state: 'ready' }
const makeRouter = () => ({ push: vi.fn() })

beforeEach(() => {
  rowHandle.mockReset()
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
    // No listing may hardcode menu labels — those live only in version-actions.js.
    expect(src).not.toContain('Promote version')
    expect(src).not.toContain('Open configuration')
    expect(src).not.toContain('Rollback to this version')
  })
})

describe('P6 — identical rendered menu across listings for the same state', () => {
  it.each(ALL_STATES)('state "%s": every resourceType yields a byte-identical model', (state) => {
    const handler = vi.fn()
    const models = LISTINGS.map(({ resourceType }) =>
      stripCommands(mapVersionMenuItemsToMenu(state, { resourceType }, handler, item))
    )

    const [reference, ...rest] = models
    rest.forEach((model) => expect(model).toEqual(reference))
  })

  it.each(ALL_STATES)('state "%s": labels, order and enablement match the reference', (state) => {
    const reference = stripCommands(
      mapVersionMenuItemsToMenu(state, { resourceType: 'application' }, vi.fn(), item)
    )

    LISTINGS.forEach(({ resourceType }) => {
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
    '$name: ARCHIVE/DELETE delegate to the single row-actions seam',
    ({ resourceType }) => {
      const api = useVersionMenuActions({
        resourceType,
        resourceId: 'res1',
        versionService: {},
        router: makeRouter()
      })

      api.handleRowAction({ action: 'ARCHIVE', item })
      api.handleRowAction({ action: 'DELETE', item })

      expect(rowHandle).toHaveBeenNthCalledWith(1, { action: 'ARCHIVE', item })
      expect(rowHandle).toHaveBeenNthCalledWith(2, { action: 'DELETE', item })
    }
  )

  it.each(LISTINGS)('$name: ROLLBACK is an identical no-op (deferred)', ({ resourceType }) => {
    const router = makeRouter()
    const openPromoteDrawer = vi.fn()
    const api = useVersionMenuActions({
      resourceType,
      resourceId: 'res1',
      router,
      openPromoteDrawer
    })

    api.handleRowAction({ action: 'ROLLBACK', item })

    expect(router.push).not.toHaveBeenCalled()
    expect(openPromoteDrawer).not.toHaveBeenCalled()
    expect(rowHandle).not.toHaveBeenCalled()
  })
})
