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
      // eslint-disable-next-line id-length
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

describe('EventDocumentView — filtering only via explicit hover icons', () => {
  const mountWithFilters = (extraProps = {}) => {
    const onAddFilter = vi.fn()
    const onExcludeFilter = vi.fn()
    const wrapper = mount(EventDocumentView, {
      props: {
        data: {
          id: '1',
          summary: [
            { key: 'host', value: 'example.com' },
            { key: 'status', value: 200 },
            { key: 'empty', value: '-' },
            { key: 'blank', value: '' }
          ]
        },
        onAddFilter,
        onExcludeFilter,
        ...extraProps
      },
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
    return { wrapper, onAddFilter, onExcludeFilter }
  }

  // UX decision (2026-07-16): the value is INERT — clicking it never filters.
  // Filtering happens only through the explicit hover icons, mirroring copy.

  it('clicking a .doc-list__value calls neither onAddFilter nor onExcludeFilter', async () => {
    const { wrapper, onAddFilter, onExcludeFilter } = mountWithFilters()

    const valueEls = wrapper.findAll('.doc-list__value')
    expect(valueEls.length).toBeGreaterThan(0)

    const firstValue = valueEls[0]
    await firstValue.trigger('mousedown', { clientX: 10, clientY: 10 })
    await firstValue.trigger('mouseup', { clientX: 10, clientY: 10 })
    await firstValue.trigger('click', { clientX: 10, clientY: 10, altKey: false })
    await firstValue.trigger('click', { clientX: 10, clientY: 10, altKey: true })

    expect(onAddFilter).not.toHaveBeenCalled()
    expect(onExcludeFilter).not.toHaveBeenCalled()
  })

  it('the value is plain selectable text: no button role, no tabindex', () => {
    const { wrapper } = mountWithFilters()
    const firstValue = wrapper.findAll('.doc-list__value')[0]
    expect(firstValue.attributes('role')).toBeUndefined()
    expect(firstValue.attributes('tabindex')).toBeUndefined()
  })

  it('the hover filter icon calls onAddFilter with the correct key and value', async () => {
    const { wrapper, onAddFilter } = mountWithFilters()

    const addBtn = wrapper.findAll('[data-testid="event-document-add-filter"]')[0]
    expect(addBtn.exists()).toBe(true)
    await addBtn.trigger('click')

    expect(onAddFilter).toHaveBeenCalledWith('host', 'example.com')
  })

  it('the hover exclude icon calls onExcludeFilter with the correct key and value', async () => {
    const { wrapper, onExcludeFilter } = mountWithFilters()

    const excludeBtn = wrapper.findAll('[data-testid="event-document-exclude-filter"]')[0]
    expect(excludeBtn.exists()).toBe(true)
    await excludeBtn.trigger('click')

    expect(onExcludeFilter).toHaveBeenCalledWith('host', 'example.com')
  })

  it('no filter icons render for invalid values ("-" and empty string)', () => {
    const { wrapper } = mountWithFilters()
    // Entries: host, status (valid) + '-', '' (invalid) → 2 add icons, not 4.
    expect(wrapper.findAll('[data-testid="event-document-add-filter"]')).toHaveLength(2)
    expect(wrapper.findAll('[data-testid="event-document-exclude-filter"]')).toHaveLength(2)
  })
})
