import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick, ref } from 'vue'

// Functional gate for the DS-first flow (Scenario A of the authoritative
// `vue-preview.html`): when the user selects a Deployment Settings, the Release
// Composition must load — the three uniform resource cards (Application
// *Required*; Firewall + Custom Page with header toggles, default ON), each with
// a Resource selector + a "Version (Ready)" picker defaulting to "latest Ready",
// plus the nested Dependencies (Function/Connector under Application; WAF/
// Network List under Firewall) each showing their empty state + "Add".
//
// This test uses REAL pinia (the store is the single source of truth) and mocks
// ONLY the async composable (returns realistic data) + stubs the router/toast.
// It drives the real `ReleaseCompositionTree`/`ReleaseDependenciesSection`/
// `DeploymentSettingsPicker` so the rendered composition is genuinely exercised.

// --- realistic composable data ------------------------------------------------
// Two deployments carrying `deployment_policy`. The DS under test
// ("storefront-canary", versioned) has an active release pinning
// application/firewall/custom_page + two dependency instances
// (function/network_list) so all three cards are editable (Case 4: versioned)
// and the dependency-seed path is exercised — matching the editable Scenario A.
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

// A single reactive `activeReleaseByDs` so selecting the DS makes the active
// release reachable to the view's `activeReleaseResources` computed.
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
  return {
    useReleaseComposition: ({ selectedDsIds } = {}) => {
      // Mirror the real composable's internal watcher: loading the active release
      // for each newly selected DS on demand (the real one fans out per-DS reads).
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
        isDeploying: ref(false),
        buildAndActivate: vi.fn().mockResolvedValue([]),
        loadActiveRelease,
        dependencyResourcesFor: (dsId) => dependencyResourcesByDs[dsId] ?? {},
        resolveConsumingDsIds: () => [],
        loadCatalog,
        catalogOptionsFor: (type) => CATALOG[type] ?? [],
        isLoadingCatalog: () => false,
        versionOptionsFor: () => READY_VERSIONS,
        isLoadingVersionsFor: () => false
      }
    }
  }
})

// --- router + toast -----------------------------------------------------------
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
    global: {
      stubs: {
        // Stub the heavy/irrelevant peripheral blocks so the test focuses on the
        // composition tree. The DS picker, tree and dependencies are REAL.
        PageHeadingBlock: true,
        CanaryStrategyField: true,
        ImpactPanel: true,
        // Webkit Dropdown renders an overlay we don't need; reduce it to an
        // observable surface that still emits `update:modelValue`.
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

    // Simulate selecting a DS by emitting the picker's update:model-value (the
    // same path the real Checkbox v-model takes).
    picker.vm.$emit('update:modelValue', [SELECTED_DS])
    await flushPromises()
    await nextTick()

    // Composition section + tree render.
    expect(wrapper.find('[data-testid="release-composition__composition"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="release-composition__tree"]').exists()).toBe(true)

    // The three singleton cards.
    expect(findCard(wrapper, 'application').exists()).toBe(true)
    expect(findCard(wrapper, 'firewall').exists()).toBe(true)
    expect(findCard(wrapper, 'custom_page').exists()).toBe(true)

    // Application is Required (tag, no toggle); optional singletons have a toggle.
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

    // Each singleton card exposes its 2-col Resource + Version body.
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

    // Application owns function + connector; Firewall owns waf + network_list.
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

    // An empty dependency group (connector — no inherited instance) shows the
    // "No {type} instances — Add one to include it." empty state + Add button.
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

    // The version field of every singleton card binds LATEST_READY ('LATEST') —
    // the target's "latest Ready" default, NOT the active release's pinned id.
    const versionFields = wrapper.findAllComponents({ name: 'release-resource-version-field' })
    expect(versionFields.length).toBeGreaterThanOrEqual(3)
    versionFields.forEach((field) => {
      expect(field.props('modelValue')).toBe('LATEST')
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
