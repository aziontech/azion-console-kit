import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ResourceVersionField from '@/templates/release-composition/components/ResourceVersionField.vue'
import { LATEST_READY } from '@/templates/release-composition/version-options'

const versions = [
  {
    id: 'v-1',
    value: 'v-1',
    label: '0E3A6A57',
    createdAt: '2026-06-16T10:30:00Z',
    author: 'user@azion.com',
    isCurrent: true
  }
]

const makeWrapper = (props = {}) =>
  mount(ResourceVersionField, {
    props: {
      resourceName: 'my-application',
      versions,
      modelValue: 'v-1',
      ...props
    }
  })

describe('ResourceVersionField', () => {
  it('renders the resource name with an icon', () => {
    const wrapper = makeWrapper()
    expect(wrapper.find('[data-testid="release-composition__resource-name"]').text()).toContain(
      'my-application'
    )
  })

  it('builds grouped options with the Track latest sentinel on top and a pinned group', () => {
    const wrapper = makeWrapper()
    // the component's observable contract: the option groups it HANDS to the
    // Dropdown (child prop), not its internal computed
    const groups = wrapper.findComponent({ name: 'Dropdown' }).props('options')

    expect(groups[0].items[0].value).toBe(LATEST_READY)
    expect(groups[0].items[0].isLatest).toBe(true)
    expect(groups[1].label).toBe('Pin a Ready version')
    expect(groups[1].items).toEqual(versions)
  })

  it('renders the latest-Ready selected value when modelValue is LATEST', () => {
    const wrapper = makeWrapper({ modelValue: LATEST_READY })

    expect(wrapper.find('[data-testid="release-composition__version-select"]').text()).toContain(
      'latest Ready'
    )
  })

  it('emits update:modelValue on version change', () => {
    const wrapper = makeWrapper()
    wrapper.findComponent({ name: 'Dropdown' }).vm.$emit('update:modelValue', 'v-1')
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['v-1'])
  })

  it('shows the required error when invalid', () => {
    const wrapper = makeWrapper({ invalid: true })
    expect(wrapper.find('[data-testid="release-composition__version-error"]').exists()).toBe(true)
  })

  it('renders the build link and hides the picker when there are no versions and a build route is set', () => {
    const wrapper = mount(ResourceVersionField, {
      props: {
        versions: [],
        modelValue: LATEST_READY,
        buildRoute: { name: 'edit-application', params: { id: '10' } },
        resourceLabel: 'Application'
      },
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } }
    })

    expect(wrapper.find('[data-testid="release-composition__version-build"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="release-composition__version-build-link"]').exists()).toBe(
      true
    )
    expect(wrapper.findComponent({ name: 'Dropdown' }).exists()).toBe(false)
  })

  it('keeps the picker while versions are still loading (no build link yet)', () => {
    const wrapper = mount(ResourceVersionField, {
      props: {
        versions: [],
        loading: true,
        buildRoute: { name: 'edit-application', params: { id: '10' } }
      },
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } }
    })

    expect(wrapper.find('[data-testid="release-composition__version-build"]').exists()).toBe(false)
  })

  it('keeps the picker when there are no versions but no build route (legacy drawer untouched)', () => {
    const wrapper = makeWrapper({ versions: [] })

    expect(wrapper.find('[data-testid="release-composition__version-build"]').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'Dropdown' }).exists()).toBe(true)
  })
})
