import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import EngineAzion from '@/templates/template-engine-block/engine-azion.vue'
import { vcsService } from '@/services/v2/vcs/vcs-service'

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: vi.fn() })
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

const makeSchema = (fieldName) => ({
  fields: [],
  groups: [
    {
      name: 'github',
      label: 'GitHub Connection',
      fields: [
        {
          name: fieldName,
          label: 'Field',
          value: '',
          attrs: { required: false }
        }
      ]
    }
  ]
})

const wrappers = []

const mountEngine = async (schema) => {
  const wrapper = shallowMount(EngineAzion, {
    props: { schema, isDrawer: false },
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
  wrappers.push(wrapper)
  await flushPromises()
}

describe('engine-azion mount integration loading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  })

  it('loads integrations on mount when VCS field exists in groups', async () => {
    await mountEngine(makeSchema('platform_feature__vcs_integration__uuid'))

    expect(vcsService.listIntegrations).toHaveBeenCalled()
  })

  it('does not load integrations on mount when VCS field is absent', async () => {
    await mountEngine(makeSchema('application_name'))

    expect(vcsService.listIntegrations).not.toHaveBeenCalled()
  })
})
