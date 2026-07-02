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
    expect(chip.attributes('aria-label')).toBe('2 more Environments: d, e')
  })

  it('renders the "{N} Workloads affected" line when a finite workloadsCount is present and omits it otherwise', () => {
    const withCount = makeWrapper(makeDeployment({ id: 'ds-wl', workloadsCount: 20 }))
    const line = withCount.find('[data-testid="release-composition__ds-workloads-ds-wl"]')
    expect(line.exists()).toBe(true)
    expect(line.text()).toContain('20 Workloads affected')

    const withoutCount = makeWrapper(makeDeployment({ id: 'ds-nowl' }))
    const missing = withoutCount.find('[data-testid="release-composition__ds-workloads-ds-nowl"]')
    expect(missing.exists()).toBe(false)
    expect(withoutCount.text()).not.toContain('Workloads affected')
    expect(withoutCount.text()).not.toContain('0 Workloads')
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
    expect(wrapper.text()).not.toContain('Workloads affected')
  })
})
