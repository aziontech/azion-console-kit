import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  createVersionCommandBus,
  VERSION_COMMAND_BUS_KEY
} from '@/composables/versioning/use-version-command-bus'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'

// Task 6.4 (optional): NetworkListVersionAdapter is a thin child that delegates
// the whole version lifecycle to useVersionFormAdapter. We assert the framework
// contract a new atomic resource must honor — without any real HTTP: SAVE invalid
// never mutates, read-only propagates to the form, and NEW_DRAFT_FROM clones.

// One spy per service method so we can assert the adapter routes to the shared
// version service without touching the network.
const makeServiceMock = () => ({
  updateDraft: vi.fn().mockResolvedValue({ id: 'v1' }),
  build: vi.fn().mockResolvedValue(undefined),
  archive: vi.fn().mockResolvedValue(undefined),
  cancelBuild: vi.fn().mockResolvedValue(undefined),
  createDraft: vi.fn().mockResolvedValue({ id: 'v2', name: 'cloned draft' }),
  deleteVersion: vi.fn().mockResolvedValue(undefined)
})

const { networkListService } = vi.hoisted(() => ({ networkListService: {} }))

vi.mock('@/services/v2/network-lists/network-list-version-service', () => ({
  networkListVersionService: networkListService
}))

import NetworkListVersionAdapter from '@/views/NetworkLists/v6/NetworkListVersionAdapter.vue'

// Satisfies the real Network List schema: name required; ip_cidr requires a
// non-empty itemsValues with no blank lines.
const VALID_RESOURCE = {
  name: 'my-list',
  networkListType: 'ip_cidr',
  itemsValues: '10.0.0.0/24'
}

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
  mount(NetworkListVersionAdapter, {
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
  Object.assign(networkListService, makeServiceMock())
})

describe('NetworkListVersionAdapter — thin adapter delegating to useVersionFormAdapter', () => {
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
    expect(networkListService.updateDraft).toHaveBeenCalledWith(
      '10',
      'v1',
      expect.objectContaining({ name: 'my-list' })
    )
    expect(networkListService.build).not.toHaveBeenCalled()

    await bus.emit('SAVE_AND_BUILD', { comment: 'ship it' })
    expect(networkListService.updateDraft).toHaveBeenCalledTimes(2)
    expect(networkListService.build).toHaveBeenCalledWith('10', 'v1', { comment: 'ship it' })
  })

  it('SAVE with invalid form rejects and never mutates the draft', async () => {
    const bus = createVersionCommandBus()
    // `name` is required by the Network List schema; an empty value fails validation.
    mountAdapter({ bus, resource: { ...VALID_RESOURCE, name: '' } })
    await flushPromises()

    await expect(bus.emit('SAVE', { resourceId: '10', versionId: 'v1' })).rejects.toThrow()
    expect(networkListService.updateDraft).not.toHaveBeenCalled()
    expect(networkListService.build).not.toHaveBeenCalled()
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
    expect(networkListService.createDraft).toHaveBeenCalledWith('10', {
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
    expect(networkListService.archive).toHaveBeenCalledWith('10', 'v1', { comment: 'done' })

    await bus.emit('CANCEL_BUILD', { resourceId: '10', versionId: 'v1', comment: 'stop' })
    expect(networkListService.cancelBuild).toHaveBeenCalledWith('10', 'v1', { comment: 'stop' })

    await bus.emit('DELETE', { resourceId: '10', versionId: 'v1' })
    expect(networkListService.deleteVersion).toHaveBeenCalledWith('10', 'v1')
  })
})

describe('NetworkListVersionAdapter — read-only disables the form in an immutable state', () => {
  // The form fields read the shared version context for `:disabled`. Render a stub
  // that mirrors the real block contract through the adapter slot.
  const NameFieldStub = defineComponent({
    name: 'name-field',
    inject: { versionCtx: { from: VERSION_CONTEXT_KEY } },
    template: '<input data-testid="name-field" :data-disabled="String(disabled)" />',
    computed: {
      disabled() {
        return Boolean(this.versionCtx?.readOnly?.value)
      }
    }
  })

  const FormFieldsStub = defineComponent({
    name: 'form-fields',
    components: { NameFieldStub },
    template: '<div><name-field-stub /></div>'
  })

  const disabledOf = (wrapper) =>
    wrapper.get('[data-testid="name-field"]').attributes('data-disabled')

  it('keeps the form editable in a mutable draft (readOnly=false)', () => {
    const bus = createVersionCommandBus()
    const wrapper = mountAdapter({
      bus,
      context: makeContext({ readOnly: ref(false) }),
      slot: () => h(FormFieldsStub)
    })
    expect(disabledOf(wrapper)).toBe('false')
  })

  it('disables the form when the version is immutable (readOnly=true)', () => {
    const bus = createVersionCommandBus()
    const wrapper = mountAdapter({
      bus,
      context: makeContext({ readOnly: ref(true) }),
      slot: () => h(FormFieldsStub)
    })
    expect(disabledOf(wrapper)).toBe('true')
  })
})

// Property P4 (structural, build-breaking): the version adapter is thin and owns
// no lifecycle wiring of its own. Mirrors the EdgeConnectors reference suite so a
// new atomic resource can't drift into a fat adapter or inline bus handlers.
describe('NetworkListVersionAdapter — thin (source-level P4 contract)', () => {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const adapterPath = resolve(
    __dirname,
    '../../../../views/NetworkLists/v6/NetworkListVersionAdapter.vue'
  )
  const source = readFileSync(adapterPath, 'utf-8')

  it('is <= 35 lines', () => {
    const lines = source.replace(/\n$/, '').split('\n')
    expect(lines.length).toBeLessThanOrEqual(35)
  })

  it('renders only a passthrough <slot /> (no inline form markup)', () => {
    const template = source.match(/<template>([\s\S]*?)<\/template>/)?.[1] ?? ''
    expect(template.trim()).toBe('<slot />')
  })

  it('delegates the lifecycle to useVersionFormAdapter with the shared specializations', () => {
    expect(source).toContain('useVersionFormAdapter')
    expect(source).toContain('networkListVersionService')
    expect(source).toContain('validationSchema')
    expect(source).toContain('defaultSaveStrategy')
  })

  it('registers no lifecycle handlers inline (the bus wiring lives in the composable)', () => {
    expect(source).not.toMatch(/onVersionCommand/)
    expect(source).not.toMatch(/SAVE_AND_BUILD/)
    expect(source).not.toMatch(/NEW_DRAFT_FROM/)
  })
})
