import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick, ref } from 'vue'

const DEPLOYMENTS = [
  { id: 'storefront-canary', name: 'storefront-canary', deployment_policy: 'versioned_urls' },
  { id: 'magalu-storefront', name: 'magalu-storefront', deployment_policy: 'single_version' }
]
const SELECTED_DS = 'storefront-canary'

const ACTIVE_RELEASE = {
  resources: [
    { resource_type: 'application', global_id: 'app-1', version_id: '093A6278' },
    { resource_type: 'firewall', resource_id: 'fw-1', version_id: '0C2F1A90' },
    { resource_type: 'custom_page', resource_id: 'cp-1', version_id: '0D8B22E1' },
    { resource_type: 'function', resource_id: 'fn-1', version_id: '0A91FE34' },
    { resource_type: 'network_list', resource_id: 'nl-1', version_id: '0E110001' }
  ]
}

const READY_VERSIONS = [
  { label: '093A6278', value: '093A6278', isCurrent: true, createdAt: null, author: 'guilherme' },
  { label: '0F3A6BEA', value: '0F3A6BEA', isCurrent: false, createdAt: null, author: 'maria' }
]

const CATALOG = {
  application: [{ label: 'version app', value: 'app-1' }],
  firewall: [{ label: 'magalu-waf', value: 'fw-1' }],
  custom_page: [{ label: 'magalu-errors', value: 'cp-1' }],
  function: [{ label: 'auth-edge', value: 'fn-1' }],
  connector: [{ label: 's3-connector', value: 'conn-1' }],
  waf: [{ label: 'owasp-rules', value: 'waf-1' }],
  network_list: [{ label: 'blocklist-br', value: 'nl-1' }]
}

const activeReleaseByDs = ref({})

const dependencyResourcesByDs = {
  [SELECTED_DS]: {
    function: [{ resourceId: 'fn-1', version: '0A91FE34' }],
    connector: [],
    waf: [],
    network_list: [{ resourceId: 'nl-1', version: '0E110001' }]
  }
}

const loadCatalog = vi.fn()
const loadActiveRelease = vi.fn((dsId) => {
  activeReleaseByDs.value = { ...activeReleaseByDs.value, [dsId]: ACTIVE_RELEASE }
})

vi.mock('@/templates/release-composition/use-release-composition', async () => {
  const { watch, toValue } = await import('vue')
  const listServiceCache = {}
  const listServiceFor = (type) => {
    if (!listServiceCache[type]) {
      listServiceCache[type] = async () => ({
        body: (CATALOG[type] ?? []).map((option) => ({ id: option.value, name: option.label })),
        count: (CATALOG[type] ?? []).length
      })
    }
    return listServiceCache[type]
  }
  const nameFor = (type, id) =>
    (CATALOG[type] ?? []).find((option) => String(option.value) === String(id))?.label ?? null
  return {
    useReleaseComposition: ({ selectedDsIds } = {}) => {
      watch(
        () => (toValue(selectedDsIds) ?? []).map(String).join('|'),
        () => {
          ;(toValue(selectedDsIds) ?? []).forEach((id) => loadActiveRelease(id))
        },
        { immediate: true }
      )

      return {
        deployments: ref(DEPLOYMENTS),
        activeReleaseByDs,
        versionsByResource: ref({}),
        impact: ref({ hasSelection: true, impactUnavailable: true, perDs: [], totals: null }),
        impactUnavailable: ref(true),
        retryImpact: vi.fn(),
        activeReleaseErrorByDs: ref({}),
        hasAnyVersionsError: ref(false),
        hasAnyCatalogError: ref(false),
        resolveConsumingDeployments: vi.fn().mockResolvedValue({ deployments: [] }),
        retryActiveReleases: vi.fn(),
        retryCatalogs: vi.fn(),
        retryResourceVersions: vi.fn(),
        isDeploying: ref(false),
        buildAndActivate: vi.fn().mockResolvedValue([]),
        loadActiveRelease,
        ensureActiveReleases: (ids) =>
          (Array.isArray(ids) ? ids : []).forEach((id) => loadActiveRelease(id)),
        dependencyResourcesFor: (dsId) => dependencyResourcesByDs[dsId] ?? {},
        resolveConsumingDsIds: () => [],
        loadCatalog,
        catalogOptionsFor: (type) => CATALOG[type] ?? [],
        isLoadingCatalog: () => false,
        resourceListService: listServiceFor,
        resourceLoadService: (type) => async (id) => {
          const option = (CATALOG[type] ?? []).find((entry) => String(entry.value) === String(id))
          return option ? { id: option.value, name: option.label } : null
        },
        ensureResourceNames: vi.fn(),
        resourceNameFor: nameFor,
        versionOptionsFor: () => READY_VERSIONS,
        isLoadingVersionsFor: () => false
      }
    }
  }
})

vi.mock('@/templates/release-composition/use-release-impact', async () => {
  const { ref, computed } = await import('vue')
  return {
    useReleaseImpact: () => ({
      reverseLookupByDs: ref({}),
      dsMetaFor: () => ({}),
      activeVersionHintFor: () => null,
      isLoading: ref(false),
      isPartial: computed(() => false),
      degradationReason: computed(() => null),
      retry: vi.fn()
    })
  }
})

vi.mock('@/templates/release-composition/use-application-function-dependencies', async () => {
  const { ref } = await import('vue')
  return {
    useApplicationFunctionDependencies: () => ({
      functionDependencies: ref([]),
      isModuleEnabled: ref(false),
      isLoading: ref(false),
      hasError: ref(false),
      retry: vi.fn()
    })
  }
})

vi.mock('@/templates/release-composition/use-application-connector-dependencies', async () => {
  const { ref } = await import('vue')
  return {
    useApplicationConnectorDependencies: () => ({
      connectorDependencies: ref([]),
      isLoading: ref(false),
      hasError: ref(false),
      retry: vi.fn()
    })
  }
})

vi.mock('@/templates/release-composition/use-application-version-ready', async () => {
  const { ref } = await import('vue')
  return {
    useApplicationVersionReady: () => ({
      isReady: ref(true),
      isLoading: ref(false),
      hasError: ref(false),
      retry: vi.fn()
    })
  }
})
vi.mock('@/templates/release-composition/use-firewall-version-ready', async () => {
  const { ref } = await import('vue')
  return {
    useFirewallVersionReady: () => ({
      isReady: ref(true),
      isLoading: ref(false),
      hasError: ref(false),
      retry: vi.fn()
    })
  }
})
vi.mock('@/templates/release-composition/use-custom-page-version-ready', async () => {
  const { ref } = await import('vue')
  return {
    useCustomPageVersionReady: () => ({
      isReady: ref(true),
      isLoading: ref(false),
      hasError: ref(false),
      retry: vi.fn()
    })
  }
})
vi.mock('@/templates/release-composition/use-firewall-function-dependencies', async () => {
  const { ref } = await import('vue')
  return {
    useFirewallFunctionDependencies: () => ({
      functionDependencies: ref([]),
      isModuleEnabled: ref(false),
      isLoading: ref(false),
      hasError: ref(false),
      retry: vi.fn()
    })
  }
})
vi.mock('@/templates/release-composition/use-firewall-waf-dependencies', async () => {
  const { ref } = await import('vue')
  return {
    useFirewallWafDependencies: () => ({
      wafDependencies: ref([]),
      isLoading: ref(false),
      hasError: ref(false),
      retry: vi.fn()
    })
  }
})
vi.mock('@/templates/release-composition/use-firewall-network-list-dependencies', async () => {
  const { ref } = await import('vue')
  return {
    useFirewallNetworkListDependencies: () => ({
      networkListDependencies: ref([]),
      isLoading: ref(false),
      hasError: ref(false),
      retry: vi.fn()
    })
  }
})
vi.mock('@/templates/release-composition/use-custom-page-connector-dependencies', async () => {
  const { ref } = await import('vue')
  return {
    useCustomPageConnectorDependencies: () => ({
      connectorDependencies: ref([]),
      isLoading: ref(false),
      hasError: ref(false),
      retry: vi.fn()
    })
  }
})

const routerPush = vi.fn()
const routerResolve = vi.fn(() => ({ href: '/deployments' }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {}, params: {} }),
  useRouter: () => ({ push: routerPush, resolve: routerResolve })
}))

vi.mock('@aziontech/webkit/use-toast', () => ({ useToast: () => ({ add: vi.fn() }) }))

import ReleaseComposerView from '@/views/Deployments/v6/ReleaseComposerView.vue'

const findCard = (wrapper, type) =>
  wrapper.find(`[data-testid="release-composition__card-${type}"]`)

const mountView = () =>
  mount(ReleaseComposerView, {
    attachTo: document.body,
    global: {
      stubs: {
        PageHeadingBlock: true,
        CanaryStrategyField: true,
        ImpactPanel: true,
        Dropdown: {
          name: 'Dropdown',
          props: ['modelValue', 'options', 'disabled', 'placeholder'],
          emits: ['update:modelValue'],
          template:
            '<div class="dropdown-stub" :data-disabled="disabled" :data-model="modelValue" />'
        }
      }
    }
  })

beforeEach(() => {
  setActivePinia(createPinia())
  activeReleaseByDs.value = {}
  loadCatalog.mockClear()
  loadActiveRelease.mockClear()
  routerPush.mockClear()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('ReleaseComposerView — DS-first flow (Scenario A)', () => {
  it('does not render the composition before a DS is selected', () => {
    const wrapper = mountView()
    expect(wrapper.find('[data-testid="release-composition__composition"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="release-composition__tree"]').exists()).toBe(false)
  })

  it('loads the 3 uniform resource cards when a DS is selected', async () => {
    const wrapper = mountView()

    const picker = wrapper.findComponent({ name: 'release-deployment-settings-picker' })
    expect(picker.exists()).toBe(true)

    picker.vm.$emit('update:modelValue', [SELECTED_DS])
    await flushPromises()
    await nextTick()

    expect(wrapper.find('[data-testid="release-composition__composition"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="release-composition__tree"]').exists()).toBe(true)

    expect(findCard(wrapper, 'application').exists()).toBe(true)
    expect(findCard(wrapper, 'firewall').exists()).toBe(true)
    expect(findCard(wrapper, 'custom_page').exists()).toBe(true)

    expect(
      wrapper.find('[data-testid="release-composition__tag-required-application"]').exists()
    ).toBe(true)
    expect(wrapper.find('[data-testid="release-composition__toggle-firewall"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="release-composition__toggle-custom_page"]').exists()).toBe(
      true
    )
  })

  it('renders the Resource + Version fields for each card', async () => {
    const wrapper = mountView()

    wrapper
      .findComponent({ name: 'release-deployment-settings-picker' })
      .vm.$emit('update:modelValue', [SELECTED_DS])
    await flushPromises()
    await nextTick()

    ;['application', 'firewall', 'custom_page'].forEach((type) => {
      expect(wrapper.find(`[data-testid="release-composition__fields-${type}"]`).exists()).toBe(
        true
      )
    })
  })

  it('renders the nested Dependencies groups under Application and Firewall', async () => {
    const wrapper = mountView()

    wrapper
      .findComponent({ name: 'release-deployment-settings-picker' })
      .vm.$emit('update:modelValue', [SELECTED_DS])
    await flushPromises()
    await nextTick()

    expect(wrapper.find('[data-testid="release-composition__deps-application"]').exists()).toBe(
      true
    )
    expect(wrapper.find('[data-testid="release-composition__deps-group-function"]').exists()).toBe(
      true
    )
    expect(wrapper.find('[data-testid="release-composition__deps-group-connector"]').exists()).toBe(
      true
    )
    expect(wrapper.find('[data-testid="release-composition__deps-firewall"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="release-composition__deps-group-waf"]').exists()).toBe(true)
    expect(
      wrapper.find('[data-testid="release-composition__deps-group-network_list"]').exists()
    ).toBe(true)

    const connectorAdd = wrapper.find('[data-testid="release-composition__deps-add-connector"]')
    expect(connectorAdd.exists()).toBe(true)
  })

  it('defaults the Version picker to "latest Ready" (LATEST sentinel) on a fresh DS-first selection', async () => {
    const wrapper = mountView()

    wrapper
      .findComponent({ name: 'release-deployment-settings-picker' })
      .vm.$emit('update:modelValue', [SELECTED_DS])
    await flushPromises()
    await nextTick()

    ;['application', 'firewall', 'custom_page'].forEach((type) => {
      const card = findCard(wrapper, type)
      expect(card.exists()).toBe(true)
      const versionField = card.findComponent({ name: 'release-resource-version-field' })
      expect(versionField.exists()).toBe(true)
      expect(versionField.props('modelValue')).toBe('LATEST')
    })
  })

  it('primes the instance catalog for all 3 singletons once a DS is selected', async () => {
    const wrapper = mountView()

    wrapper
      .findComponent({ name: 'release-deployment-settings-picker' })
      .vm.$emit('update:modelValue', [SELECTED_DS])
    await flushPromises()
    await nextTick()

    const loadedTypes = loadCatalog.mock.calls.map((call) => call[0])
    expect(loadedTypes).toContain('application')
    expect(loadedTypes).toContain('firewall')
    expect(loadedTypes).toContain('custom_page')
  })
})
