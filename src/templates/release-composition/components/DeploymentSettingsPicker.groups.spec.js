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

const linkedGroup = {
  key: 'linked',
  label: 'Linked to this release',
  deployments: [
    { id: 'ds-1', name: 'production-edge', policyLabel: 'Single Version' },
    { id: 'ds-2', name: 'staging-edge', policyLabel: 'Versioned URLs' }
  ]
}

const availableGroup = {
  key: 'available',
  label: 'Available to link',
  deployments: [{ id: 'ds-3', name: 'canary-edge', policyLabel: 'Single Version' }]
}

const makeWrapper = (props = {}) =>
  mount(DeploymentSettingsPicker, {
    props: {
      groups: [linkedGroup, availableGroup],
      modelValue: [],
      query: '',
      ...props
    },
    global: { stubs }
  })

describe('DeploymentSettingsPicker (grouped mode)', () => {
  it('renders a header per non-empty group with the passed label, and every row', () => {
    const wrapper = makeWrapper()

    const linkedHeader = wrapper.find('[data-testid="release-composition__ds-group-linked"]')
    const availableHeader = wrapper.find('[data-testid="release-composition__ds-group-available"]')

    expect(linkedHeader.exists()).toBe(true)
    expect(linkedHeader.text()).toBe('Linked to this release')
    expect(availableHeader.exists()).toBe(true)
    expect(availableHeader.text()).toBe('Available to link')

    expect(wrapper.find('[data-testid="release-composition__ds-row-ds-1"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="release-composition__ds-row-ds-2"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="release-composition__ds-row-ds-3"]').exists()).toBe(true)

    expect(wrapper.find('[data-testid="release-composition__ds-row-ds-1"]').text()).toContain(
      'production-edge'
    )
    expect(wrapper.find('[data-testid="release-composition__ds-policy-ds-2"]').text()).toBe(
      'Versioned URLs'
    )
  })

  it('omits the header and rows of an empty group', () => {
    const wrapper = makeWrapper({
      groups: [linkedGroup, { key: 'available', label: 'Available to link', deployments: [] }]
    })

    expect(wrapper.find('[data-testid="release-composition__ds-group-linked"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="release-composition__ds-group-available"]').exists()).toBe(
      false
    )

    expect(wrapper.find('[data-testid="release-composition__ds-row-ds-3"]').exists()).toBe(false)
  })

  it('toggles selection on row click (add then remove) and crosses group boundaries', async () => {
    const wrapper = makeWrapper({ modelValue: [] })

    await wrapper.find('[data-testid="release-composition__ds-row-ds-1"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['ds-1']])

    const preselected = makeWrapper({ modelValue: ['ds-1'] })

    await preselected.find('[data-testid="release-composition__ds-row-ds-1"]').trigger('click')
    expect(preselected.emitted('update:modelValue')?.at(-1)).toEqual([[]])

    const withLinked = makeWrapper({ modelValue: ['ds-1'] })

    await withLinked.find('[data-testid="release-composition__ds-row-ds-3"]').trigger('click')
    expect(withLinked.emitted('update:modelValue')?.at(-1)).toEqual([['ds-1', 'ds-3']])
  })

  it('renders no environment or workloads elements for any row', () => {
    const wrapper = makeWrapper()

    for (const id of ['ds-1', 'ds-2', 'ds-3']) {
      expect(
        wrapper.find(`[data-testid="release-composition__ds-environment-${id}"]`).exists()
      ).toBe(false)
      expect(wrapper.find(`[data-testid="release-composition__ds-workloads-${id}"]`).exists()).toBe(
        false
      )
    }
  })

  it('exposes each row as an accessible checkbox with aria-label equal to the name', () => {
    const wrapper = makeWrapper({ modelValue: ['ds-2'] })

    const rowOne = wrapper.find('[data-testid="release-composition__ds-row-ds-1"]')
    expect(rowOne.attributes('role')).toBe('checkbox')
    expect(rowOne.attributes('aria-label')).toBe('production-edge')
    expect(rowOne.attributes('aria-checked')).toBe('false')

    const rowTwo = wrapper.find('[data-testid="release-composition__ds-row-ds-2"]')
    expect(rowTwo.attributes('aria-checked')).toBe('true')
  })

  it('toggles selection via keyboard (Enter and Space)', async () => {
    const enterWrapper = makeWrapper({ modelValue: [] })

    await enterWrapper
      .find('[data-testid="release-composition__ds-row-ds-1"]')
      .trigger('keydown.enter')
    expect(enterWrapper.emitted('update:modelValue')?.at(-1)).toEqual([['ds-1']])

    const spaceWrapper = makeWrapper({ modelValue: ['ds-3'] })

    await spaceWrapper
      .find('[data-testid="release-composition__ds-row-ds-3"]')
      .trigger('keydown.space')
    expect(spaceWrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]])
  })
})
