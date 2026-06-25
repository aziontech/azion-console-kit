import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, inject } from 'vue'

/**
 * Task 3.8 — Phase 1: the tabbed landing builds no deploy affordance for
 * versioned-only resources — no `deployResourceContext`, no `openPromoteDrawer`
 * on the shared `versionMenuHost` — while the deployable default keeps both.
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
})

describe('useResourceVersionLanding — promote seam gated by capability (Req 2.5)', () => {
  it('seams openPromoteDrawer for a deployable resource', () => {
    const { getMenuHost } = captureMenuHost(baseConfig('edge_application'))
    expect(typeof getMenuHost().openPromoteDrawer).toBe('function')
  })

  it('omits openPromoteDrawer for a versioned-only resource', () => {
    const { getMenuHost } = captureMenuHost(baseConfig('function'))
    expect(getMenuHost().openPromoteDrawer).toBeUndefined()
  })

  it('still seams resourceType/versionService/onSuccess for versioned-only', () => {
    const config = baseConfig('network_list')
    const { getMenuHost } = captureMenuHost(config)
    const host = getMenuHost()
    expect(host.resourceType).toBe('network_list')
    expect(host.versionService).toBe(config.versionService)
    expect(typeof host.onSuccess).toBe('function')
  })
})

describe('useResourceVersionLanding — deployResourceContext gated by capability (Req 2.5)', () => {
  const getDeployContext = (resourceType) => {
    let landing
    mount({
      setup() {
        landing = useResourceVersionLanding(baseConfig(resourceType))
        return () => null
      }
    })
    return landing.deployResourceContext.value
  }

  it('builds a deploy context for a deployable resource', () => {
    const ctx = getDeployContext('edge_application')
    expect(ctx).not.toBeNull()
    expect(ctx.resourceType).toBe('edge_application')
  })

  it.each(['function', 'network_list', 'waf'])(
    'never builds a deploy context for versioned-only "%s"',
    (resourceType) => {
      expect(getDeployContext(resourceType)).toBeNull()
    }
  )
})
