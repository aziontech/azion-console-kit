import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DeploymentSettingsPicker from '@/templates/release-composition/components/DeploymentSettingsPicker.vue'

const stubs = {
  Checkbox: {
    name: 'Checkbox',
    props: ['modelValue', 'value', 'inputId', 'binary'],
    template: `<input type="checkbox" :checked="modelValue" />`
  },
  InputText: {
    name: 'InputText',
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    template: `<input
      type="text"
      :placeholder="placeholder"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />`
  },
  InlineMessage: {
    name: 'InlineMessage',
    template: '<div class="inline-message"><slot /></div>'
  },
  PrimeButton: {
    name: 'PrimeButton',
    props: ['label'],
    emits: ['click'],
    template: `<button :data-testid="$attrs['data-testid']" @click="$emit('click')">{{ label }}</button>`
  }
}

const tooltip = { mounted() {}, updated() {} }

const makeDeployment = (overrides = {}) => ({
  id: 'ds-1',
  name: 'production-edge',
  policyLabel: 'Single Version',
  ...overrides
})

const makeWrapper = (deployment, props = {}) =>
  mount(DeploymentSettingsPicker, {
    props: {
      groups: [
        {
          key: 'linked',
          label: 'Linked to this release',
          deployments: [deployment]
        }
      ],
      modelValue: [],
      query: '',
      ...props
    },
    global: {
      stubs,
      directives: { tooltip }
    }
  })

const envTags = (wrapper, id) =>
  wrapper.findAll(`[data-testid="release-composition__ds-env-${id}"]`)
const overflowChip = (wrapper, id) =>
  wrapper.find(`[data-testid="release-composition__ds-env-more-${id}"]`)

describe('DeploymentSettingsPicker environment tags', () => {
  it('renders no tags and no overflow chip when there are no environments', () => {
    const missing = makeWrapper(makeDeployment({ id: 'ds-none' }))
    expect(envTags(missing, 'ds-none')).toHaveLength(0)
    expect(overflowChip(missing, 'ds-none').exists()).toBe(false)
    expect(missing.find('[data-testid="release-composition__ds-envs-ds-none"]').exists()).toBe(
      false
    )

    const empty = makeWrapper(makeDeployment({ id: 'ds-empty', environmentNames: [] }))
    expect(envTags(empty, 'ds-empty')).toHaveLength(0)
    expect(overflowChip(empty, 'ds-empty').exists()).toBe(false)
  })

  it('renders a single tag with no overflow chip for one environment', () => {
    const wrapper = makeWrapper(makeDeployment({ id: 'ds-1', environmentNames: ['prod'] }))

    const tags = envTags(wrapper, 'ds-1')
    expect(tags).toHaveLength(1)
    expect(tags[0].text()).toBe('prod')
    expect(overflowChip(wrapper, 'ds-1').exists()).toBe(false)
  })

  it('renders exactly three tags with no overflow chip for three environments', () => {
    const wrapper = makeWrapper(makeDeployment({ id: 'ds-3', environmentNames: ['a', 'b', 'c'] }))

    const tags = envTags(wrapper, 'ds-3')
    expect(tags).toHaveLength(3)
    expect(tags.map((tag) => tag.text())).toEqual(['a', 'b', 'c'])
    expect(overflowChip(wrapper, 'ds-3').exists()).toBe(false)
  })

  it('caps at three visible tags and shows a "+2" overflow chip exposing the remaining names for five environments', () => {
    const wrapper = makeWrapper(
      makeDeployment({
        id: 'ds-5',
        environmentNames: ['a', 'b', 'c', 'd', 'e']
      })
    )

    const tags = envTags(wrapper, 'ds-5')
    expect(tags).toHaveLength(3)
    expect(tags.map((tag) => tag.text())).toEqual(['a', 'b', 'c'])

    const chip = overflowChip(wrapper, 'ds-5')
    expect(chip.exists()).toBe(true)
    expect(chip.text()).toBe('+2')
    expect(chip.attributes('tabindex')).toBe('0')
    expect(chip.attributes('aria-label')).toBe('2 more environments: d, e')
  })

  it('renders the "{N} Workloads affected" line when a positive workloadsCount is present', () => {
    const withCount = makeWrapper(makeDeployment({ id: 'ds-wl', workloadsCount: 20 }))
    const line = withCount.find('[data-testid="release-composition__ds-workloads-ds-wl"]')
    expect(line.exists()).toBe(true)
    expect(line.text()).toContain('20 workloads affected')
  })

  it('singularizes the workloads line when exactly one workload is affected', () => {
    const one = makeWrapper(makeDeployment({ id: 'ds-one', workloadsCount: 1 }))
    const line = one.find('[data-testid="release-composition__ds-workloads-ds-one"]')
    expect(line.text()).toContain('1 workload affected')
    expect(line.text()).not.toContain('1 workloads affected')
  })

  it('shows a "No workloads bound" line (never the count line) so cards keep the same height when no workload is affected', () => {
    const withoutCount = makeWrapper(makeDeployment({ id: 'ds-nowl' }))
    expect(
      withoutCount.find('[data-testid="release-composition__ds-workloads-ds-nowl"]').exists()
    ).toBe(false)
    const empty = withoutCount.find(
      '[data-testid="release-composition__ds-workloads-empty-ds-nowl"]'
    )
    expect(empty.exists()).toBe(true)
    expect(empty.text()).toContain('No workloads bound')
    expect(withoutCount.text()).not.toContain('workloads affected')
  })

  it('treats a zero workloadsCount as "No workloads bound" rather than "0 Workloads affected"', () => {
    const zero = makeWrapper(makeDeployment({ id: 'ds-zero', workloadsCount: 0 }))
    expect(
      zero.find('[data-testid="release-composition__ds-workloads-empty-ds-zero"]').exists()
    ).toBe(true)
    expect(zero.text()).not.toContain('0 workloads affected')
  })

  it('surfaces an "impact unavailable" note instead of "No workloads bound" when the meta failed to load', () => {
    const unavailable = makeWrapper(makeDeployment({ id: 'ds-unavail' }), {
      metaUnavailable: true
    })
    expect(
      unavailable
        .find('[data-testid="release-composition__ds-workloads-unavailable-ds-unavail"]')
        .exists()
    ).toBe(true)
    expect(unavailable.text()).toContain('Workloads impact unavailable')
    expect(unavailable.text()).not.toContain('No workloads bound')
  })

  it('shows the skeleton and hides real tags and workloads when isLoadingMeta is true', () => {
    const wrapper = makeWrapper(
      makeDeployment({
        id: 'ds-load',
        environmentNames: ['a', 'b', 'c', 'd', 'e'],
        workloadsCount: 20
      }),
      { isLoadingMeta: true }
    )

    expect(
      wrapper.find('[data-testid="release-composition__ds-meta-skeleton-ds-load"]').exists()
    ).toBe(true)
    expect(envTags(wrapper, 'ds-load')).toHaveLength(0)
    expect(overflowChip(wrapper, 'ds-load').exists()).toBe(false)
    expect(wrapper.find('[data-testid="release-composition__ds-workloads-ds-load"]').exists()).toBe(
      false
    )
    expect(wrapper.text()).not.toContain('workloads affected')
  })
})
