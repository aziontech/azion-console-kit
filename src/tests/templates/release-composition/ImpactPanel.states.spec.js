import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ImpactPanel from '@/templates/release-composition/components/ImpactPanel.vue'

const stubs = {
  PrimeButton: {
    name: 'PrimeButton',
    props: ['label', 'icon'],
    emits: ['click'],
    template: `<button :data-testid="$attrs['data-testid']" @click="$emit('click')">{{ label }}</button>`
  }
}

const makeWrapper = (impact, degradationReason = null) =>
  mount(ImpactPanel, {
    props: { impact, degradationReason },
    global: { stubs }
  })

const testid = (name) => `[data-testid="release-composition__impact-${name}"]`

describe('ImpactPanel states', () => {
  it('shows the empty prompt with no tree or unavailable block when nothing is selected', () => {
    const wrapper = makeWrapper({
      hasSelection: false,
      impactUnavailable: false,
      perDs: [],
      totals: { totalDomains: 0, totalWorkloads: 0, dsCount: 0 }
    })

    expect(wrapper.find(testid('empty')).exists()).toBe(true)
    expect(wrapper.find(testid('tree')).exists()).toBe(false)
    expect(wrapper.find(testid('unavailable')).exists()).toBe(false)
  })

  describe('unavailable state', () => {
    const unavailable = {
      hasSelection: true,
      impactUnavailable: true,
      perDs: [],
      totals: { totalDomains: 0, totalWorkloads: 0, dsCount: 2 }
    }

    it('renders the unavailable block with the selected-count copy for fetch_failed', () => {
      const wrapper = makeWrapper(unavailable, 'fetch_failed')

      const block = wrapper.find(testid('unavailable'))
      expect(block.exists()).toBe(true)
      expect(block.text()).toContain('2 Deployment Settings selected')
      expect(wrapper.find(testid('empty')).exists()).toBe(false)
      expect(wrapper.find(testid('tree')).exists()).toBe(false)
    })

    it('emits retry when the Retry impact action is clicked', async () => {
      const wrapper = makeWrapper(unavailable, 'fetch_failed')

      await wrapper.find(testid('retry')).trigger('click')

      expect(wrapper.emitted('retry')).toBeTruthy()
    })
  })

  describe('available state', () => {
    const available = {
      hasSelection: true,
      impactUnavailable: false,
      perDs: [
        {
          name: 'production-edge',
          domains: 5,
          wlCount: 2,
          environments: [
            {
              name: 'production',
              wlCount: 2,
              rows: [
                { name: 'workload-a', domains: 3 },
                { name: 'workload-b', domains: 2 }
              ]
            }
          ]
        }
      ],
      totals: { totalDomains: 5, totalWorkloads: 2, dsCount: 1 }
    }

    it('renders the tree, env/workload nodes and totals footer, without the partial banner', () => {
      const wrapper = makeWrapper(available, null)

      expect(wrapper.find(testid('tree')).exists()).toBe(true)
      expect(wrapper.find(testid('env-production')).exists()).toBe(true)
      expect(wrapper.find(testid('row-workload-a')).exists()).toBe(true)
      expect(wrapper.find(testid('row-workload-b')).exists()).toBe(true)

      const summary = wrapper.find(testid('summary'))
      expect(summary.exists()).toBe(true)
      expect(summary.text()).toContain('5 domains')
      expect(summary.text()).toContain('2 workloads')
      expect(summary.text()).toContain('1 Deployment Settings')

      expect(wrapper.find(testid('partial')).exists()).toBe(false)
    })

    it('shows the partial banner alongside the tree when the impact is capped (req 5.3)', () => {
      const wrapper = makeWrapper(available, 'capped')

      expect(wrapper.find(testid('partial')).exists()).toBe(true)
      expect(wrapper.find(testid('tree')).exists()).toBe(true)
      expect(wrapper.find(testid('unavailable')).exists()).toBe(false)
    })
  })
})
