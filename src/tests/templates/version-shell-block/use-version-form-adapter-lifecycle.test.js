import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { useField } from 'vee-validate'
import * as yup from 'yup'
import { useVersionFormAdapter } from '@/composables/versioning/use-version-form-adapter'
import {
  createVersionCommandBus,
  VERSION_COMMAND_BUS_KEY
} from '@/composables/versioning/use-version-command-bus'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'
import { DEFAULT_CAPABILITY, VERSIONED_ONLY } from '@/composables/versioning/version-capability'

// A single form field that joins the composable's VeeValidate form so a test can
// dirty it through a real user edit (setValue), the way a form child would.
const NameField = {
  setup() {
    const { value } = useField('name')
    return { value }
  },
  template: '<input data-testid="name" v-model="value" />'
}

// Harness: drives the REAL useVersionFormAdapter with an INJECTED fake service
// (boundary by injection — permitted). No versioning module is mocked.
const Harness = {
  components: { NameField },
  props: ['resource', 'resourceId', 'versionId', 'versionService', 'schema', 'capability'],
  setup(props) {
    const api = useVersionFormAdapter({
      resource: () => props.resource,
      resourceId: () => props.resourceId,
      versionId: () => props.versionId,
      versionService: props.versionService,
      validationSchema: props.schema,
      capability: () => props.capability
    })
    return { api }
  },
  template: '<div><NameField /><span data-testid="name-val">{{ api.values.name }}</span></div>'
}

const schema = yup.object({ name: yup.string().required() })

const makeService = (calls) => ({
  updateDraft: vi.fn(async () => {
    calls.push('updateDraft')
    return { id: 'saved' }
  }),
  build: vi.fn(async () => {
    calls.push('build')
  }),
  archive: vi.fn().mockResolvedValue(undefined),
  cancelBuild: vi.fn().mockResolvedValue(undefined),
  createDraft: vi.fn().mockResolvedValue({ id: 'v2' }),
  deleteVersion: vi.fn().mockResolvedValue(undefined)
})

const mountHarness = ({
  bus,
  resource = { name: 'base' },
  versionId = 'v1',
  versionService,
  capability = DEFAULT_CAPABILITY,
  versionConfig = {}
}) =>
  mount(Harness, {
    props: { resource, resourceId: '10', versionId, versionService, schema, capability },
    global: {
      provide: {
        [VERSION_COMMAND_BUS_KEY]: bus,
        [VERSION_CONTEXT_KEY]: {
          version: ref({ id: versionId, config: versionConfig }),
          capability: DEFAULT_CAPABILITY
        }
      }
    }
  })

let calls
let service
let bus

beforeEach(() => {
  calls = []
  service = makeService(calls)
  bus = createVersionCommandBus()
})

describe('useVersionFormAdapter — SAVE validation gate', () => {
  it('rejects SAVE when the form is invalid and never touches the service', async () => {
    mountHarness({ bus, resource: {}, versionService: service })
    await flushPromises()

    await expect(bus.emit('SAVE', { resourceId: '10', versionId: 'v1' })).rejects.toThrow(
      'Please review the highlighted fields and try again.'
    )
    expect(service.updateDraft).not.toHaveBeenCalled()
    expect(service.build).not.toHaveBeenCalled()
  })

  it('SAVE persists the merged draft values when the form is valid', async () => {
    mountHarness({ bus, resource: { name: 'ok' }, versionService: service })
    await flushPromises()

    await bus.emit('SAVE', { resourceId: '10', versionId: 'v1' })

    expect(service.updateDraft).toHaveBeenCalledWith(
      '10',
      'v1',
      expect.objectContaining({ name: 'ok' })
    )
    expect(service.build).not.toHaveBeenCalled()
  })
})

describe('useVersionFormAdapter — SAVE_AND_BUILD ordering', () => {
  it('calls updateDraft BEFORE build (default strategy), passing the comment to build', async () => {
    mountHarness({ bus, resource: { name: 'ok' }, versionService: service })
    await flushPromises()

    await bus.emit('SAVE_AND_BUILD', { comment: 'ship it' })

    expect(calls).toEqual(['updateDraft', 'build'])
    expect(service.build).toHaveBeenCalledWith('10', 'v1', { comment: 'ship it' })
  })
})

describe('useVersionFormAdapter — re-sync of external values into the form', () => {
  it('resets to new merged values while the form is pristine', async () => {
    const wrapper = mountHarness({ bus, resource: { name: 'base' }, versionService: service })
    await flushPromises()
    expect(wrapper.get('[data-testid="name-val"]').text()).toBe('base')

    await wrapper.setProps({ resource: { name: 'external-change' } })
    await flushPromises()

    expect(wrapper.get('[data-testid="name-val"]').text()).toBe('external-change')
  })

  it('preserves the user edit when merged values change and the form is dirty', async () => {
    const wrapper = mountHarness({ bus, resource: { name: 'base' }, versionService: service })
    await flushPromises()

    await wrapper.get('[data-testid="name"]').setValue('user-typed')
    await flushPromises()

    await wrapper.setProps({ resource: { name: 'external-change' } })
    await flushPromises()

    expect(wrapper.get('[data-testid="name-val"]').text()).toBe('user-typed')
  })

  it('resets unconditionally when the versionId changes, even if the form is dirty', async () => {
    const wrapper = mountHarness({ bus, resource: { name: 'base' }, versionService: service })
    await flushPromises()

    await wrapper.get('[data-testid="name"]').setValue('user-typed')
    await flushPromises()

    await wrapper.setProps({ versionId: 'v2' })
    await flushPromises()

    expect(wrapper.get('[data-testid="name-val"]').text()).toBe('base')
  })
})

describe('useVersionFormAdapter — DEPLOY registration gated by capability', () => {
  it('registers DEPLOY for a deployable capability', async () => {
    mountHarness({ bus, versionService: service, capability: DEFAULT_CAPABILITY })
    await flushPromises()

    expect(bus.registered.value.has('DEPLOY')).toBe(true)
  })

  it('omits DEPLOY for a versioned-only capability so dispatch fail-closes', async () => {
    mountHarness({ bus, versionService: service, capability: VERSIONED_ONLY })
    await flushPromises()

    expect(bus.registered.value.has('DEPLOY')).toBe(false)
    // The lifecycle handlers that do NOT depend on capability are still present.
    expect(bus.registered.value.has('SAVE')).toBe(true)
    expect(bus.registered.value.has('ARCHIVE')).toBe(true)
  })
})
