import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ImpactPanel from '@/templates/release-composition/components/ImpactPanel.vue'

// Webkit Message/InlineMessage/Button reduced to plain DOM so the three
// mutually-exclusive states (empty / unavailable+Retry / available tree+totals)
// and the retry contract are observable in jsdom.
const stubs = {
  Message: {
    name: 'Message',
    props: ['severity', 'closable'],
    template: '<div class="message"><slot /></div>'
  },
  InlineMessage: {
    name: 'InlineMessage',
    props: ['severity'],
    template: `<div class="inline-message" :data-testid="$attrs['data-testid']"><slot /></div>`
  },
  PrimeButton: {
    name: 'PrimeButton',
    props: ['label', 'icon'],
    emits: ['click'],
    template: `<button :data-testid="$attrs['data-testid']" @click="$emit('click')">{{ label }}</button>`
  }
}

const makeWrapper = (impact) =>
  mount(ImpactPanel, {
    props: impact === undefined ? {} : { impact },
    global: { stubs }
  })

describe('ImpactPanel', () => {
  describe('empty state (no selection)', () => {
    it('prompts to select Deployment Settings and renders neither the unavailable block nor the tree', () => {
      const wrapper = makeWrapper({
        hasSelection: false,
        impactUnavailable: false,
        perDs: [],
        totals: { domains: 0, workloads: 0, dsCount: 0 }
      })

      expect(wrapper.find('[data-testid="release-composition__impact-empty"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="release-composition__impact-unavailable"]').exists()).toBe(
        false
      )
      expect(wrapper.find('[data-testid="release-composition__impact-tree"]').exists()).toBe(false)
    })

    it('defaults to the empty state when no impact prop is provided', () => {
      const wrapper = makeWrapper()

      // The default impact prop has hasSelection: false → empty branch wins even
      // though impactUnavailable defaults to true.
      expect(wrapper.find('[data-testid="release-composition__impact-empty"]').exists()).toBe(true)
    })
  })

  describe('unavailable state (degraded — req 7.3)', () => {
    const unavailable = {
      hasSelection: true,
      impactUnavailable: true,
      perDs: [],
      totals: { domains: 0, workloads: 0, dsCount: 0 }
    }

    it('renders the degraded message plus a Retry action and no tree', () => {
      const wrapper = makeWrapper(unavailable)

      expect(wrapper.find('[data-testid="release-composition__impact-unavailable"]').exists()).toBe(
        true
      )
      expect(wrapper.find('[data-testid="release-composition__impact-retry"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="release-composition__impact-empty"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="release-composition__impact-tree"]').exists()).toBe(false)
    })

    it('emits retry when the Retry action is clicked', async () => {
      const wrapper = makeWrapper(unavailable)

      await wrapper.find('[data-testid="release-composition__impact-retry"]').trigger('click')

      expect(wrapper.emitted('retry')).toBeTruthy()
    })
  })

  describe('available state (tree + totals — req 7.2)', () => {
    const available = {
      hasSelection: true,
      impactUnavailable: false,
      perDs: [
        {
          name: 'production-edge',
          domains: 5,
          env: 'production',
          wlCount: 2,
          rows: [
            { name: 'workload-a', domains: 3 },
            { name: 'workload-b', domains: 2 }
          ]
        }
      ],
      totals: { domains: 5, workloads: 2, dsCount: 1 }
    }

    it('renders the per-DS tree with the environment and workload rows', () => {
      const wrapper = makeWrapper(available)

      const tree = wrapper.find('[data-testid="release-composition__impact-tree"]')
      expect(tree.exists()).toBe(true)

      const ds = wrapper.find('[data-testid="release-composition__impact-ds-production-edge"]')
      expect(ds.exists()).toBe(true)
      expect(ds.text()).toContain('production-edge')
      expect(ds.text()).toContain('5 domains')
      expect(ds.text()).toContain('production')
      expect(ds.text()).toContain('2 workloads')

      expect(
        wrapper.find('[data-testid="release-composition__impact-row-workload-a"]').exists()
      ).toBe(true)
      expect(
        wrapper.find('[data-testid="release-composition__impact-row-workload-b"]').exists()
      ).toBe(true)
    })

    it('renders the totals summary line and hides the empty/unavailable blocks', () => {
      const wrapper = makeWrapper(available)

      const summary = wrapper.find('[data-testid="release-composition__impact-summary"]')
      expect(summary.exists()).toBe(true)
      expect(summary.text()).toContain('5 domains')
      expect(summary.text()).toContain('2 workloads')
      expect(summary.text()).toContain('1 Deployment Settings')

      expect(wrapper.find('[data-testid="release-composition__impact-empty"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="release-composition__impact-unavailable"]').exists()).toBe(
        false
      )
    })
  })
})
