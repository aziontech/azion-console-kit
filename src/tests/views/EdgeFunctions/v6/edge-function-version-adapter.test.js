import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import {
  createVersionCommandBus,
  VERSION_COMMAND_BUS_KEY
} from '@/composables/versioning/use-version-command-bus'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'

// One spy per service method so we can assert the adapter routes to the shared
// version service without any real HTTP.
const makeServiceMock = () => ({
  updateDraft: vi.fn().mockResolvedValue({ id: 'v1' }),
  build: vi.fn().mockResolvedValue(undefined),
  archive: vi.fn().mockResolvedValue(undefined),
  cancelBuild: vi.fn().mockResolvedValue(undefined),
  createDraft: vi.fn().mockResolvedValue({ id: 'v2', name: 'cloned draft' }),
  deleteVersion: vi.fn().mockResolvedValue(undefined)
})

const { functionService } = vi.hoisted(() => ({ functionService: {} }))

vi.mock('@/services/v2/edge-function/edge-function-version-service', () => ({
  edgeFunctionVersionService: functionService
}))

import EdgeFunctionVersionAdapter from '@/views/EdgeFunctions/v6/EdgeFunctionVersionAdapter.vue'

// Satisfies the real Function schema: name + code required, defaultArgs valid JSON.
const VALID_RESOURCE = { name: 'my-fn', code: 'export default {}', defaultArgs: '{}' }

const makeContext = (overrides = {}) => ({
  state: ref('draft'),
  readOnly: ref(false),
  version: ref({ id: 'v1', config: {} }),
  availableActions: ref([]),
  disabledActions: ref([]),
  isVersioned: ref(true),
  dispatch: vi.fn(),
  ...overrides
})

const mountAdapter = ({ bus, resource = VALID_RESOURCE, context = makeContext(), slot } = {}) =>
  mount(EdgeFunctionVersionAdapter, {
    props: { resource, resourceId: '10', versionId: 'v1' },
    slots: { default: slot ?? '<div data-testid="form-fields" />' },
    global: {
      provide: {
        [VERSION_COMMAND_BUS_KEY]: bus,
        [VERSION_CONTEXT_KEY]: context
      }
    }
  })

beforeEach(() => {
  Object.assign(functionService, makeServiceMock())
})

describe('EdgeFunctionVersionAdapter — thin adapter delegating to useVersionFormAdapter', () => {
  it('renders the default slot and stays thin (template is just <slot/>)', () => {
    const bus = createVersionCommandBus()
    const wrapper = mountAdapter({ bus })
    expect(wrapper.find('[data-testid="form-fields"]').exists()).toBe(true)
  })

  it('SAVE updates the draft; SAVE_AND_BUILD updates then builds (default strategy)', async () => {
    const bus = createVersionCommandBus()
    mountAdapter({ bus })
    await flushPromises()

    await bus.emit('SAVE', { resourceId: '10', versionId: 'v1' })
    expect(functionService.updateDraft).toHaveBeenCalledWith(
      '10',
      'v1',
      expect.objectContaining({ name: 'my-fn' })
    )
    expect(functionService.build).not.toHaveBeenCalled()

    await bus.emit('SAVE_AND_BUILD', { comment: 'ship it' })
    expect(functionService.updateDraft).toHaveBeenCalledTimes(2)
    expect(functionService.build).toHaveBeenCalledWith('10', 'v1', { comment: 'ship it' })
  })

  it('SAVE with invalid form rejects and never mutates the draft', async () => {
    const bus = createVersionCommandBus()
    // `code` is required by the Function schema; an empty value fails validation.
    mountAdapter({ bus, resource: { name: 'my-fn', code: '', defaultArgs: '{}' } })
    await flushPromises()

    await expect(bus.emit('SAVE', { resourceId: '10', versionId: 'v1' })).rejects.toThrow()
    expect(functionService.updateDraft).not.toHaveBeenCalled()
    expect(functionService.build).not.toHaveBeenCalled()
  })

  it('NEW_DRAFT_FROM clones the source version and returns the new draft', async () => {
    const bus = createVersionCommandBus()
    mountAdapter({ bus })
    await flushPromises()

    const draft = await bus.emit('NEW_DRAFT_FROM', {
      resourceId: '10',
      versionId: 'v1',
      comment: 'clone'
    })
    expect(functionService.createDraft).toHaveBeenCalledWith('10', {
      sourceVersionId: 'v1',
      comment: 'clone'
    })
    expect(draft).toEqual({ id: 'v2', name: 'cloned draft' })
  })

  it('ARCHIVE / CANCEL_BUILD / DELETE route to the shared service', async () => {
    const bus = createVersionCommandBus()
    mountAdapter({ bus })
    await flushPromises()

    await bus.emit('ARCHIVE', { resourceId: '10', versionId: 'v1', comment: 'done' })
    expect(functionService.archive).toHaveBeenCalledWith('10', 'v1', { comment: 'done' })

    await bus.emit('CANCEL_BUILD', { resourceId: '10', versionId: 'v1', comment: 'stop' })
    expect(functionService.cancelBuild).toHaveBeenCalledWith('10', 'v1', { comment: 'stop' })

    await bus.emit('DELETE', { resourceId: '10', versionId: 'v1' })
    expect(functionService.deleteVersion).toHaveBeenCalledWith('10', 'v1')
  })
})

describe('EdgeFunctionVersionAdapter — read-only in an immutable version state', () => {
  // The form fields delegate code read-only to code-editor.vue, which reads the
  // shared version context. Render the real editor through the adapter slot.
  const CodeEditorStub = {
    name: 'code-editor',
    template: '<div data-testid="code-editor" />',
    inject: { versionCtx: { from: VERSION_CONTEXT_KEY } },
    computed: {
      editorReadOnly() {
        return Boolean(this.versionCtx?.readOnly?.value)
      }
    }
  }

  const FormFieldsStub = {
    name: 'form-fields',
    components: { CodeEditorStub },
    template: '<div><code-editor-stub /></div>'
  }

  it('exposes an editable context by default (mutable draft)', () => {
    const bus = createVersionCommandBus()
    const wrapper = mountAdapter({
      bus,
      context: makeContext({ readOnly: ref(false) }),
      slot: FormFieldsStub
    })
    expect(wrapper.findComponent(CodeEditorStub).vm.editorReadOnly).toBe(false)
  })

  it('propagates readOnly to the form + code editor when the version is immutable', () => {
    const bus = createVersionCommandBus()
    const wrapper = mountAdapter({
      bus,
      context: makeContext({ readOnly: ref(true) }),
      slot: FormFieldsStub
    })
    expect(wrapper.findComponent(CodeEditorStub).vm.editorReadOnly).toBe(true)
  })
})
