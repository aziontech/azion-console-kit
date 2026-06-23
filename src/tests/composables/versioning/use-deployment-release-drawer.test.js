import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'

const getReleaseByIdService = vi.fn()
const resolveReleaseResources = vi.fn()

vi.mock('@/services/v2/deployment/deployment-release-service', () => ({
  deploymentReleaseService: {
    getReleaseByIdService: (...args) => getReleaseByIdService(...args)
  }
}))

vi.mock('@/views/Deployments/utils/resolveReleaseResources', () => ({
  resolveReleaseResources: (...args) => resolveReleaseResources(...args)
}))

import {
  useDeploymentReleaseDrawer,
  useReleaseDrawerController
} from '@/composables/versioning/use-deployment-release-drawer'

const flush = async () => {
  await nextTick()
  for (let index = 0; index < 6; index += 1) {
    await Promise.resolve()
  }
  await nextTick()
}

const setup = (overrides = {}) => {
  const release = ref(overrides.release ?? { id: 'R1', deployment_id: 'D1' })
  const visible = ref(overrides.visible ?? false)
  const emit = vi.fn()
  const api = useDeploymentReleaseDrawer({ release, visible, emit })
  return { release, visible, emit, api }
}

describe('useDeploymentReleaseDrawer', () => {
  beforeEach(() => {
    getReleaseByIdService.mockReset()
    resolveReleaseResources.mockReset()
  })

  it('toggles the resolving flag while resolving and clears it when done', async () => {
    getReleaseByIdService.mockResolvedValue({ data: { id: 'R1', resources: [] } })
    resolveReleaseResources.mockResolvedValue([])

    const { visible, api } = setup()
    expect(api.isResolvingResources.value).toBe(false)

    visible.value = true
    await flush()

    expect(api.isResolvingResources.value).toBe(false)
    expect(getReleaseByIdService).toHaveBeenCalledWith('D1', 'R1')
  })

  it('applies a deterministic fallback (id/label) when a name is blank', async () => {
    getReleaseByIdService.mockResolvedValue({
      data: {
        id: 'R1',
        resources: [{ type: 'application', id: 'res-1', label: 'Application', name: '' }]
      }
    })
    // Single resolution source returns the resource still without a name.
    resolveReleaseResources.mockResolvedValue([
      { type: 'application', id: 'res-1', label: 'Application', name: '' }
    ])

    const { visible, api } = setup()
    visible.value = true
    await flush()

    expect(api.displayRelease.value.resources[0].name).toBe('res-1')
  })

  it('falls back to label, then em dash, when id is also missing', async () => {
    getReleaseByIdService.mockResolvedValue({
      data: {
        id: 'R1',
        resources: [
          { type: 'application', label: 'Application', name: '' },
          { type: 'firewall', name: '' }
        ]
      }
    })
    resolveReleaseResources.mockResolvedValue([
      { type: 'application', label: 'Application', name: '' },
      { type: 'firewall', name: '' }
    ])

    const { visible, api } = setup()
    visible.value = true
    await flush()

    expect(api.displayRelease.value.resources[0].name).toBe('Application')
    expect(api.displayRelease.value.resources[1].name).toBe('--')
  })

  it('uses resolveReleaseResources as the single resolution source', async () => {
    getReleaseByIdService.mockResolvedValue({
      data: { id: 'R1', resources: [{ type: 'application', id: 'res-1', name: 'adapter-name' }] }
    })
    resolveReleaseResources.mockResolvedValue([
      { type: 'application', id: 'res-1', name: 'resolved-name' }
    ])

    const { visible, api } = setup()
    visible.value = true
    await flush()

    expect(resolveReleaseResources).toHaveBeenCalledTimes(1)
    expect(api.displayRelease.value.resources[0].name).toBe('resolved-name')
  })

  it('shows only application, firewall and custom_page resources in the drawer', async () => {
    const allResources = [
      { type: 'application', id: 'app-1', name: 'app' },
      { type: 'firewall', id: 'fw-1', name: 'fw' },
      { type: 'custom_page', id: 'cp-1', name: 'page' },
      { type: 'function', id: 'fn-1', name: 'fn' },
      { type: 'connector', id: 'cn-1', name: 'conn' }
    ]
    getReleaseByIdService.mockResolvedValue({ data: { id: 'R1', resources: allResources } })
    // The resolver only ever receives the already-filtered drawer resources.
    resolveReleaseResources.mockImplementation(async (resources) => resources)

    const { visible, api } = setup()
    visible.value = true
    await flush()

    const types = api.displayRelease.value.resources.map((resource) => resource.type)
    expect(types).toEqual(['application', 'firewall', 'custom_page'])
    expect(resolveReleaseResources).toHaveBeenCalledWith([
      { type: 'application', id: 'app-1', name: 'app' },
      { type: 'firewall', id: 'fw-1', name: 'fw' },
      { type: 'custom_page', id: 'cp-1', name: 'page' }
    ])
  })

  it('stale guard: a newer release wins over an older in-flight resolution', async () => {
    let resolveFirst
    getReleaseByIdService
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolveFirst = () => resolve({ data: { id: 'R1' } })))
      )
      .mockResolvedValueOnce({ data: { id: 'R2' } })
    resolveReleaseResources.mockResolvedValue([])

    const { release, visible, api } = setup()
    visible.value = true
    await nextTick()

    release.value = { id: 'R2', deployment_id: 'D1' }
    await flush()

    // The late first fetch resolves last but must not clobber R2.
    resolveFirst()
    await flush()

    expect(api.displayRelease.value.id).toBe('R2')
  })

  it('emits rollback for the current release and redeploy otherwise', () => {
    const { emit, api } = setup({
      release: { id: 'R1', deployment_id: 'D1', isCurrent: true },
      visible: false
    })

    api.onSecondaryAction()
    expect(emit).toHaveBeenCalledWith('rollback', expect.objectContaining({ id: 'R1' }))
    expect(api.secondaryButtonLabel.value).toBe('Rollback')
  })

  it('emits an error event when the detail fetch fails', async () => {
    getReleaseByIdService.mockRejectedValue(new Error('boom'))

    const { visible, emit, api } = setup()
    visible.value = true
    await flush()

    expect(emit).toHaveBeenCalledWith('error', expect.any(Error))
    // Detail is cleared, but the drawer still shows the passed-in release
    // (deterministic fallback, never a blank panel).
    expect(api.displayRelease.value).toMatchObject({ id: 'R1' })
    expect(api.isResolvingResources.value).toBe(false)
  })
})

describe('useReleaseDrawerController', () => {
  it('owns visibility and selection through openRelease/closeDrawer', () => {
    const controller = useReleaseDrawerController()

    expect(controller.visible.value).toBe(false)
    expect(controller.selectedRelease.value).toBe(null)

    controller.openRelease({ id: 'R1' })
    expect(controller.visible.value).toBe(true)
    expect(controller.selectedRelease.value).toMatchObject({ id: 'R1' })

    controller.closeDrawer()
    expect(controller.visible.value).toBe(false)
    expect(controller.selectedRelease.value).toBe(null)
  })

  it('ignores openRelease when no release is given', () => {
    const controller = useReleaseDrawerController()

    controller.openRelease(null)
    expect(controller.visible.value).toBe(false)
    expect(controller.selectedRelease.value).toBe(null)
  })

  it('exposes the actionable contract (default off, opt-in on)', () => {
    expect(useReleaseDrawerController().actionable).toBe(false)
    expect(useReleaseDrawerController({ actionable: true }).actionable).toBe(true)
  })
})
