import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
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
  versionId: '',
  pendingDependencySelections: [],
  versionGateSatisfied: true
})

const storeMock = {
  deployCtx,
  composePayload,
  openRelease,
  resourceId: '',
  setDeployments: vi.fn(),
  setActiveReleaseByDs: vi.fn(),
  setActiveReleaseError: vi.fn(),
  setVersionsByResource: vi.fn(),
  seedVersionsFromRelease: vi.fn(),
  usedDependencyIds: vi.fn(() => new Set()),
  resolveVersion: vi.fn(() => null),
  restoreCollVersions: vi.fn(),
  seedApplicationFunctions: vi.fn(),
  seedApplicationConnectors: vi.fn(),
  seedFirewallFunctions: vi.fn(),
  seedFirewallWafs: vi.fn(),
  seedFirewallNetworkLists: vi.fn(),
  seedCustomPageConnectors: vi.fn(),
  dependencyResourcesFor: vi.fn(() => ({})),
  pickDs: vi.fn(),
  toggleCollOpen: vi.fn(),
  setCollResource: vi.fn(),
  setCollVer: vi.fn(),
  addCollItem: vi.fn(),
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

vi.mock('@/stores/breadcrumbs', () => ({
  useBreadcrumbs: () => ({ update: vi.fn() })
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

const impactIsLoading = ref(false)
const impactReverseLookupByDs = ref({})
const impactDegradationReason = ref(null)
const impactRetry = vi.fn()

vi.mock('@/templates/release-composition/use-release-impact', () => ({
  useReleaseImpact: () => ({
    reverseLookupByDs: impactReverseLookupByDs,
    dsMetaFor: () => ({}),
    isLoading: impactIsLoading,
    degradationReason: impactDegradationReason,
    retry: impactRetry
  })
}))

const retryImpact = vi.fn()
const buildAndActivate = vi.fn().mockResolvedValue([])
const isDeploying = ref(false)
const impact = ref({ hasSelection: true, impactUnavailable: false, perDs: [], totals: null })
const impactUnavailable = ref(false)

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
    dependencyResourcesFor: () => ({}),
    resolveConsumingDeployments: vi.fn().mockResolvedValue({ deployments: [] }),
    resolveConsumingDsIds: () => [],
    ensureActiveReleases: vi.fn(),
    activeReleaseErrorByDs: ref({}),
    hasAnyVersionsError: ref(false),
    hasAnyCatalogError: ref(false),
    retryActiveReleases: vi.fn(),
    retryCatalogs: vi.fn(),
    retryResourceVersions: vi.fn(),
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

const { quietVersionReady, quietDeps } = await vi.hoisted(async () => {
  const { ref: hoistedRef } = await import('vue')
  return {
    quietVersionReady: () => ({
      isReady: hoistedRef(false),
      isLoading: hoistedRef(false),
      hasError: hoistedRef(false),
      retry: vi.fn()
    }),
    quietDeps: (key) => () => ({
      [key]: hoistedRef([]),
      isLoading: hoistedRef(false),
      hasError: hoistedRef(false),
      retry: vi.fn()
    })
  }
})

vi.mock('@/templates/release-composition/use-application-version-ready', () => ({
  useApplicationVersionReady: quietVersionReady
}))
vi.mock('@/templates/release-composition/use-application-function-dependencies', () => ({
  useApplicationFunctionDependencies: quietDeps('functionDependencies')
}))
vi.mock('@/templates/release-composition/use-application-connector-dependencies', () => ({
  useApplicationConnectorDependencies: quietDeps('connectorDependencies')
}))
vi.mock('@/templates/release-composition/use-firewall-version-ready', () => ({
  useFirewallVersionReady: quietVersionReady
}))
vi.mock('@/templates/release-composition/use-firewall-function-dependencies', () => ({
  useFirewallFunctionDependencies: quietDeps('functionDependencies')
}))
vi.mock('@/templates/release-composition/use-firewall-waf-dependencies', () => ({
  useFirewallWafDependencies: quietDeps('wafDependencies')
}))
vi.mock('@/templates/release-composition/use-firewall-network-list-dependencies', () => ({
  useFirewallNetworkListDependencies: quietDeps('networkListDependencies')
}))
vi.mock('@/templates/release-composition/use-custom-page-version-ready', () => ({
  useCustomPageVersionReady: quietVersionReady
}))
vi.mock('@/templates/release-composition/use-custom-page-connector-dependencies', () => ({
  useCustomPageConnectorDependencies: quietDeps('connectorDependencies')
}))

vi.mock('@/services/v2/release-impact/consuming-deployments', () => ({
  resolveConsumingDeployments: vi.fn().mockResolvedValue({ deployments: [] })
}))

vi.mock('@/services/v2/deployment/deployment-adapter', () => ({
  resolveResourceMeta: (type) => ({ label: type, icon: 'pi pi-box' }),
  mapPolicyToLabel: (policy) => (policy === 'versioned_urls' ? 'Versioned URLs' : 'Single Version')
}))

const routerPush = vi.fn()
const routerResolve = vi.fn(() => ({ href: '/deployments' }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {}, params: {}, meta: {} }),
  useRouter: () => ({ push: routerPush, resolve: routerResolve })
}))

const toastAdd = vi.fn()
vi.mock('@aziontech/webkit/use-toast', () => ({ useToast: () => ({ add: toastAdd }) }))

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

vi.mock('@/templates/content-block', () => ({
  default: {
    name: 'ContentBlock',
    template: '<div><slot name="heading" /><slot name="content" /></div>'
  }
}))
vi.mock('@/templates/page-heading-block/index.vue', () => ({
  default: { name: 'PageHeadingBlock', template: '<div data-stub="PageHeadingBlock" />' }
}))
vi.mock('@/templates/release-composition/components/ReleaseCompositionTree.vue', () => ({
  default: {
    name: 'ReleaseCompositionTree',
    inheritAttrs: true,
    template: '<div :class="$attrs.class" data-stub="ReleaseCompositionTree" />'
  }
}))
vi.mock('@/templates/release-composition/components/DeploymentSettingsPicker.vue', () => ({
  default: {
    name: 'DeploymentSettingsPicker',
    inheritAttrs: true,
    props: ['isLoadingMeta', 'groups', 'modelValue', 'query'],
    template:
      '<div :class="$attrs.class" data-stub="DeploymentSettingsPicker" :data-loading-meta="isLoadingMeta" />'
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

import { flushPromises } from '@vue/test-utils'
import ReleaseComposerView from '@/views/Deployments/v6/ReleaseComposerView.vue'

const mountView = async () => {
  const wrapper = mount(ReleaseComposerView, { global: { stubs: { teleport: true } } })
  await flushPromises()
  return wrapper
}

const deployButton = (wrapper) =>
  wrapper.find('[data-testid="release-composition__build-and-activate"]')

beforeEach(() => {
  storeState.deploymentIds = ['ds-1']
  storeState.deployEnabled = true
  storeState.scopedType = null
  deployCtx.mockReturnValue({ ok: true, canDeploy: true })
  impactIsLoading.value = false
  impactDegradationReason.value = null
  impact.value = { hasSelection: true, impactUnavailable: false, perDs: [], totals: null }
  impactUnavailable.value = false
  isDeploying.value = false
  buildAndActivate.mockResolvedValue([])
  composePayload.mockReturnValue({ resources: [], canary: false, canaryForm: {} })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('ReleaseComposerView — impact state never gates the Deploy button (Property 4 / req 5.4)', () => {
  it('keeps Deploy enabled while the impact is LOADING (and propagates is-loading-meta to the picker)', async () => {
    impactIsLoading.value = true
    const wrapper = await mountView()

    expect(deployButton(wrapper).attributes('disabled')).toBeUndefined()

    const picker = wrapper.findComponent({ name: 'DeploymentSettingsPicker' })
    expect(picker.exists()).toBe(true)
    expect(picker.props('isLoadingMeta')).toBe(true)
  })

  it('keeps Deploy enabled when the impact is PARTIAL (capped / degraded)', async () => {
    impactUnavailable.value = false
    impactDegradationReason.value = 'capped'
    impact.value = { hasSelection: true, impactUnavailable: false, perDs: [], totals: null }

    const wrapper = await mountView()

    expect(deployButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('keeps Deploy enabled when the impact is UNAVAILABLE (fetch failed)', async () => {
    impactUnavailable.value = true
    impactDegradationReason.value = 'fetch_failed'
    impact.value = { hasSelection: true, impactUnavailable: true, perDs: [], totals: null }

    const wrapper = await mountView()

    expect(deployButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('disables Deploy only when PUBLISHING is closed — proving the gate ignores impact', async () => {
    storeState.deployEnabled = false
    const closedGate = await mountView()
    expect(deployButton(closedGate).attributes('disabled')).toBeDefined()

    storeState.deployEnabled = true
    deployCtx.mockReturnValue({ ok: false, canDeploy: false })
    const blockingDs = await mountView()
    expect(deployButton(blockingDs).attributes('disabled')).toBeDefined()
  })
})
