import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import UpgradeToProCard from '@/views/Billing/components/UpgradeToProCard.vue'

vi.mock('@aziontech/webkit/button', () => ({
  default: {
    props: ['label'],
    template: `
      <button
        data-testid="upgrade"
        @click="$emit('click')"
      >
        {{ label }}
      </button>
    `,
    emits: ['click']
  }
}))

const mountCard = () =>
  mount(UpgradeToProCard, {
    global: {
      stubs: {
        CardBox: {
          template: `
            <section>
              <slot name="content" />
              <slot name="footer" />
            </section>
          `
        }
      }
    }
  })

describe('UpgradeToProCard', () => {
  it('emits upgrade only from the button click', async () => {
    const wrapper = mountCard()

    await wrapper.get('[data-testid="upgrade"]').trigger('click')

    expect(wrapper.emitted('upgrade')).toHaveLength(1)
  })
})
