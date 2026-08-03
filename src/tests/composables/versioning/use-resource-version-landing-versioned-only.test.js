// @vitest-environment jsdom -- browser-coupled: document — lifecycle composable driven through a host-component mount
/**
 * Coverage-matrix claims (spec versioning-test-coverage / TEST-ARCHITECTURE §3.4).
 * The matrix (tests/coverage-matrix.json) is DERIVED from these markers —
 * run `node scripts/check-coverage-matrix.mjs --write` after changing them.
 * @covers application:J8 component
 * @covers function,network_list,waf:J8 n/a
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h, inject } from 'vue'
import { resourceUsageService } from '@/services/v2/deployment/resource-usage-service'

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

const makeVersionService = () => ({
  useListVersionsQuery: vi.fn(() => ({ data: { value: { body: [] } }, refetch: vi.fn() })),
  createDraft: vi.fn()
})

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
  vi.spyOn(resourceUsageService, 'listResourceUsage').mockResolvedValue({ body: [], count: 0 })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useResourceVersionLanding — promote seam gated by capability (Req 2.5)', () => {
  it('seams openPromoteDrawer for a deployable resource', async () => {
    const { getMenuHost } = captureMenuHost(baseConfig('edge_application'))
    expect(typeof getMenuHost().openPromoteDrawer).toBe('function')
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
