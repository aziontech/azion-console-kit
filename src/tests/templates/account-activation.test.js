import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AccountActivation from '@/templates/signup-block/account-activation.vue'

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
  toastAdd: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: mocks.routerPush })
}))

vi.mock('@aziontech/webkit/use-toast', () => ({
  useToast: () => ({ add: mocks.toastAdd })
}))

vi.mock('@aziontech/webkit/badge', () => ({
  default: {
    template: '<span />'
  }
}))

const ButtonStub = {
  props: {
    label: String,
    disabled: Boolean
  },
  emits: ['click'],
  template: `
    <button
      type="button"
      :disabled="disabled"
      :data-testid="label"
      @click="$emit('click')"
    >
      {{ label }}
    </button>
  `
}

describe('AccountActivation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('uses the email prop when route query email is unavailable', async () => {
    const resendEmailService = vi.fn().mockResolvedValue('sent')

    const wrapper = mount(AccountActivation, {
      props: {
        email: 'user%40example.com',
        resendEmailService
      },
      global: {
        stubs: {
          Button: ButtonStub,
          PrimeBadge: true
        }
      }
    })

    await wrapper.get('[data-testid="Resend Email"]').trigger('click')
    await flushPromises()

    expect(mocks.routerPush).not.toHaveBeenCalled()
    expect(resendEmailService).toHaveBeenCalledWith({ email: 'user@example.com' })
  })
})
