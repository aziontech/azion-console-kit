import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import CodeEditor from '@/views/EdgeFunctions/components/code-editor.vue'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'

// The theme store reads window.matchMedia (absent in jsdom); mock it out of scope here.
vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({ resolvedTheme: 'light' })
}))

// Stub the Monaco wrapper so we can read the resolved `options` prop it receives.
const MonacoStub = {
  name: 'vue-monaco-editor',
  props: ['value', 'language', 'theme', 'options'],
  template: '<div data-testid="monaco" />'
}

const makeWrapper = ({ props = {}, readOnly = false } = {}) =>
  mount(CodeEditor, {
    props,
    global: {
      stubs: { 'vue-monaco-editor': MonacoStub },
      provide: {
        [VERSION_CONTEXT_KEY]: { readOnly: ref(readOnly) }
      }
    }
  })

const editorOptions = (wrapper) => wrapper.findComponent(MonacoStub).props('options')

describe('EdgeFunctions code-editor read-only wiring', () => {
  it('stays editable by default outside an immutable version', () => {
    const wrapper = makeWrapper()
    expect(editorOptions(wrapper).readOnly).toBe(false)
  })

  it('honors an explicit readOnly prop (non-versioned usage)', () => {
    const wrapper = makeWrapper({ props: { readOnly: true } })
    expect(editorOptions(wrapper).readOnly).toBe(true)
  })

  it('becomes read-only when the version context is immutable', () => {
    const wrapper = makeWrapper({ readOnly: true })
    expect(editorOptions(wrapper).readOnly).toBe(true)
    expect(wrapper.find('.cursor-not-allowed').exists()).toBe(true)
  })

  it('reacts to the version context toggling read-only', async () => {
    const versionReadOnly = ref(false)
    const wrapper = mount(CodeEditor, {
      global: {
        stubs: { 'vue-monaco-editor': MonacoStub },
        provide: { [VERSION_CONTEXT_KEY]: { readOnly: versionReadOnly } }
      }
    })
    expect(editorOptions(wrapper).readOnly).toBe(false)
    versionReadOnly.value = true
    await wrapper.vm.$nextTick()
    expect(editorOptions(wrapper).readOnly).toBe(true)
  })
})
