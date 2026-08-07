/**
 * Coverage-matrix claims (spec versioning-test-coverage / TEST-ARCHITECTURE §3.4).
 * The matrix (tests/coverage-matrix.json) is DERIVED from these markers —
 * run `node scripts/check-coverage-matrix.mjs --write` after changing them.
 * @covers deployment:J8 component partial
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { reactive, ref, computed } from 'vue'

const composePayload = vi.fn(() => ({ resources: [], canary: false, canaryForm: {} }))
const openRelease = vi.fn()
const deployCtx = vi.fn(() => ({ ok: true, canDeploy: true }))

const storeState = reactive({
  deploymentIds: ['ds-1'],
  deployEnabled: true,
  effDsId: 'ds-1',
  resEnabled: {},
  resNames: {},
  resVers: {},
  coll: {},
  collOpen: {},
  activeReleaseByDs: {},
  activeReleaseErrorByDs: {},
  deployments: [{ id: 'ds-1', name: 'production-edge', deployment_policy: 'single_version' }],
  scopedType: null,
  fromVersion: false,
  resourceId: '',
  versionId: '',
  pendingDependencySelections: [],
  versionGateSatisfied: true
})

const storeMock = {
  deployCtx,
  composePayload,
  openRelease,
  setDeployments: vi.fn(),
  setActiveReleaseByDs: vi.fn(),
  setActiveReleaseError: vi.fn(),
  setVersionsByResource: vi.fn(),
  seedVersionsFromRelease: vi.fn(),
  usedDependencyIds: vi.fn(() => new Set()),
  resolveVersion: vi.fn(() => null),
  seedApplicationFunctions: vi.fn(),
  seedApplicationConnectors: vi.fn(),
  seedFirewallFunctions: vi.fn(),
  seedFirewallWafs: vi.fn(),
  seedFirewallNetworkLists: vi.fn(),
  seedCustomPageConnectors: vi.fn(),
  addCollItem: vi.fn(),
  restoreCollVersions: vi.fn(),
  pickDs: vi.fn(),
  toggleCollOpen: vi.fn(),
  setCollResource: vi.fn(),
  setCollVer: vi.fn(),
  removeCollItem: vi.fn(),
  setResName: vi.fn(),
  setResVer: vi.fn(),
  toggleResource: vi.fn(),
  toggleCanary: vi.fn(),
  setCanaryForm: vi.fn()
}
Object.keys(storeState).forEach((key) => {
  Object.defineProperty(storeMock, key, {
    enumerable: true,
    configurable: true,
    get: () => storeState[key],
    set: (value) => {
      storeState[key] = value
    }
  })
})

vi.mock('@/stores/release', () => ({
  useReleaseStore: () => storeMock,
  COLLECTION_TYPES: ['function', 'connector', 'waf', 'network_list'],
  ADDITIONAL_PARENT: 'additional'
}))

vi.mock('pinia', async () => {
  const actual = await vi.importActual('pinia')
  return {
    ...actual,
    storeToRefs: (store) => {
      const keys = [
        'deploymentIds',
        'deployEnabled',
        'effDsId',
        'resEnabled',
        'resNames',
        'resVers',
        'coll',
        'collOpen',
        'activeReleaseByDs',
        'deployments',
        'scopedType',
        'fromVersion',
        'versionId',
        'pendingDependencySelections',
        'versionGateSatisfied'
      ]
      const refs = {}
      keys.forEach((key) => {
        refs[key] = computed({
          get: () => store[key],
          set: (value) => {
            store[key] = value
          }
        })
      })
      return refs
    }
  }
})

const retryImpact = vi.fn()
const buildAndActivate = vi.fn().mockResolvedValue([])
const isDeploying = ref(false)
const impact = ref({ hasSelection: true, impactUnavailable: true, perDs: [], totals: null })
const impactUnavailable = ref(true)

vi.mock('@/templates/release-composition/use-release-composition', () => ({
  useReleaseComposition: () => ({
    deployments: ref([]),
    activeReleaseByDs: ref({}),
    versionsByResource: ref({}),
    impact,
    impactUnavailable,
    retryImpact,
    isDeploying,
    buildAndActivate,
    ensureActiveReleases: vi.fn(),
    activeReleaseErrorByDs: ref({}),
    hasAnyVersionsError: ref(false),
    hasAnyCatalogError: ref(false),
    resolveConsumingDeployments: vi.fn().mockResolvedValue({ deployments: [] }),
    retryActiveReleases: vi.fn(),
    retryCatalogs: vi.fn(),
    retryResourceVersions: vi.fn(),
    dependencyResourcesFor: () => ({}),
    resolveConsumingDsIds: () => [],
    loadCatalog: vi.fn(),
    catalogOptionsFor: () => [],
    isLoadingCatalog: () => false,
    resourceListService: () => vi.fn().mockResolvedValue({ body: [], count: 0 }),
    resourceLoadService: () => vi.fn().mockResolvedValue(null),
    ensureResourceNames: vi.fn(),
    resourceNameFor: () => null,
    versionOptionsFor: () => [],
    isLoadingVersionsFor: () => false
  })
}))

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

vi.mock('@/services/v2/deployment/deployment-adapter', () => ({
  resolveResourceMeta: (type) => ({ label: type, icon: 'pi pi-box' }),
  mapPolicyToLabel: (policy) => (policy === 'versioned_urls' ? 'Versioned URLs' : 'Single Version'),
  DeploymentAdapter: {
    transformReleaseComposition: () => ({ readOnlyResources: [] })
  }
}))

const routerPush = vi.fn()
const routerResolve = vi.fn(() => ({ href: '/deployments' }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {}, params: {} }),
  useRouter: () => ({ push: routerPush, resolve: routerResolve })
}))

const toastAdd = vi.fn()
vi.mock('@aziontech/webkit/use-toast', () => ({ useToast: () => ({ add: toastAdd }) }))

vi.mock('@aziontech/webkit/card', () => ({
  default: {
    name: 'Card',
    template: '<div class="card"><slot name="title" /><slot name="content" /></div>'
  }
}))
vi.mock('@aziontech/webkit/dialog', () => ({
  default: {
    name: 'PrimeDialog',
    props: ['visible'],
    emits: ['update:visible'],
    template: `<div v-if="visible" data-testid="dialog"><slot /><slot name="footer" /></div>`
  }
}))
vi.mock('@aziontech/webkit/button', () => ({
  default: {
    name: 'PrimeButton',
    props: ['label', 'disabled', 'loading'],
    emits: ['click'],
    template: `<button
      :data-testid="$attrs['data-testid']"
      :disabled="disabled"
      @click="$emit('click')"
    >{{ label }}</button>`
  }
}))
vi.mock('@aziontech/webkit/inputswitch', () => ({
  default: { name: 'InputSwitch', props: ['modelValue'], template: '<span class="switch" />' }
}))

vi.mock('@/templates/page-heading-block/index.vue', () => ({
  default: { name: 'PageHeadingBlock', template: '<div data-stub="PageHeadingBlock" />' }
}))
vi.mock('@/templates/release-composition/components/ReleaseCompositionField.vue', () => ({
  default: {
    name: 'ReleaseCompositionField',
    inheritAttrs: true,
    template: '<div :class="$attrs.class" data-stub="ReleaseCompositionField" />'
  }
}))
vi.mock('@/templates/release-composition/components/ReleaseCompositionTree.vue', () => ({
  default: {
    name: 'ReleaseCompositionTree',
    inheritAttrs: true,
    template: '<div :class="$attrs.class" data-stub="ReleaseCompositionTree" />'
  }
}))
vi.mock('@/templates/release-composition/components/ReleaseDependenciesSection.vue', () => ({
  default: {
    name: 'ReleaseDependenciesSection',
    inheritAttrs: true,
    template: '<div :class="$attrs.class" data-stub="ReleaseDependenciesSection" />'
  }
}))
vi.mock('@/templates/release-composition/components/DeploymentSettingsPicker.vue', () => ({
  default: {
    name: 'DeploymentSettingsPicker',
    inheritAttrs: true,
    props: ['groups', 'modelValue', 'query', 'isLoadingMeta', 'metaUnavailable'],
    template: '<div :class="$attrs.class" data-stub="DeploymentSettingsPicker" />'
  }
}))
vi.mock('@/templates/release-composition/components/CanaryStrategyField.vue', () => ({
  default: {
    name: 'CanaryStrategyField',
    inheritAttrs: true,
    template: '<div :class="$attrs.class" data-stub="CanaryStrategyField" />'
  }
}))
vi.mock('@/templates/release-composition/components/ImpactPanel.vue', () => ({
  default: {
    name: 'ImpactPanel',
    inheritAttrs: true,
    template: '<div :class="$attrs.class" data-stub="ImpactPanel" />'
  }
}))

import ReleaseComposerView from '@/views/Deployments/v6/ReleaseComposerView.vue'

const mountView = async () => {
  const wrapper = mount(ReleaseComposerView, { global: { stubs: { teleport: true } } })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  storeState.deploymentIds = ['ds-1']
  storeState.deployEnabled = true
  storeState.scopedType = null
  storeState.resourceId = ''
  storeState.versionId = ''
  isDeploying.value = false
  deployCtx.mockReturnValue({ ok: true, canDeploy: true })
  buildAndActivate.mockResolvedValue([])
  composePayload.mockReturnValue({ resources: [], canary: false, canaryForm: {} })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('ReleaseComposerView — entry', () => {
  it('opens the release from the route on mount (single source of truth)', async () => {
    await mountView()
    expect(openRelease).toHaveBeenCalledTimes(1)
  })
})

describe('ReleaseComposerView — composition blocks', () => {
  it('renders the composition tree and the DS picker, with the Canary block hidden', async () => {
    const wrapper = await mountView()

    expect(wrapper.findComponent({ name: 'ReleaseCompositionTree' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'DeploymentSettingsPicker' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'CanaryStrategyField' }).exists()).toBe(false)
  })
})

describe('ReleaseComposerView — Build & activate gate', () => {
  it('enables Build & activate when deployEnabled and no DS is blocking', async () => {
    const wrapper = await mountView()

    const button = wrapper.find('[data-testid="release-composition__build-and-activate"]')
    expect(button.attributes('disabled')).toBeUndefined()
  })

  it('disables Build & activate when the store gate (deployEnabled) is false', async () => {
    storeState.deployEnabled = false
    const wrapper = await mountView()

    const button = wrapper.find('[data-testid="release-composition__build-and-activate"]')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('disables Build & activate when a selected DS cannot deploy (multi-DS fold)', async () => {
    deployCtx.mockReturnValue({ ok: false, canDeploy: false })
    const wrapper = await mountView()

    const button = wrapper.find('[data-testid="release-composition__build-and-activate"]')
    expect(button.attributes('disabled')).toBeDefined()
  })
})

describe('ReleaseComposerView — confirm + dispatch', () => {
  it('opens the confirm dialog when Build & activate is clicked', async () => {
    const wrapper = await mountView()

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false)

    await wrapper.find('[data-testid="release-composition__build-and-activate"]').trigger('click')

    expect(wrapper.find('[data-testid="release-composition__confirm-dialog"]').exists()).toBe(true)
  })

  it('does not open the confirm dialog while the gate is closed', async () => {
    storeState.deployEnabled = false
    const wrapper = await mountView()

    await wrapper.find('[data-testid="release-composition__build-and-activate"]').trigger('click')

    expect(wrapper.find('[data-testid="release-composition__confirm-dialog"]').exists()).toBe(false)
  })

  it('invokes composition.buildAndActivate(store.composePayload(), dsIds) on confirm', async () => {
    const wrapper = await mountView()

    await wrapper.find('[data-testid="release-composition__build-and-activate"]').trigger('click')
    await wrapper.find('[data-testid="release-composition__confirm-build"]').trigger('click')
    await flushPromises()

    expect(composePayload).toHaveBeenCalledTimes(1)
    expect(buildAndActivate).toHaveBeenCalledTimes(1)
    expect(buildAndActivate).toHaveBeenCalledWith(
      { resources: [], canary: false, canaryForm: {} },
      ['ds-1']
    )
  })

  it('navigates to the first successful DS releases tab after a confirmed dispatch', async () => {
    buildAndActivate.mockResolvedValue([{ id: 'ds-1', ok: true }])
    const wrapper = await mountView()

    await wrapper.find('[data-testid="release-composition__build-and-activate"]').trigger('click')
    await wrapper.find('[data-testid="release-composition__confirm-build"]').trigger('click')
    await flushPromises()

    expect(routerPush).toHaveBeenCalledWith({
      name: 'deployments-edit',
      params: { id: 'ds-1', tab: 'releases' }
    })
  })

  it('does not navigate when every build_and_activate outcome failed', async () => {
    buildAndActivate.mockResolvedValue([
      { id: 'ds-1', ok: false, error: new Error('boom'), errorType: null }
    ])
    const wrapper = await mountView()

    await wrapper.find('[data-testid="release-composition__build-and-activate"]').trigger('click')
    await wrapper.find('[data-testid="release-composition__confirm-build"]').trigger('click')
    await flushPromises()

    expect(routerPush).not.toHaveBeenCalled()
  })

  it('navigates to the first successful DS when an earlier target failed', async () => {
    buildAndActivate.mockResolvedValue([
      { id: 'ds-1', ok: false, error: new Error('boom'), errorType: null },
      { id: 'ds-2', ok: true }
    ])
    const wrapper = await mountView()

    await wrapper.find('[data-testid="release-composition__build-and-activate"]').trigger('click')
    await wrapper.find('[data-testid="release-composition__confirm-build"]').trigger('click')
    await flushPromises()

    expect(routerPush).toHaveBeenCalledWith({
      name: 'deployments-edit',
      params: { id: 'ds-2', tab: 'releases' }
    })
  })
})

describe('ReleaseComposerView — multi-DS progress dialog', () => {
  const selectTwoDs = () => {
    storeState.deploymentIds = ['ds-1', 'ds-2']
    storeState.deployments = [
      { id: 'ds-1', name: 'staging-edge', deployment_policy: 'single_version' },
      { id: 'ds-2', name: 'production-edge', deployment_policy: 'single_version' }
    ]
  }

  const reportAllOk = (payload, ids, opts) => {
    ;(ids ?? []).forEach((id) => opts?.onOutcome?.({ id, ok: true }))
    return Promise.resolve((ids ?? []).map((id) => ({ id, ok: true })))
  }

  const confirmDeploy = async (wrapper) => {
    await wrapper.find('[data-testid="release-composition__build-and-activate"]').trigger('click')
    await wrapper.find('[data-testid="release-composition__confirm-build"]').trigger('click')
    await flushPromises()
  }

  it('opens the progress dialog (no auto-navigation) when confirming a multi-DS release', async () => {
    selectTwoDs()
    buildAndActivate.mockImplementation(reportAllOk)
    const wrapper = await mountView()

    await confirmDeploy(wrapper)

    expect(buildAndActivate).toHaveBeenCalledWith(
      { resources: [], canary: false, canaryForm: {} },
      ['ds-1', 'ds-2'],
      expect.objectContaining({ onOutcome: expect.any(Function) })
    )
    expect(wrapper.find('[data-testid="deployment-progress__dialog"]').exists()).toBe(true)
    expect(routerPush).not.toHaveBeenCalled()
  })

  it('navigates to the first deployment releases tab when closed after full success', async () => {
    selectTwoDs()
    buildAndActivate.mockImplementation(reportAllOk)
    const wrapper = await mountView()

    await confirmDeploy(wrapper)
    await wrapper.find('[data-testid="deployment-progress__close"]').trigger('click')

    expect(routerPush).toHaveBeenCalledWith({
      name: 'deployments-edit',
      params: { id: 'ds-1', tab: 'releases' }
    })
  })

  it('does NOT navigate on close when any DS failed', async () => {
    selectTwoDs()
    buildAndActivate.mockImplementation((payload, ids, opts) => {
      opts?.onOutcome?.({ id: 'ds-1', ok: true })
      opts?.onOutcome?.({ id: 'ds-2', ok: false, error: new Error('boom') })
      return Promise.resolve([
        { id: 'ds-1', ok: true },
        { id: 'ds-2', ok: false }
      ])
    })
    const wrapper = await mountView()

    await confirmDeploy(wrapper)
    await wrapper.find('[data-testid="deployment-progress__close"]').trigger('click')

    expect(routerPush).not.toHaveBeenCalled()
  })
})

describe('ReleaseComposerView — cancel', () => {
  it('navigates back to deployments when Cancel is clicked', async () => {
    const wrapper = await mountView()

    await wrapper.find('[data-testid="release-composition__cancel"]').trigger('click')

    expect(routerPush).toHaveBeenCalledWith({ name: 'deployments-list' })
  })
})

describe('ReleaseComposerView — first-release CTA', () => {
  it('pushes the first-release route carrying the scoped resource seed when the picker asks', async () => {
    storeState.scopedType = 'firewall'
    storeState.resourceId = 'fw-7'
    storeState.versionId = 'v-42'

    const wrapper = await mountView()
    await flushPromises()

    const picker = wrapper.findComponent({ name: 'DeploymentSettingsPicker' })
    picker.vm.$emit('group-action', { groupKey: 'needsFirstRelease', dsId: 'ds-new' })
    await flushPromises()

    expect(routerPush).toHaveBeenCalledWith({
      name: 'release-composer',
      query: {
        deploymentIds: 'ds-new',
        seedType: 'firewall',
        seedResourceId: 'fw-7',
        seedVersionId: 'v-42'
      }
    })
  })
})

describe('ReleaseComposerView — first-release group selectability', () => {
  const withScopedFirstRelease = (scopedType, resourceId) => {
    storeState.scopedType = scopedType
    storeState.resourceId = resourceId
    storeState.deploymentIds = []
    storeState.deployments = [
      { id: 'ds-new', name: 'brand-new-edge', deployment_policy: 'single_version' }
    ]
    storeState.activeReleaseByDs = {}
    storeState.activeReleaseErrorByDs = {}
  }

  const firstReleaseGroupOf = (wrapper) => {
    const picker = wrapper.findComponent({ name: 'DeploymentSettingsPicker' })
    return (picker.props('groups') ?? []).find((group) => group.key === 'needsFirstRelease')
  }

  it('makes the needs-first-release group selectable and drops its CTA under application scope', async () => {
    withScopedFirstRelease('application', 'app-1')

    const wrapper = await mountView()
    await flushPromises()

    const group = firstReleaseGroupOf(wrapper)
    expect(group.deployments.map((deployment) => deployment.id)).toEqual(['ds-new'])
    expect(group.selectable).toBe(true)
    expect(group.action).toBeNull()
    expect(group.notice).toBeNull()
    expect(group.statusTag).toBe('No active release yet')
  })

  it('keeps the needs-first-release group non-selectable with its CTA under firewall scope', async () => {
    withScopedFirstRelease('firewall', 'fw-7')

    const wrapper = await mountView()
    await flushPromises()

    const group = firstReleaseGroupOf(wrapper)
    expect(group.selectable).toBe(false)
    expect(group.action).toEqual({ label: 'Create first release', icon: 'pi pi-arrow-right' })
    expect(group.statusTag).toBe('No active release yet')
  })
})
