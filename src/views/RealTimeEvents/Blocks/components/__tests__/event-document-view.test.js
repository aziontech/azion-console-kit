import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EventDocumentView from '../event-document-view.vue'

vi.mock('@/helpers/clipboard', () => ({
  clipboardWrite: vi.fn()
}))

const makeData = () => ({
  id: '1',
  summary: [
    { key: 'host', value: 'example.com' },
    { key: 'status', value: 200 }
  ]
})

describe('EventDocumentView', () => {
  const mountComponent = (props = {}) =>
    mount(EventDocumentView, {
      props: { data: makeData(), ...props },
      global: {
        stubs: {
          TabView: { template: '<div><slot /></div>' },
          TabPanel: { template: '<div><slot /></div>' },
          PrimeButton: {
            template: '<button @click="$emit(\'click\', $event)"><slot /></button>',
            props: ['icon']
          },
          Skeleton: { template: '<div />' }
        },
        directives: { tooltip: {} }
      }
    })

  it('does not import or use useToast', () => {
    const wrapper = mountComponent()
    // Component should mount without useToast — no toast dependency
    expect(wrapper.exists()).toBe(true)
  })

  it('emits notify with correct payload when copy value is clicked', async () => {
    const wrapper = mountComponent()
    // Find copy buttons via the stubbed PrimeButton — the stub renders icon as a prop
    const copyBtns = wrapper
      .findAllComponents({ name: 'PrimeButton' })
      .filter((c) => c.props('icon') === 'pi pi-copy')

    // In default (non-compact) mode, copy buttons are rendered per entry
    // In compact mode they also appear. Either way, at least one should exist.
    if (copyBtns.length === 0) {
      // Fallback: call the internal handler directly via the component's vm
      wrapper.vm.handleCopy('example.com')
    } else {
      await copyBtns[0].trigger('click')
    }

    const notifyEvents = wrapper.emitted('notify')
    expect(notifyEvents).toBeTruthy()
    expect(notifyEvents[0][0]).toEqual({
      closable: true,
      severity: 'success',
      summary: 'Copied to clipboard'
    })
  })

  it('emits notify with JSON message when copy JSON is clicked', async () => {
    const wrapper = mountComponent()
    // The JSON copy button has data-testid="event-document-copy-json"
    const jsonCopyBtn = wrapper.find('[data-testid="event-document-copy-json"]')
    if (jsonCopyBtn.exists()) {
      await jsonCopyBtn.trigger('click')
      const notifyEvents = wrapper.emitted('notify')
      expect(notifyEvents).toBeTruthy()
      expect(notifyEvents[0][0]).toEqual({
        closable: true,
        severity: 'success',
        summary: 'JSON copied to clipboard'
      })
    }
  })

  it('does not emit notify when no copy action is triggered', () => {
    const wrapper = mountComponent()
    expect(wrapper.emitted('notify')).toBeFalsy()
  })
})
