import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PaymentMethodBlock from '@/templates/checkout-block/payment-method-block.vue'

const flushPromises = () => Promise.resolve().then(() => Promise.resolve())

const buildStripeClientService = () => {
  const handlers = {}
  const paymentElement = {
    on: vi.fn((eventName, handler) => {
      handlers[eventName] = handler
    }),
    mount: vi.fn((target) => {
      const iframe = document.createElement('iframe')
      iframe.src = 'https://js.stripe.com/v3/elements-inner-payment-test.html'
      target.appendChild(iframe)
    }),
    unmount: vi.fn()
  }
  const checkout = {
    createPaymentElement: vi.fn(() => paymentElement)
  }
  const stripe = {
    initCheckoutElementsSdk: vi.fn().mockResolvedValue(checkout)
  }

  return {
    handlers,
    paymentElement,
    stripeClientService: vi.fn().mockResolvedValue(stripe)
  }
}

describe('payment-method-block', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('waits for the official Stripe ready event before revealing payment fields', async () => {
    vi.useFakeTimers()
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })
    const { handlers, stripeClientService } = buildStripeClientService()

    const wrapper = mount(PaymentMethodBlock, {
      props: {
        stripeClientService,
        checkoutSessionClientSecret: 'cs_test'
      },
      global: {
        stubs: {
          Skeleton: {
            template: '<div class="p-skeleton" />'
          }
        }
      }
    })

    await flushPromises()
    await vi.advanceTimersByTimeAsync(3000)

    expect(wrapper.find('#payment-element').classes()).toContain('opacity-0')
    expect(wrapper.emitted('element-ready')).toBeUndefined()

    handlers.ready()
    await flushPromises()

    expect(wrapper.find('#payment-element').classes()).not.toContain('opacity-0')
    expect(wrapper.emitted('element-ready')).toHaveLength(1)
    expect(wrapper.emitted('readiness-change')?.at(-1)).toEqual([false])
  })
})
