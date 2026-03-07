import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import EngineAzion from '@/templates/template-engine-block/engine-azion.vue'
import EngineJsonform from '@/templates/template-engine-block/engine-jsonform.vue'
import { vcsService } from '@/services/v2/vcs/vcs-service'

const toastAdd = vi.fn()
let messageHandler
const wrappers = []

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: toastAdd })
}))

vi.mock('@/services/v2/vcs/vcs-service', () => ({
  vcsService: {
    listIntegrations: vi.fn().mockResolvedValue([]),
    postCallbackUrl: vi.fn().mockResolvedValue({})
  }
}))

vi.mock('vee-validate', () => ({
  useForm: () => ({
    errors: {},
    meta: {},
    setTouched: vi.fn(),
    defineInputBinds: () => ({ value: '' }),
    resetForm: vi.fn(),
    values: {},
    validate: vi.fn().mockResolvedValue(true),
    setFieldValue: vi.fn()
  })
}))

vi.mock('@jsonforms/vue', () => ({
  JsonForms: { name: 'JsonForms', template: '<div />' },
  rendererProps: () => ({}),
  useJsonFormsControl: () => ({ control: { value: {} }, handleChange: vi.fn() })
}))

vi.mock('@jsonforms/vue-vanilla', () => ({
  vanillaRenderers: []
}))

const schemaWithVcsGroup = {
  fields: [],
  groups: [
    {
      name: 'github',
      label: 'GitHub Connection',
      fields: [
        {
          name: 'platform_feature__vcs_integration__uuid',
          label: 'Git Scope',
          value: '',
          attrs: { required: false }
        }
      ]
    }
  ]
}

const jsonformSchemaWithVcs = {
  title: 'Test form',
  required: [],
  properties: {
    platform_feature__vcs_integration__uuid: {
      type: 'string',
      instantiation_data_path: '/vcs/integration'
    },
    application_name: {
      type: 'string',
      instantiation_data_path: '/application/name'
    }
  }
}

const mountWithListenerCapture = async (component, options) => {
  const wrapper = shallowMount(component, options)
  wrappers.push(wrapper)
  await flushPromises()
  expect(messageHandler).toBeTypeOf('function')
  return wrapper
}

describe('GitHub message listeners in template engines', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    messageHandler = undefined
    vi.spyOn(window, 'addEventListener').mockImplementation((eventName, handler) => {
      if (eventName === 'message') {
        messageHandler = handler
      }
    })
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {})
  })

  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
    vi.restoreAllMocks()
  })

  it('engine-azion ignores messages from different origins', async () => {
    await mountWithListenerCapture(EngineAzion, {
      props: { schema: schemaWithVcsGroup, isDrawer: false },
      global: {
        stubs: {
          FormHorizontal: true,
          LabelBlock: true,
          FieldDropdown: true,
          OAuthGithub: true,
          InputText: true,
          Password: true
        }
      }
    })

    const listCallsBefore = vcsService.listIntegrations.mock.calls.length
    await messageHandler({
      origin: 'https://malicious.example',
      data: { event: 'integration-connected' }
    })
    await flushPromises()

    expect(vcsService.listIntegrations).toHaveBeenCalledTimes(listCallsBefore)
    expect(vcsService.postCallbackUrl).not.toHaveBeenCalled()
    expect(toastAdd).not.toHaveBeenCalled()
  })

  it('engine-azion handles integration-data, integration-connected, and integration-error', async () => {
    await mountWithListenerCapture(EngineAzion, {
      props: { schema: schemaWithVcsGroup, isDrawer: false },
      global: {
        stubs: {
          FormHorizontal: true,
          LabelBlock: true,
          FieldDropdown: true,
          OAuthGithub: true,
          InputText: true,
          Password: true
        }
      }
    })

    const listCallsBefore = vcsService.listIntegrations.mock.calls.length
    await messageHandler({
      origin: window.location.origin,
      data: { event: 'integration-data', data: { code: 'oauth-code' } }
    })
    await flushPromises()

    expect(vcsService.postCallbackUrl).toHaveBeenCalledWith('', { code: 'oauth-code' })

    await messageHandler({
      origin: window.location.origin,
      data: { event: 'integration-connected' }
    })
    await flushPromises()

    expect(vcsService.listIntegrations.mock.calls.length).toBeGreaterThan(listCallsBefore)

    await messageHandler({
      origin: window.location.origin,
      data: { event: 'integration-error' }
    })

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'GitHub integration failed'
      })
    )
  })

  it('engine-jsonform ignores messages from different origins', async () => {
    await mountWithListenerCapture(EngineJsonform, {
      props: { schema: jsonformSchemaWithVcs, isDrawer: false },
      global: {
        stubs: {
          FormHorizontal: true,
          LabelBlock: true,
          Dropdown: true,
          OAuthGithub: true,
          JsonForms: true
        }
      }
    })

    const listCallsBefore = vcsService.listIntegrations.mock.calls.length
    await messageHandler({
      origin: 'https://malicious.example',
      data: { event: 'integration-connected' }
    })
    await flushPromises()

    expect(vcsService.listIntegrations).toHaveBeenCalledTimes(listCallsBefore)
    expect(vcsService.postCallbackUrl).not.toHaveBeenCalled()
    expect(toastAdd).not.toHaveBeenCalled()
  })

  it('engine-jsonform handles integration-data, integration-connected, and integration-error', async () => {
    await mountWithListenerCapture(EngineJsonform, {
      props: { schema: jsonformSchemaWithVcs, isDrawer: false },
      global: {
        stubs: {
          FormHorizontal: true,
          LabelBlock: true,
          Dropdown: true,
          OAuthGithub: true,
          JsonForms: true
        }
      }
    })

    const listCallsBefore = vcsService.listIntegrations.mock.calls.length
    await messageHandler({
      origin: window.location.origin,
      data: { event: 'integration-data', data: { code: 'oauth-code' } }
    })
    await flushPromises()

    expect(vcsService.postCallbackUrl).toHaveBeenCalledWith('', { code: 'oauth-code' })

    await messageHandler({
      origin: window.location.origin,
      data: { event: 'integration-connected' }
    })
    await flushPromises()

    expect(vcsService.listIntegrations.mock.calls.length).toBeGreaterThan(listCallsBefore)

    await messageHandler({
      origin: window.location.origin,
      data: { event: 'integration-error' }
    })

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'GitHub integration failed'
      })
    )
  })
})
