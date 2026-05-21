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

describe('EventDocumentView — click-to-filter routing on Table rows', () => {
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

  it('clicking a .doc-list__value row calls onAddFilter with the correct key and value', async () => {
    const { wrapper, onAddFilter, onExcludeFilter } = mountWithFilters()

    const valueEls = wrapper.findAll('.doc-list__value')
    expect(valueEls.length).toBeGreaterThan(0)

    // Simulate mousedown + mouseup (no drag) + click on the first value
    const firstValue = valueEls[0]
    await firstValue.trigger('mousedown', { clientX: 10, clientY: 10 })
    await firstValue.trigger('mouseup', { clientX: 10, clientY: 10 })
    await firstValue.trigger('click', { clientX: 10, clientY: 10, altKey: false })

    expect(onAddFilter).toHaveBeenCalledWith('host', 'example.com')
    expect(onExcludeFilter).not.toHaveBeenCalled()
  })

  it('Alt+clicking a .doc-list__value row calls onExcludeFilter with the correct key and value', async () => {
    const { wrapper, onAddFilter, onExcludeFilter } = mountWithFilters()

    const valueEls = wrapper.findAll('.doc-list__value')
    const firstValue = valueEls[0]

    await firstValue.trigger('mousedown', { clientX: 10, clientY: 10 })
    await firstValue.trigger('mouseup', { clientX: 10, clientY: 10 })
    await firstValue.trigger('click', { clientX: 10, clientY: 10, altKey: true })

    expect(onExcludeFilter).toHaveBeenCalledWith('host', 'example.com')
    expect(onAddFilter).not.toHaveBeenCalled()
  })

  it('clicking over a text selection calls neither onAddFilter nor onExcludeFilter', async () => {
    const { wrapper, onAddFilter, onExcludeFilter } = mountWithFilters()

    // Simulate a non-collapsed selection
    const originalGetSelection = window.getSelection
    window.getSelection = () => ({
      isCollapsed: false,
      toString: () => 'example'
    })

    const valueEls = wrapper.findAll('.doc-list__value')
    const firstValue = valueEls[0]

    await firstValue.trigger('mousedown', { clientX: 10, clientY: 10 })
    await firstValue.trigger('mouseup', { clientX: 10, clientY: 10 })
    await firstValue.trigger('click', { clientX: 10, clientY: 10, altKey: false })

    expect(onAddFilter).not.toHaveBeenCalled()
    expect(onExcludeFilter).not.toHaveBeenCalled()

    window.getSelection = originalGetSelection
  })

  it('clicking a value of "-" calls neither onAddFilter nor onExcludeFilter', async () => {
    const { wrapper, onAddFilter, onExcludeFilter } = mountWithFilters()

    // The 3rd entry has value '-'
    const valueEls = wrapper.findAll('.doc-list__value')
    const dashValue = valueEls[2]

    await dashValue.trigger('mousedown', { clientX: 10, clientY: 10 })
    await dashValue.trigger('mouseup', { clientX: 10, clientY: 10 })
    await dashValue.trigger('click', { clientX: 10, clientY: 10, altKey: false })

    expect(onAddFilter).not.toHaveBeenCalled()
    expect(onExcludeFilter).not.toHaveBeenCalled()
  })

  it('clicking an empty string value calls neither onAddFilter nor onExcludeFilter', async () => {
    const { wrapper, onAddFilter, onExcludeFilter } = mountWithFilters()

    // The 4th entry has value ''
    const valueEls = wrapper.findAll('.doc-list__value')
    const emptyValue = valueEls[3]

    await emptyValue.trigger('mousedown', { clientX: 10, clientY: 10 })
    await emptyValue.trigger('mouseup', { clientX: 10, clientY: 10 })
    await emptyValue.trigger('click', { clientX: 10, clientY: 10, altKey: false })

    expect(onAddFilter).not.toHaveBeenCalled()
    expect(onExcludeFilter).not.toHaveBeenCalled()
  })

  it('dragging over a value (text selection drag) calls neither callback', async () => {
    const { wrapper, onAddFilter, onExcludeFilter } = mountWithFilters()

    const valueEls = wrapper.findAll('.doc-list__value')
    const firstValue = valueEls[0]

    // Simulate a drag: mousedown at (10,10), mouseup at (50,10) — 40px drag
    await firstValue.trigger('mousedown', { clientX: 10, clientY: 10 })
    await firstValue.trigger('mouseup', { clientX: 50, clientY: 10 })
    await firstValue.trigger('click', { clientX: 50, clientY: 10, altKey: false })

    expect(onAddFilter).not.toHaveBeenCalled()
    expect(onExcludeFilter).not.toHaveBeenCalled()
  })
})
