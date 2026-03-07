import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import FormFieldsAccountSettings from '@/views/AccountSettings/FormFields/FormFieldsAccountSettings.vue'
import { vcsService } from '@/services/v2/vcs/vcs-service'

const toastAdd = vi.fn()
let messageHandler
const wrappers = []

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: toastAdd })
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

vi.mock('@/stores/loading', () => ({
  useLoadingStore: () => ({
    startLoading: vi.fn()
  })
}))

vi.mock('@/composables/useDeleteDialog', () => ({
  useDeleteDialog: () => ({
    openDeleteDialog: vi.fn()
  })
}))

vi.mock('@/stores/account', () => ({
  useAccountStore: () => ({
    account: {
      id: 1,
      name: 'test-account'
    }
  })
}))

vi.mock('@/services/account-services/delete-account-service', () => ({
  deleteAccountService: vi.fn()
}))

vi.mock('@/helpers', () => ({
  capitalizeFirstLetter: (value) => value
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
    deleteIntegration: vi.fn().mockResolvedValue({})
  }
}))

const mountComponent = async () => {
  const wrapper = shallowMount(FormFieldsAccountSettings, {
    props: {
      listCountriesService: vi.fn().mockResolvedValue([]),
      listRegionsService: vi.fn().mockResolvedValue([]),
      listCitiesService: vi.fn().mockResolvedValue([])
    },
    global: {
      stubs: {
        FormHorizontal: true,
        FieldText: true,
        FieldTextArea: true,
        FieldDropdown: true,
        FieldGroupSwitch: true,
        InputText: true,
        PrimeButton: true,
        OAuthGithub: true
      }
    }
  })
  wrappers.push(wrapper)
  await flushPromises()
  expect(messageHandler).toBeTypeOf('function')
  return wrapper
}

describe('FormFieldsAccountSettings message listener', () => {
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
