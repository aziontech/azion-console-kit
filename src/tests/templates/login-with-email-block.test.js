import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginWithEmailBlock from '@/templates/signup-block/login-with-email-block.vue'

const mocks = vi.hoisted(() => ({
  executeRecaptcha: vi.fn(),
  showBadge: vi.fn(),
  hideBadge: vi.fn(),
  toastAdd: vi.fn(),
  routerPush: vi.fn(),
  trackerTrack: vi.fn()
}))

vi.mock('recaptcha-v3', () => ({
  load: vi.fn(() =>
    Promise.resolve({
      execute: mocks.executeRecaptcha
    })
  ),
  getInstance: vi.fn(() => ({
    showBadge: mocks.showBadge,
    hideBadge: mocks.hideBadge
  }))
}))

vi.mock('@aziontech/webkit/use-toast', () => ({
  useToast: () => ({ add: mocks.toastAdd })
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.routerPush })
}))

vi.mock('vee-validate', async () => {
  const { ref } = await vi.importActual('vue')

  return {
    useForm: () => ({
      errors: ref({}),
      handleSubmit: (callback) => () =>
        callback({
          email: 'user@example.com',
          password: 'Password1!'
        })
    }),
    useField: () => ({ value: ref('') })
  }
})

const ButtonStub = {
  props: {
    label: String,
    loading: Boolean
  },
  emits: ['click'],
  template: `
    <button
      type="button"
      :disabled="loading"
      data-testid="signup-button"
      @click="$emit('click')"
    >
      <span v-if="loading">loading</span>
      {{ label }}
    </button>
  `
}

const InputTextStub = {
  props: {
    modelValue: String
  },
  emits: ['update:modelValue'],
  template: `
    <input
      data-testid="email"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  `
}

const FieldPasswordStub = {
  template: '<input data-testid="password" />'
}

const mountBlock = (props = {}) =>
  mount(LoginWithEmailBlock, {
    props: {
      signupService: vi.fn(),
      showLoginFromEmail: true,
      ...props
    },
    global: {
      provide: {
        tracker: {
          signUp: {
            userClickedSignedUp: () => ({ track: mocks.trackerTrack }),
            userFailedSignUp: () => ({ track: mocks.trackerTrack })
          }
        }
      },
      stubs: {
        Button: ButtonStub,
        InputText: InputTextStub,
        FieldPassword: FieldPasswordStub
      }
    }
  })

describe('LoginWithEmailBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.executeRecaptcha.mockResolvedValue('captcha-token')
    mocks.routerPush.mockResolvedValue()
    mocks.trackerTrack.mockResolvedValue()
  })

  it('stops loading when recaptcha fails before the signup request', async () => {
    mocks.executeRecaptcha.mockRejectedValueOnce(new Error('recaptcha failed'))
    const signupService = vi.fn()
    const wrapper = mountBlock({ signupService })

    await flushPromises()
    await wrapper.get('[data-testid="signup-button"]').trigger('click')
    await wrapper.get('[data-testid="signup-button"]').trigger('click')
    await flushPromises()

    expect(mocks.executeRecaptcha).toHaveBeenCalledWith('signup')
    expect(signupService).not.toHaveBeenCalled()
    expect(wrapper.get('[data-testid="signup-button"]').attributes('disabled')).toBeUndefined()
    expect(mocks.toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Error'
      })
    )
  })

  it('shows the activation step when signup succeeds even if tracking fails', async () => {
    mocks.trackerTrack.mockImplementationOnce(() => {
      throw new Error('tracking failed')
    })
    const signupService = vi.fn().mockResolvedValue(null)
    const wrapper = mountBlock({ signupService })

    await flushPromises()
    await wrapper.get('[data-testid="signup-button"]').trigger('click')
    await wrapper.get('[data-testid="signup-button"]').trigger('click')
    await flushPromises()

    expect(signupService).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'Password1!',
      name: 'user',
      captcha: 'captcha-token'
    })
    expect(wrapper.emitted('loginWithEmail')).toHaveLength(1)
    expect(mocks.toastAdd).not.toHaveBeenCalled()
    expect(wrapper.get('[data-testid="signup-button"]').attributes('disabled')).toBeUndefined()
  })
})
