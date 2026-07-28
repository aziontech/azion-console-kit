import { beforeEach, describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LegacyAdditionalDataView from '@/views/Signup/legacy/LegacyAdditionalDataView.vue'
import AdditionalDataFormBlock from '@/templates/signup-block/legacy/additional-data-form-block.vue'

vi.mock('lottie-web-vue', () => ({ LottieAnimation: { template: '<div />' } }))
vi.mock('@/assets/animations/additional-data-dark.json', () => ({ default: {} }))
vi.mock('@/assets/animations/additional-data-light.json', () => ({ default: {} }))

const services = {
  postAdditionalDataService: vi.fn(),
  patchFullnameService: vi.fn(),
  updateAccountInfoService: vi.fn()
}

describe('LegacyAdditionalDataView (restored from main)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('mounts without runtime errors and renders the legacy form block', () => {
    const wrapper = shallowMount(LegacyAdditionalDataView, {
      props: services,
      global: { provide: { tracker: { signUp: {} } } }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.html()).toContain('Personalize Your Experience')
    expect(wrapper.findComponent(AdditionalDataFormBlock).exists()).toBe(true)
  })

  it('carries no plan selector or checkout in the legacy screen', () => {
    const wrapper = shallowMount(LegacyAdditionalDataView, {
      props: services,
      global: { provide: { tracker: { signUp: {} } } }
    })

    const html = wrapper.html().toLowerCase()
    expect(html).not.toContain('choosingplancontainer')
    expect(html).not.toContain('planselectorcard')
  })
})
