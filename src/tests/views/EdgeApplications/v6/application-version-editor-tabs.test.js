import { defineComponent, ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'
import VersionEditorTabs from '@/views/EdgeApplications/v6/tabs/VersionEditorTabs.vue'

const RESOURCE_ID = '77'
const VERSION_ID = 'AV0001'

const mocks = vi.hoisted(() => ({ query: null }))

vi.mock('vue-router', () => ({ useRoute: () => ({ params: { id: RESOURCE_ID } }) }))

let capturedTabs = []
const ShellStub = defineComponent({
  name: 'VersionEditorTabsShell',
  props: [
    'tabs',
    'resourceId',
    'versionId',
    'resource',
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
  vi.spyOn(edgeAppVersionService, 'useLoadVersionQuery').mockImplementation(() => mocks.query)
  vi.spyOn(edgeAppVersionService, 'useListVersionsQuery').mockReturnValue({
    data: ref({ body: [] })
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

const mountTabs = (application = { id: RESOURCE_ID, name: 'app', edgeFunctionsEnabled: false }) =>
  mount(VersionEditorTabs, {
    props: { application, resourceId: RESOURCE_ID, versionId: VERSION_ID },
    global: { stubs: { VersionEditorTabsShell: ShellStub } }
  })

const tabKeys = () => capturedTabs.map((tab) => tab.key)
const tabByKey = (key) => capturedTabs.find((tab) => tab.key === key)

describe('Application v6 — Functions tab gating is driven by the VERSION, not the live Application', () => {
  it('hides Functions when the VERSION module is off even though the live Application has it on', () => {
    mocks.query.data.value = {
      config: { edgeFunctionsEnabled: false, applicationAcceleratorEnabled: true }
    }
    mountTabs({ id: RESOURCE_ID, name: 'app', edgeFunctionsEnabled: true })
    expect(tabKeys()).not.toContain('functions')
  })

  it('shows Functions when the VERSION config enables the module', () => {
    mocks.query.data.value = { config: { edgeFunctionsEnabled: true } }
    mountTabs()
    const functionsTab = tabByKey('functions')
    expect(functionsTab).toBeTruthy()
    expect(functionsTab.label).toBe('Functions')
  })

  it('reacts when the saved module flag flips without a remount', async () => {
    mocks.query.data.value = { config: { edgeFunctionsEnabled: false } }
    mountTabs()
    expect(tabKeys()).not.toContain('functions')

    mocks.query.data.value = { config: { edgeFunctionsEnabled: true } }
    await nextTick()
    expect(tabKeys()).toContain('functions')
  })
})

describe('Application v6 — base tabs always present and ordered', () => {
  it('renders the base tabs in order when Functions is off', () => {
    mocks.query.data.value = { config: { edgeFunctionsEnabled: false } }
    mountTabs()
    expect(tabKeys()).toEqual(['main-settings', 'cache-settings', 'device-groups', 'rules-engine'])
  })

  it('inserts Functions before Rules Engine when the module is on', () => {
    mocks.query.data.value = { config: { edgeFunctionsEnabled: true } }
    mountTabs()
    expect(tabKeys()).toEqual([
      'main-settings',
      'cache-settings',
      'device-groups',
      'functions',
      'rules-engine'
    ])
  })
})

describe('Application v6 — tabs receive the versioned facade service and the ids', () => {
  it('passes the ids and the cache-settings facade (CRUDL shape) to the Cache Settings tab', () => {
    mocks.query.data.value = { config: { applicationAcceleratorEnabled: true } }
    mountTabs()
    const cacheTab = tabByKey('cache-settings')

    expect(cacheTab.props.edgeApplicationId).toBe(RESOURCE_ID)
    expect(cacheTab.props.versionId).toBe(VERSION_ID)
    expect(typeof cacheTab.props.service.list).toBe('function')
    expect(typeof cacheTab.props.service.create).toBe('function')
    expect(cacheTab.props.isApplicationAcceleratorEnabled).toBe(true)
  })

  it('passes the rules-engine facade (rules shape) and module flags to the Rules Engine tab', () => {
    mocks.query.data.value = {
      config: { applicationAcceleratorEnabled: false, imageProcessorEnabled: true }
    }
    mountTabs()
    const rulesTab = tabByKey('rules-engine')

    expect(rulesTab.props.edgeApplicationId).toBe(RESOURCE_ID)
    expect(rulesTab.props.versionId).toBe(VERSION_ID)
    expect(typeof rulesTab.props.service.listRulesEngineRequestAndResponsePhase).toBe('function')
    expect(typeof rulesTab.props.service.editRulesEngine).toBe('function')
    expect(rulesTab.props.isImageOptimizationEnabled).toBe(true)
    expect(rulesTab.props.isApplicationAcceleratorEnabled).toBe(false)
  })

  it('passes the functions facade to the Functions tab when enabled', () => {
    mocks.query.data.value = { config: { edgeFunctionsEnabled: true } }
    mountTabs()
    const functionsTab = tabByKey('functions')

    expect(functionsTab.props.edgeApplicationId).toBe(RESOURCE_ID)
    expect(functionsTab.props.versionId).toBe(VERSION_ID)
    expect(typeof functionsTab.props.service.list).toBe('function')
    expect(typeof functionsTab.props.service.load).toBe('function')
  })
})

describe('Application v6 — post-save reactivity and event forwarding', () => {
  it('refetches the gating query when a SAVE command succeeds', () => {
    const wrapper = mountTabs()
    wrapper.findComponent(ShellStub).vm.$emit('command-success', { action: 'SAVE' })
    expect(mocks.query.refetch).toHaveBeenCalledTimes(1)
  })

  it('does not refetch the gating query for non-SAVE commands', () => {
    const wrapper = mountTabs()
    wrapper.findComponent(ShellStub).vm.$emit('command-success', { action: 'DELETE' })
    expect(mocks.query.refetch).not.toHaveBeenCalled()
  })

  it('forwards command-success to the parent', () => {
    const wrapper = mountTabs()
    wrapper.findComponent(ShellStub).vm.$emit('command-success', { action: 'SAVE' })
    expect(wrapper.emitted('command-success')?.[0]).toEqual([{ action: 'SAVE' }])
  })

  it('forwards command-error to the parent', () => {
    const wrapper = mountTabs()
    wrapper.findComponent(ShellStub).vm.$emit('command-error', { message: 'boom' })
    expect(wrapper.emitted('command-error')?.[0]).toEqual([{ message: 'boom' }])
  })

  it('forwards cancel to the parent', () => {
    const wrapper = mountTabs()
    wrapper.findComponent(ShellStub).vm.$emit('cancel')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })
})
