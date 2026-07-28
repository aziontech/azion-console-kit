import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAccountStore } from '@/stores/account'
import OnboardingScreen from '@/views/Signup/OnboardingScreen.vue'

const LEGACY_PROPS = [
  'postAdditionalDataService',
  'patchFullnameService',
  'updateAccountInfoService'
]

const AdditionalDataViewStub = { name: 'AdditionalDataView', template: '<div />' }
const LegacyAdditionalDataViewStub = {
  name: 'LegacyAdditionalDataView',
  props: LEGACY_PROPS,
  template: '<div />'
}

vi.mock('@/views/Signup/AdditionalDataView.vue', () => ({
  default: { name: 'AdditionalDataView', template: '<div />' }
}))
vi.mock('@/views/Signup/legacy/LegacyAdditionalDataView.vue', () => ({
  default: { name: 'LegacyAdditionalDataView', template: '<div />' }
}))

const services = {
  postAdditionalDataService: vi.fn(),
  patchFullnameService: vi.fn(),
  updateAccountInfoService: vi.fn()
}

const mountWith = (billingType) => {
  const store = useAccountStore()
  store.setAccountData({ kind: 'client', first_login: true, billing_type: billingType })

  return mount(OnboardingScreen, {
    props: services,
    global: {
      stubs: {
        AdditionalDataView: AdditionalDataViewStub,
        LegacyAdditionalDataView: LegacyAdditionalDataViewStub
      }
    }
  })
}

describe('OnboardingScreen dispatch by account type', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the legacy additional-data screen for internal accounts', () => {
    const wrapper = mountWith('internal')
    expect(wrapper.findComponent(LegacyAdditionalDataViewStub).exists()).toBe(true)
    expect(wrapper.findComponent(AdditionalDataViewStub).exists()).toBe(false)
  })

  it('renders the legacy additional-data screen for custom accounts', () => {
    const wrapper = mountWith('custom')
    expect(wrapper.findComponent(LegacyAdditionalDataViewStub).exists()).toBe(true)
  })

  it('renders the new plans onboarding for plan accounts', () => {
    const wrapper = mountWith('plan')
    expect(wrapper.findComponent(AdditionalDataViewStub).exists()).toBe(true)
    expect(wrapper.findComponent(LegacyAdditionalDataViewStub).exists()).toBe(false)
  })

  it('renders the new plans onboarding when billing_type is null', () => {
    const wrapper = mountWith(null)
    expect(wrapper.findComponent(AdditionalDataViewStub).exists()).toBe(true)
  })

  it('forwards the legacy services only to the legacy screen', () => {
    const wrapper = mountWith('internal')
    const legacy = wrapper.findComponent(LegacyAdditionalDataViewStub)
    expect(legacy.props('postAdditionalDataService')).toBe(services.postAdditionalDataService)
    expect(legacy.props('patchFullnameService')).toBe(services.patchFullnameService)
    expect(legacy.props('updateAccountInfoService')).toBe(services.updateAccountInfoService)
  })
})
