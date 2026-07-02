import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { reactive, ref, computed } from 'vue'

// ReleaseComposerView is a THIN view: the store is the single source of truth and
// the composable does the async loads. This suite keeps BOTH mocked so it tests
// only the view's own job — layout/order of the composition blocks, the
// Build & activate gate, the confirm dialog, and dispatching buildAndActivate on
// confirm. Router + toast are stubbed; webkit/child components are reduced to the
// observable surface (button, dialog visibility, order class).

// --- store mock: a reactive state + spy actions + a tunable gate -------------
// The dispatch (`buildAndActivate`) and its `isDeploying` flag moved to the
// COMPOSABLE (the layer allowed to call services); the store now only describes
// the selection via a pure `composePayload()`. The view calls
// `composition.buildAndActivate(store.composePayload(), targetDsIds)`.
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
  deployments: [{ id: 'ds-1', name: 'production-edge', deployment_policy: 'single_version' }],
  scopedType: null,
  versionId: '',
  pendingDependencySelections: []
})

// The store mock delegates every state key back to the SAME reactive
// `storeState` (not a spread snapshot) so mutating `storeState` in a test is
// observed by the view through both `storeToRefs` and direct `store.x` reads.
const storeMock = {
  deployCtx,
  composePayload,
  openRelease,
  setDeployments: vi.fn(),
  setActiveReleaseByDs: vi.fn(),
  setVersionsByResource: vi.fn(),
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
  COLLECTION_TYPES: ['function', 'connector', 'waf', 'network_list']
}))

// storeToRefs is only used to destructure reactive state; return live refs onto
// the same reactive object so the view stays in sync with our mutations.
// `defineStore` is passed through to the real implementation so other stores in
// the import chain (e.g. `stores/account` via `convert-date`) still construct.
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
        'versionId',
        'pendingDependencySelections'
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

// --- composable mock: degraded impact by default + the seams the view reads ---
// `buildAndActivate` + `isDeploying` now live HERE (the composable owns dispatch).
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
    dependencyResourcesFor: () => ({}),
    resolveConsumingDsIds: () => [],
    loadCatalog: vi.fn(),
    catalogOptionsFor: () => [],
    isLoadingCatalog: () => false,
    versionOptionsFor: () => [],
    isLoadingVersionsFor: () => false
  })
}))

// --- adapter mock: pure mapping, no HTTP --------------------------------------
vi.mock('@/services/v2/deployment/deployment-adapter', () => ({
  resolveResourceMeta: (type) => ({ label: type, icon: 'pi pi-box' }),
  mapPolicyToLabel: (policy) => (policy === 'versioned_urls' ? 'Versioned URLs' : 'Single Version'),
  DeploymentAdapter: {
    transformReleaseComposition: () => ({ readOnlyResources: [] })
  }
}))

// --- router + toast -----------------------------------------------------------
const routerPush = vi.fn()
const routerResolve = vi.fn(() => ({ href: '/deployments' }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {}, params: {} }),
  useRouter: () => ({ push: routerPush, resolve: routerResolve })
}))

const toastAdd = vi.fn()
vi.mock('@aziontech/webkit/use-toast', () => ({ useToast: () => ({ add: toastAdd }) }))

// --- webkit + child components reduced to the observable surface --------------
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

// `vi.mock` factories are hoisted above all top-level declarations, so each stub
// is defined inline (no shared closure variable). `inheritAttrs` keeps the
// `order-N`/`class` bindings the view passes through on the stub root so the
// composition order is assertable.
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

const mountView = () => mount(ReleaseComposerView, { global: { stubs: { teleport: true } } })

beforeEach(() => {
  storeState.deploymentIds = ['ds-1']
  storeState.deployEnabled = true
  storeState.scopedType = null
  isDeploying.value = false
  deployCtx.mockReturnValue({ ok: true, canDeploy: true })
  // `clearAllMocks` (afterEach) wipes implementations too; re-arm the resolved
  // value so `confirmBuildAndActivate` always gets an iterable outcome list, and
  // re-arm the pure payload the view hands to the composable on confirm.
  buildAndActivate.mockResolvedValue([])
  composePayload.mockReturnValue({ resources: [], canary: false, canaryForm: {} })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('ReleaseComposerView — entry', () => {
  it('opens the release from the route on mount (single source of truth)', () => {
    mountView()
    expect(openRelease).toHaveBeenCalledTimes(1)
  })
})

describe('ReleaseComposerView — composition order (flex order)', () => {
  it('places composition first, the DS picker second and Canary last', () => {
    const wrapper = mountView()

    const composition = wrapper.findComponent({ name: 'ReleaseCompositionField' })
    const picker = wrapper.findComponent({ name: 'DeploymentSettingsPicker' })
    const canary = wrapper.findComponent({ name: 'CanaryStrategyField' })

    expect(composition.exists()).toBe(true)
    expect(picker.exists()).toBe(true)
    expect(canary.exists()).toBe(true)

    expect(composition.classes()).toContain('order-1')
    expect(picker.classes()).toContain('order-2')
    expect(canary.classes()).toContain('order-3')
  })
})

describe('ReleaseComposerView — Build & activate gate', () => {
  it('enables Build & activate when deployEnabled and no DS is blocking', () => {
    const wrapper = mountView()

    const button = wrapper.find('[data-testid="release-composition__build-and-activate"]')
    expect(button.attributes('disabled')).toBeUndefined()
  })

  it('disables Build & activate when the store gate (deployEnabled) is false', () => {
    storeState.deployEnabled = false
    const wrapper = mountView()

    const button = wrapper.find('[data-testid="release-composition__build-and-activate"]')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('disables Build & activate when a selected DS cannot deploy (multi-DS fold)', () => {
    deployCtx.mockReturnValue({ ok: false, canDeploy: false })
    const wrapper = mountView()

    const button = wrapper.find('[data-testid="release-composition__build-and-activate"]')
    expect(button.attributes('disabled')).toBeDefined()
  })
})

describe('ReleaseComposerView — confirm + dispatch', () => {
  it('opens the confirm dialog when Build & activate is clicked', async () => {
    const wrapper = mountView()

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false)

    await wrapper.find('[data-testid="release-composition__build-and-activate"]').trigger('click')

    expect(wrapper.find('[data-testid="release-composition__confirm-dialog"]').exists()).toBe(true)
  })

  it('does not open the confirm dialog while the gate is closed', async () => {
    storeState.deployEnabled = false
    const wrapper = mountView()

    await wrapper.find('[data-testid="release-composition__build-and-activate"]').trigger('click')

    expect(wrapper.find('[data-testid="release-composition__confirm-dialog"]').exists()).toBe(false)
  })

  it('invokes composition.buildAndActivate(store.composePayload(), dsIds) on confirm', async () => {
    const wrapper = mountView()

    await wrapper.find('[data-testid="release-composition__build-and-activate"]').trigger('click')
    await wrapper.find('[data-testid="release-composition__confirm-build"]').trigger('click')
    await flushPromises()

    // The view hands the composable the store's PURE payload and the target ids;
    // the composable (not the store) owns the per-DS dispatch.
    expect(composePayload).toHaveBeenCalledTimes(1)
    expect(buildAndActivate).toHaveBeenCalledTimes(1)
    expect(buildAndActivate).toHaveBeenCalledWith(
      { resources: [], canary: false, canaryForm: {} },
      ['ds-1']
    )
  })

  it('navigates to the first DS releases tab after a confirmed dispatch', async () => {
    const wrapper = mountView()

    await wrapper.find('[data-testid="release-composition__build-and-activate"]').trigger('click')
    await wrapper.find('[data-testid="release-composition__confirm-build"]').trigger('click')
    await flushPromises()

    expect(routerPush).toHaveBeenCalledWith({
      name: 'deployments-edit',
      params: { id: 'ds-1', tab: 'releases' }
    })
  })
})

describe('ReleaseComposerView — cancel', () => {
  it('navigates back to deployments when Cancel is clicked', async () => {
    const wrapper = mountView()

    await wrapper.find('[data-testid="release-composition__cancel"]').trigger('click')

    expect(routerPush).toHaveBeenCalledWith({ name: 'deployments' })
  })
})
