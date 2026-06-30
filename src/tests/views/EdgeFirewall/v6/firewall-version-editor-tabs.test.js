import { defineComponent, ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import VersionEditorTabs from '@/views/EdgeFirewall/v6/tabs/VersionEditorTabs.vue'

// The Functions Instances tab is gated by the VERSION config (edgeFunctionsEnabled),
// read from the same useLoadVersionQuery the shell uses. After a SAVE the service
// removes (does not refetch) the version cache, so the tab component refetches the
// gating query on `command-success` to stay reactive without a remount.

const FIREWALL_ID = '101'
const VERSION_ID = 'AVFW0001'

const mocks = vi.hoisted(() => ({ query: null }))

vi.mock('vue-router', () => ({ useRoute: () => ({ params: { id: FIREWALL_ID } }) }))

vi.mock('@/services/v2/edge-firewall/edge-firewall-version-service', () => ({
  edgeFirewallVersionService: {
    useLoadVersionQuery: () => mocks.query
  }
}))

vi.mock('@/views/EdgeFirewall/v6/tabs/use-versioned-facades', () => ({
  useVersionedFacades: () => ({
    functions: {
      list: vi.fn(),
      load: vi.fn(),
      create: vi.fn(),
      edit: vi.fn(),
      remove: vi.fn()
    },
    rulesEngine: {
      listEdgeFirewallRulesEngineService: vi.fn(),
      createEdgeFirewallRulesEngineService: vi.fn(),
      editEdgeFirewallRulesEngineService: vi.fn(),
      loadEdgeFirewallRulesEngineService: vi.fn(),
      reorderEdgeFirewallRulesEngineService: vi.fn(),
      deleteEdgeFirewallRulesEngineService: vi.fn()
    }
  })
}))

vi.mock('@/composables/versioning/use-deploy-resource-context', () => ({
  useDeployResourceContext: () => ({ resourceContext: ref(null) })
}))

let capturedTabs = []
const ShellStub = defineComponent({
  name: 'VersionEditorTabsShell',
  props: [
    'tabs',
    'resourceId',
    'versionId',
    'adapter',
    'useVersionQuery',
    'resourceContext',
    'testidPrefix'
  ],
  emits: ['command-success', 'command-error', 'cancel'],
  setup(props) {
    return () => {
      capturedTabs = props.tabs
      return null
    }
  }
})

beforeEach(() => {
  capturedTabs = []
  mocks.query = { data: ref({ config: {} }), refetch: vi.fn() }
})

afterEach(() => {
  vi.restoreAllMocks()
})

const mountTabs = (firewall = { id: FIREWALL_ID, name: 'fw', edgeFunctionsEnabled: false }) =>
  mount(VersionEditorTabs, {
    props: { firewall, resourceId: FIREWALL_ID, versionId: VERSION_ID },
    global: { stubs: { VersionEditorTabsShell: ShellStub } }
  })

describe('EdgeFirewall v6 — Functions Instances tab gating', () => {
  it('hides the Functions Instances tab when the module is disabled', () => {
    mocks.query.data.value = { config: { edgeFunctionsEnabled: false } }
    mountTabs()
    expect(capturedTabs.map((tab) => tab.key)).not.toContain('functions')
  })

  it('shows the Functions Instances tab when the version config enables the module', () => {
    mocks.query.data.value = { config: { edgeFunctionsEnabled: true } }
    mountTabs()
    const functionsTab = capturedTabs.find((tab) => tab.key === 'functions')
    expect(functionsTab).toBeTruthy()
    expect(functionsTab.label).toBe('Functions Instances')
  })

  it('reacts when the saved module flag flips', async () => {
    mocks.query.data.value = { config: { edgeFunctionsEnabled: false } }
    mountTabs()
    expect(capturedTabs.map((tab) => tab.key)).not.toContain('functions')

    mocks.query.data.value = { config: { edgeFunctionsEnabled: true } }
    await nextTick()
    expect(capturedTabs.map((tab) => tab.key)).toContain('functions')
  })
})

describe('EdgeFirewall v6 — post-save reactivity', () => {
  it('refetches the gating query when a SAVE command succeeds', () => {
    const wrapper = mountTabs()
    wrapper.findComponent(ShellStub).vm.$emit('command-success', { action: 'SAVE' })
    expect(mocks.query.refetch).toHaveBeenCalledTimes(1)
  })

  it('forwards command-success to the parent', () => {
    const wrapper = mountTabs()
    wrapper.findComponent(ShellStub).vm.$emit('command-success', { action: 'SAVE' })
    expect(wrapper.emitted('command-success')?.[0]).toEqual([{ action: 'SAVE' }])
  })

  it('does not refetch for non-SAVE commands', () => {
    const wrapper = mountTabs()
    wrapper.findComponent(ShellStub).vm.$emit('command-success', { action: 'DELETE' })
    expect(mocks.query.refetch).not.toHaveBeenCalled()
  })
})

describe('EdgeFirewall v6 — Rules Engine module propagation', () => {
  const rulesTab = () => capturedTabs.find((tab) => tab.key === 'rules-engine')

  it('passes enabledModules built from the version config to the Rules Engine tab', () => {
    mocks.query.data.value = {
      config: {
        wafEnabled: true,
        networkProtectionEnabled: true,
        edgeFunctionsEnabled: false,
        debugRules: false
      }
    }
    mountTabs({ id: FIREWALL_ID, name: 'fw', wafEnabled: false })

    expect(rulesTab().props.enabledModules).toEqual({
      webApplicationFirewall: true,
      networkProtectionLayer: true,
      edgeFunctions: false,
      debugRules: false
    })
  })

  it('falls back to the parent firewall flag when the version config omits it', () => {
    mocks.query.data.value = { config: {} }
    mountTabs({ id: FIREWALL_ID, name: 'fw', wafEnabled: true })

    expect(rulesTab().props.enabledModules.webApplicationFirewall).toBe(true)
  })

  it('reacts to a saved WAF toggle without a remount', async () => {
    mocks.query.data.value = { config: { wafEnabled: false } }
    mountTabs({ id: FIREWALL_ID, name: 'fw', wafEnabled: false })
    expect(rulesTab().props.enabledModules.webApplicationFirewall).toBe(false)

    mocks.query.data.value = { config: { wafEnabled: true } }
    await nextTick()
    expect(rulesTab().props.enabledModules.webApplicationFirewall).toBe(true)
  })
})
