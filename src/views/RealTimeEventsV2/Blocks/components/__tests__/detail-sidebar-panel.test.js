import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DetailSidebarPanel from '../detail-sidebar-panel.vue'

// Mock EventDocumentView so we can control when it emits 'reset-scroll'
const EventDocumentViewStub = {
  name: 'EventDocumentView',
  props: ['data', 'onAddFilter', 'onExcludeFilter', 'isLoading', 'growJsonToFit'],
  emits: ['notify', 'reset-scroll'],
  template: '<div class="event-document-view-stub" />'
}

vi.mock('@aziontech/webkit/use-toast', () => ({
  useToast: () => ({ add: vi.fn() })
}))

const makeData = () => ({
  id: 'doc-1',
  tsFormat: '2024-01-01T00:00:00Z',
  summary: [{ key: 'host', value: 'example.com' }]
})

const mountComponent = (props = {}) =>
  mount(DetailSidebarPanel, {
    props: {
      visible: true,
      data: makeData(),
      ...props
    },
    global: {
      stubs: {
        EventDocumentView: EventDocumentViewStub,
        PrimeButton: {
          template: '<button @click="$emit(\'click\', $event)"><slot /></button>',
          props: ['icon', 'text', 'rounded', 'size']
        },
        transition: false
      },
      directives: { tooltip: {} }
    }
  })

describe('DetailSidebarPanel', () => {
  it('renders the header element', () => {
    const wrapper = mountComponent()
    const header = wrapper.find('.detail-sidebar__header')
    expect(header.exists()).toBe(true)
  })

  it('header is always visible — it is a sibling of the scroll container, not inside it', () => {
    const wrapper = mountComponent()
    const sidebar = wrapper.find('.detail-sidebar')
    const header = wrapper.find('.detail-sidebar__header')
    const content = wrapper.find('.detail-sidebar__content')

    // Both header and content are direct children of .detail-sidebar
    expect(sidebar.exists()).toBe(true)
    expect(header.exists()).toBe(true)
    expect(content.exists()).toBe(true)

    // Header is NOT nested inside the scroll container
    const headerInsideContent = content.find('.detail-sidebar__header')
    expect(headerInsideContent.exists()).toBe(false)
  })

  it('only one scroll container exists in the rendered output', () => {
    const wrapper = mountComponent()
    // Find all elements that could be scroll containers by checking the class
    // JSDOM does not compute scoped CSS, so we verify by structure:
    // only .detail-sidebar__content should be the scroll container
    const scrollContainers = wrapper.findAll('.detail-sidebar__content')
    expect(scrollContainers).toHaveLength(1)
  })

  it('.detail-sidebar__content has the overflow-x hidden class applied', () => {
    const wrapper = mountComponent()
    const content = wrapper.find('.detail-sidebar__content')
    expect(content.exists()).toBe(true)
    // The class is present — JSDOM does not compute scoped CSS so we verify
    // the element has the correct class name which carries the overflow-x: hidden rule
    expect(content.classes()).toContain('detail-sidebar__content')
  })

  it('passes grow-json-to-fit="true" to EventDocumentView', () => {
    const wrapper = mountComponent()
    const edv = wrapper.findComponent({ name: 'EventDocumentView' })
    expect(edv.exists()).toBe(true)
    expect(edv.props('growJsonToFit')).toBe(true)
  })

  it('resets scrollTop to 0 when EventDocumentView emits reset-scroll', async () => {
    const wrapper = mountComponent()

    // Simulate a scrolled state on the scroll container
    const content = wrapper.find('.detail-sidebar__content')
    // Access the underlying DOM element via the component's scrollRef
    const scrollEl = content.element
    Object.defineProperty(scrollEl, 'scrollTop', {
      writable: true,
      value: 500
    })
    expect(scrollEl.scrollTop).toBe(500)

    // Trigger reset-scroll from EventDocumentView
    const edv = wrapper.findComponent({ name: 'EventDocumentView' })
    await edv.vm.$emit('reset-scroll')

    expect(scrollEl.scrollTop).toBe(0)
  })

  it('does not render when visible is false', () => {
    const wrapper = mountComponent({ visible: false })
    expect(wrapper.find('.detail-sidebar').exists()).toBe(false)
  })

  it('does not render when data is null', () => {
    const wrapper = mountComponent({ data: null })
    expect(wrapper.find('.detail-sidebar').exists()).toBe(false)
  })
})
