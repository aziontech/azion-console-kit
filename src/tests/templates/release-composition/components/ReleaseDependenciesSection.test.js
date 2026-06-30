import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ReleaseDependenciesSection from '@/templates/release-composition/components/ReleaseDependenciesSection.vue'

// The two nested fields are exercised in their own suites; here they are stubbed
// to plain emitters so this suite isolates the section's job: grouping, counts,
// the per-group "Add" affordance, per-row remove, the empty group message, and
// forwarding add/instance/version/remove/toggle events with the right payload
// shape.
const stubs = {
  ResourceSelectField: {
    name: 'release-resource-select-field',
    props: ['modelValue', 'options', 'label', 'placeholder'],
    emits: ['update:modelValue'],
    template: `<div class="resource-select-field" :data-label="label"></div>`
  },
  ResourceVersionField: {
    name: 'release-resource-version-field',
    props: ['modelValue', 'versions', 'showResource'],
    emits: ['update:modelValue'],
    template: `<div class="resource-version-field"></div>`
  },
  PrimeButton: {
    name: 'PrimeButton',
    props: ['icon', 'label', 'ariaLabel'],
    emits: ['click'],
    template: `<button :data-testid="$attrs['data-testid']" @click="$emit('click')">{{ label }}</button>`
  },
  PrimeTag: {
    name: 'PrimeTag',
    props: ['value', 'severity'],
    template: `<span class="prime-tag" :data-testid="$attrs['data-testid']">{{ value }}</span>`
  }
}

const makeInstance = (overrides = {}) => ({
  id: 0,
  resourceId: 'fn-1',
  name: 'Function',
  options: [{ label: 'fn-one', value: 'fn-1' }],
  version: 'LATEST',
  versionOptions: [{ label: 'v3', value: 'v3' }],
  ...overrides
})

const collections = [
  {
    type: 'function',
    label: 'Function',
    icon: 'pi pi-bolt',
    count: 2,
    open: true,
    instances: [makeInstance({ id: 0 }), makeInstance({ id: 1, resourceId: 'fn-2' })]
  },
  {
    type: 'connector',
    label: 'Connector',
    icon: 'pi pi-link',
    count: 0,
    open: false,
    instances: []
  }
]

const makeWrapper = (props = {}) =>
  mount(ReleaseDependenciesSection, {
    props: { collections, ...props },
    global: { stubs }
  })

describe('ReleaseDependenciesSection', () => {
  it('renders one collapsible group per collection with its count tag', () => {
    const wrapper = makeWrapper()

    expect(wrapper.find('[data-testid="release-composition__deps-group-function"]').exists()).toBe(
      true
    )
    expect(wrapper.find('[data-testid="release-composition__deps-group-connector"]').exists()).toBe(
      true
    )

    expect(wrapper.find('[data-testid="release-composition__deps-count-function"]').text()).toBe(
      '2'
    )
    expect(wrapper.find('[data-testid="release-composition__deps-count-connector"]').text()).toBe(
      '0'
    )
  })

  it('does not render a per-group "Add" control (instances are seeded automatically)', () => {
    const wrapper = makeWrapper()

    expect(wrapper.find('[data-testid="release-composition__deps-add-function"]').exists()).toBe(
      false
    )
    expect(wrapper.emitted('add-instance')).toBeFalsy()
  })

  it('renders a row with an instance select, a version field and a remove control per instance', () => {
    const wrapper = makeWrapper()

    const row = wrapper.find('[data-testid="release-composition__deps-row-function-0"]')
    expect(row.exists()).toBe(true)
    expect(row.findComponent({ name: 'release-resource-select-field' }).exists()).toBe(true)
    expect(row.findComponent({ name: 'release-resource-version-field' }).exists()).toBe(true)
    expect(
      wrapper.find('[data-testid="release-composition__deps-remove-function-0"]').exists()
    ).toBe(true)

    // Both function instances render (the group is open).
    expect(wrapper.find('[data-testid="release-composition__deps-row-function-1"]').exists()).toBe(
      true
    )
  })

  it('hides the body (rows) for a collapsed group', () => {
    const wrapper = makeWrapper()

    // connector group is closed.
    expect(wrapper.find('[data-testid="release-composition__deps-body-connector"]').exists()).toBe(
      false
    )
  })

  it('shows the empty "No {label} instances" message for an open group with no instances', () => {
    const wrapper = makeWrapper({
      collections: [
        {
          type: 'waf',
          label: 'WAF Rule',
          icon: 'pi pi-shield',
          count: 0,
          open: true,
          instances: []
        }
      ]
    })

    const empty = wrapper.find('[data-testid="release-composition__deps-empty-waf"]')
    expect(empty.exists()).toBe(true)
    expect(empty.text()).toBe('No WAF Rule instances in this release.')
  })

  it('emits toggle-group with the collection type when the group header is clicked', async () => {
    const wrapper = makeWrapper()

    await wrapper
      .find('[data-testid="release-composition__deps-group-header-connector"]')
      .trigger('click')

    expect(wrapper.emitted('toggle-group')?.at(-1)).toEqual(['connector'])
  })

  it('emits update:instance-resource with { type, id, value } when an instance selection changes', () => {
    const wrapper = makeWrapper()

    wrapper
      .find('[data-testid="release-composition__deps-row-function-1"]')
      .findComponent({ name: 'release-resource-select-field' })
      .vm.$emit('update:modelValue', 'fn-7')

    expect(wrapper.emitted('update:instance-resource')?.at(-1)).toEqual([
      { type: 'function', id: 1, value: 'fn-7' }
    ])
  })

  it('emits update:instance-version with { type, id, value } when a version changes', () => {
    const wrapper = makeWrapper()

    wrapper
      .find('[data-testid="release-composition__deps-row-function-0"]')
      .findComponent({ name: 'release-resource-version-field' })
      .vm.$emit('update:modelValue', 'v9')

    expect(wrapper.emitted('update:instance-version')?.at(-1)).toEqual([
      { type: 'function', id: 0, value: 'v9' }
    ])
  })

  it('emits remove-instance with { type, id } when the remove control is clicked', async () => {
    const wrapper = makeWrapper()

    await wrapper
      .find('[data-testid="release-composition__deps-remove-function-1"]')
      .trigger('click')

    expect(wrapper.emitted('remove-instance')?.at(-1)).toEqual([{ type: 'function', id: 1 }])
  })
})
