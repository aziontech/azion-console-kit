import { defineComponent, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import VersionTabAddButton from '@/views/EdgeApplications/v6/tabs/VersionTabAddButton.vue'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'

// The button is the active-tab "+ Add" action. It renders only when the active tab
// supports create AND the version is editable, derives its label from the tab, and
// forwards a click to the active tab component's openCreateDrawer(). The real
// useVersionContext runs (inject with the default editable context, or a provided
// read-only one) — no versioning module is mocked. PrimeButton is stubbed to a
// native <button> so assertions target rendered DOM and the parent callback, never
// internal state.

const TESTID = 'application-v6-edit__add-button'

const PrimeButtonStub = defineComponent({
  name: 'PrimeButton',
  props: {
    label: { type: String, default: '' }
  },
  emits: ['click'],
  template: `<button type="button" @click="$emit('click', $event)">{{ label }}</button>`
})

const mountButton = ({ props = {}, readOnly } = {}) => {
  const provide =
    readOnly === undefined ? {} : { [VERSION_CONTEXT_KEY]: { readOnly: ref(readOnly) } }

  return mount(VersionTabAddButton, {
    props,
    global: {
      provide,
      stubs: { PrimeButton: PrimeButtonStub }
    }
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('VersionTabAddButton — visibility gating', () => {
  it('renders when the active tab supports create and the version is editable', () => {
    const wrapper = mountButton({
      props: { tab: { canCreate: true, addButtonLabel: 'Cache Setting' } }
    })
    expect(wrapper.find(`[data-testid="${TESTID}"]`).exists()).toBe(true)
  })

  it('does not render when there is no active tab', () => {
    const wrapper = mountButton({ props: { tab: null } })
    expect(wrapper.find(`[data-testid="${TESTID}"]`).exists()).toBe(false)
  })

  it('does not render when the active tab cannot create', () => {
    const wrapper = mountButton({ props: { tab: { canCreate: false, addButtonLabel: 'Nope' } } })
    expect(wrapper.find(`[data-testid="${TESTID}"]`).exists()).toBe(false)
  })

  it('does not render when the version is read-only, even if the tab supports create', () => {
    const wrapper = mountButton({
      props: { tab: { canCreate: true, addButtonLabel: 'Cache Setting' } },
      readOnly: true
    })
    expect(wrapper.find(`[data-testid="${TESTID}"]`).exists()).toBe(false)
  })
})

describe('VersionTabAddButton — label', () => {
  it('derives the label from the active tab addButtonLabel', () => {
    const wrapper = mountButton({
      props: { tab: { canCreate: true, addButtonLabel: 'Device Group' } }
    })
    expect(wrapper.find(`[data-testid="${TESTID}"]`).text()).toBe('Device Group')
  })

  it('falls back to "Create" when the tab omits addButtonLabel', () => {
    const wrapper = mountButton({ props: { tab: { canCreate: true } } })
    expect(wrapper.find(`[data-testid="${TESTID}"]`).text()).toBe('Create')
  })
})

describe('VersionTabAddButton — click behavior', () => {
  it('calls openCreateDrawer on the active tab component when clicked', async () => {
    const openCreateDrawer = vi.fn()
    const wrapper = mountButton({
      props: {
        tab: { canCreate: true, addButtonLabel: 'Rule' },
        activeComponent: { openCreateDrawer }
      }
    })

    await wrapper.find(`[data-testid="${TESTID}"]`).trigger('click')

    expect(openCreateDrawer).toHaveBeenCalledTimes(1)
  })

  it('is a safe no-op when there is no active component to open', async () => {
    const wrapper = mountButton({
      props: {
        tab: { canCreate: true, addButtonLabel: 'Rule' },
        activeComponent: null
      }
    })

    const button = wrapper.find(`[data-testid="${TESTID}"]`)
    await button.trigger('click')

    // No crash on the optional-chained call; the button remains rendered.
    expect(button.exists()).toBe(true)
  })
})

describe('VersionTabAddButton — testid prefix', () => {
  it('scopes the testid to the provided prefix', () => {
    const wrapper = mountButton({
      props: { tab: { canCreate: true }, testidPrefix: 'firewall-v6-edit' }
    })
    expect(wrapper.find('[data-testid="firewall-v6-edit__add-button"]').exists()).toBe(true)
  })
})
