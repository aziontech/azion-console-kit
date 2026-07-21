import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h, inject } from 'vue'
import { resourceUsageService } from '@/services/v2/deployment/resource-usage-service'

/**
 * Task 3.8 — Phase 1: the tabbed landing builds no deploy affordance for
 * versioned-only resources — no `openPromoteDrawer` on the shared
 * `versionMenuHost` — while the deployable default keeps it.
 * Requirement 2.5.
 */

const { routeRef, routerStub } = vi.hoisted(() => ({
  routeRef: { params: { id: '42' } },
  routerStub: { replace: vi.fn(), push: vi.fn() }
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeRef,
  useRouter: () => routerStub
}))
vi.mock('@aziontech/webkit/use-toast', () => ({ useToast: () => ({ add: vi.fn() }) }))
vi.mock('@/services/v2/deployment/resource-usage-service', () => ({
  resourceUsageService: {
    listResourceUsage: vi.fn().mockResolvedValue({ body: [], count: 0 })
  }
}))

import { useResourceVersionLanding } from '@/composables/versioning/use-resource-version-landing'

// Minimal version service: a list query exposing an empty body.
const makeVersionService = () => ({
  useListVersionsQuery: vi.fn(() => ({ data: { value: { body: [] } }, refetch: vi.fn() })),
  createDraft: vi.fn()
})

// Captures the value provided under `versionMenuHost` so we can assert on the
// promote seam without reaching into the composable internals.
const captureMenuHost = (config) => {
  let captured = null
  const HostProbe = {
    setup() {
      captured = inject('versionMenuHost')
      return () => null
    }
  }
  const Harness = {
    setup() {
      const landing = useResourceVersionLanding(config)
      return () => h('div', [h(HostProbe), JSON.stringify(!!landing)])
    }
  }
  const wrapper = mount(Harness)
  return { wrapper, getMenuHost: () => captured }
}

const baseConfig = (resourceType) => ({
  load: vi.fn().mockResolvedValue({ name: 'res' }),
  provideKey: 'resource',
  versionService: makeVersionService(),
  resourceType,
  routeName: 'list-route',
  versionRouteName: 'version-route'
})

beforeEach(() => {
  routerStub.replace.mockClear()
  routerStub.push.mockClear()
  // `useResourceVersionLanding` mounts `useActiveVersions`, whose immediate watcher
  // fires an unawaited `load()` → `resourceUsageService.listResourceUsage` (real
  // deployment-api I/O). Left un-stubbed it hits the network, rejects, and — because
  // the watcher never awaits the promise — surfaces as an ORDER-DEPENDENT unhandled
  // rejection that lands after this test has torn down. Stubbing the external service
  // boundary (not the versioning code under test) makes that fetch resolve
  // deterministically; `flushPromises()` in each test then drains it before teardown.
  vi.spyOn(resourceUsageService, 'listResourceUsage').mockResolvedValue({ body: [], count: 0 })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useResourceVersionLanding — promote seam gated by capability (Req 2.5)', () => {
  it('seams openPromoteDrawer for a deployable resource', async () => {
    const { getMenuHost } = captureMenuHost(baseConfig('edge_application'))
    expect(typeof getMenuHost().openPromoteDrawer).toBe('function')
    // Drain the landing's async resource + active-versions loads before teardown.
    await flushPromises()
  })

  it('omits openPromoteDrawer for a versioned-only resource', async () => {
    const { getMenuHost } = captureMenuHost(baseConfig('function'))
    expect(getMenuHost().openPromoteDrawer).toBeUndefined()
    await flushPromises()
  })

  it('still seams resourceType/versionService/onSuccess for versioned-only', async () => {
    const config = baseConfig('network_list')
    const { getMenuHost } = captureMenuHost(config)
    const host = getMenuHost()
    expect(host.resourceType).toBe('network_list')
    expect(host.versionService).toBe(config.versionService)
    expect(typeof host.onSuccess).toBe('function')
    await flushPromises()
  })
})
