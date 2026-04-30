import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import FormFieldsImportGithub from '@/views/ImportGitHub/FormFields/FormFieldsImportGithub.vue'
import { vcsService } from '@/services/v2/vcs/vcs-service'

const toastAdd = vi.fn()
let messageHandler
const wrappers = []

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: toastAdd })
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    resolve: vi.fn(() => ({ href: '/variables' }))
  })
}))

vi.mock('@/helpers', () => ({
  windowOpen: vi.fn()
}))

vi.mock('vee-validate', async () => {
  const { ref } = await import('vue')
  return {
    useField: () => ({ value: ref('') })
  }
})

vi.mock('@/services/v2/vcs/vcs-service', () => ({
  vcsService: {
    listIntegrations: vi.fn().mockResolvedValue([]),
    postCallbackUrl: vi.fn().mockResolvedValue({}),
    listRepositories: vi.fn().mockResolvedValue([])
  }
}))

const mountComponent = async () => {
  const wrapper = shallowMount(FormFieldsImportGithub, {
    props: {
      listVulcanPresetsService: vi.fn().mockResolvedValue([]),
      frameworkDetectorService: vi.fn().mockResolvedValue('vue')
    },
    global: {
      stubs: {
        FormHorizontal: true,
        FieldText: true,
        FieldDropdown: true,
        OAuthGithub: true,
        LabelBlock: true,
        PrimeButton: true,
        Dropdown: true,
        Divider: true
      }
    }
  })
  wrappers.push(wrapper)
  await flushPromises()
  expect(messageHandler).toBeTypeOf('function')
  return wrapper
}

describe('FormFieldsImportGithub message listener', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    messageHandler = undefined
    vi.spyOn(window, 'addEventListener').mockImplementation((eventName, handler) => {
      if (eventName === 'message') {
        messageHandler = handler
      }
    })
  })

  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
    vi.restoreAllMocks()
  })

  it('ignores messages from different origins', async () => {
    await mountComponent()

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

  it('handles integration-data, integration-connected, and integration-error', async () => {
    await mountComponent()

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
