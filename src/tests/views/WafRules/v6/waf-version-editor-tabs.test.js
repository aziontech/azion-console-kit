import { defineComponent, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import VersionEditorTabs from '@/views/WafRules/v6/tabs/VersionEditorTabs.vue'
import ListWafRulesAllowed from '@/views/WafRules/ListWafRulesAllowed.vue'
import FormFieldsWafRules from '@/views/WafRules/FormFields/FormFieldsWafRules.vue'

// Task 8.5 (optional): WAF version editor composition. The version editor body
// exposes exactly Main Settings + Allowed Rules scoped to (wafId, versionId),
// the Allowed Rules tab gets the versioned exceptions facade injected, and
// Tuning is absent from the version context.

const WAF_ID = '42'
const VERSION_ID = 'AVWAF0001'

// The versioned exceptions service backs the injected Allowed Rules facade; spy
// on it to prove the facade is pre-bound to (wafId, versionId).
const exceptionsSpies = {
  list: vi.fn(() => Promise.resolve({ count: 0, body: [] })),
  load: vi.fn(() => Promise.resolve({})),
  create: vi.fn(() => Promise.resolve({ id: 1 })),
  edit: vi.fn(() => Promise.resolve('ok')),
  remove: vi.fn(() => Promise.resolve())
}

vi.mock('vue-router', () => ({ useRoute: () => ({ params: { id: WAF_ID } }) }))

vi.mock('@/services/v2/waf/versioned/versioned-waf-exceptions-service', () => ({
  versionedWafExceptionsService: {
    list: (...args) => exceptionsSpies.list(...args),
    load: (...args) => exceptionsSpies.load(...args),
    create: (...args) => exceptionsSpies.create(...args),
    edit: (...args) => exceptionsSpies.edit(...args),
    remove: (...args) => exceptionsSpies.remove(...args)
  }
}))

vi.mock('@/services/v2/waf/waf-version-service', () => ({
  wafVersionService: {
    useLoadVersionQuery: vi.fn(() => ({ data: ref(null), isLoading: ref(false) })),
    useListVersionsQuery: vi.fn(() => ({ data: ref({ body: [] }) }))
  }
}))

// Capture the `tabs` descriptor handed to the shared shell.
let capturedTabs = []
const ShellStub = defineComponent({
  name: 'VersionEditorTabsShell',
  props: ['tabs', 'resourceId', 'versionId', 'adapter', 'useVersionQuery', 'resourceContext'],
  setup(props) {
    capturedTabs = props.tabs
    return () => null
  }
})

beforeEach(() => {
  capturedTabs = []
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

const mountTabs = () =>
  mount(VersionEditorTabs, {
    props: {
      waf: { id: WAF_ID, name: 'my-waf' },
      resourceId: WAF_ID,
      versionId: VERSION_ID
    },
    global: {
      stubs: { VersionEditorTabsShell: ShellStub }
    }
  })

describe('WafRules v6 — version editor tabs (Main Settings + Allowed Rules)', () => {
  it('exposes exactly Main Settings and Allowed Rules', () => {
    mountTabs()
    expect(capturedTabs.map((tab) => tab.key)).toEqual(['main-settings', 'allowed-rules'])
  })

  it('wires Main Settings to the WAF form fields', () => {
    mountTabs()
    const mainSettings = capturedTabs.find((tab) => tab.key === 'main-settings')
    expect(mainSettings.component).toBe(FormFieldsWafRules)
  })

  it('wires Allowed Rules to the shared ListWafRulesAllowed scoped to (wafId, versionId)', () => {
    mountTabs()
    const allowed = capturedTabs.find((tab) => tab.key === 'allowed-rules')
    expect(allowed.component).toBe(ListWafRulesAllowed)
    expect(allowed.props.wafId).toBe(WAF_ID)
    expect(allowed.props.versionId).toBe(VERSION_ID)
    expect(allowed.props.service).toBeTruthy()
  })

  it('excludes Tuning from the version editor', () => {
    mountTabs()
    const keys = capturedTabs.map((tab) => tab.key)
    const labels = capturedTabs.map((tab) => tab.label)
    expect(keys).not.toContain('tuning')
    expect(labels).not.toContain('Tuning')
  })

  it('pre-binds the Allowed Rules facade to (wafId, versionId) before delegating', async () => {
    mountTabs()
    const { service } = capturedTabs.find((tab) => tab.key === 'allowed-rules').props

    await service.list({ page: 1 })
    expect(exceptionsSpies.list).toHaveBeenCalledWith(WAF_ID, VERSION_ID, { page: 1 })

    await service.create({ name: 'allow' })
    expect(exceptionsSpies.create).toHaveBeenCalledWith(WAF_ID, VERSION_ID, { name: 'allow' })

    await service.remove(7)
    expect(exceptionsSpies.remove).toHaveBeenCalledWith(WAF_ID, VERSION_ID, 7)
  })
})
