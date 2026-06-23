import { defineComponent, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ListWafRulesAllowed from '@/views/WafRules/ListWafRulesAllowed.vue'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'

// Task 8.3 (Property P6, WAF): the Allowed Rules list is a drop-in — when a
// versioned `service` facade is injected its CRUD routes through the facade
// (no fork to wafService), and an immutable version disables every write.

vi.mock('vue-router', () => ({ useRoute: () => ({ params: { id: 'legacy-id' } }) }))

// Stub ListTable to surface the `actions` and CRUD services the component wires.
const ListTableStub = defineComponent({
  name: 'ListTable',
  props: ['listService', 'actions'],
  template: '<div data-testid="list-table" />'
})

const tracker = {
  product: {
    clickToEdit: () => ({ track: () => {} }),
    clickToCreate: () => ({ track: () => {} })
  }
}

const buildFacade = () => ({
  list: vi.fn(() => Promise.resolve({ count: 0, body: [] })),
  load: vi.fn(() => Promise.resolve({})),
  create: vi.fn(() => Promise.resolve({ id: 9 })),
  edit: vi.fn(() => Promise.resolve('ok')),
  remove: vi.fn(() => Promise.resolve())
})

const mountList = ({ readOnly, service }) =>
  mount(ListWafRulesAllowed, {
    props: {
      documentationServiceAllowed: () => {},
      service,
      wafId: '42',
      versionId: 'v1'
    },
    global: {
      provide: {
        [VERSION_CONTEXT_KEY]: { readOnly: ref(readOnly) },
        tracker
      },
      stubs: {
        ListTable: ListTableStub,
        CreateDrawerBlock: true,
        EditDrawerBlock: true,
        EmptyResultsBlock: true,
        PrimeButton: true,
        Illustration: true
      }
    }
  })

const listTable = (wrapper) => wrapper.findComponent(ListTableStub)

describe('WafRules v6 — Allowed Rules drop-in + read-only', () => {
  it('routes list through the injected versioned facade (no fork)', async () => {
    const service = buildFacade()
    const wrapper = mountList({ readOnly: false, service })
    await flushPromises()

    await listTable(wrapper).props('listService')({ page: 1 })
    expect(service.list).toHaveBeenCalledWith({ page: 1 })
  })

  it('keeps the Delete action in an editable version', () => {
    const wrapper = mountList({ readOnly: false, service: buildFacade() })
    expect(listTable(wrapper).props('actions')).toHaveLength(1)
  })

  it('removes write actions in an immutable version', () => {
    const wrapper = mountList({ readOnly: true, service: buildFacade() })
    expect(listTable(wrapper).props('actions')).toHaveLength(0)
  })

  it('does not open the create drawer when read-only', async () => {
    const wrapper = mountList({ readOnly: true, service: buildFacade() })
    wrapper.vm.openCreateDrawer()
    await flushPromises()
    expect(wrapper.findComponent({ name: 'CreateDrawerBlock' }).exists()).toBe(false)
  })

  it('deletes through the facade with the row id', async () => {
    const service = buildFacade()
    const wrapper = mountList({ readOnly: false, service })
    const [deleteAction] = listTable(wrapper).props('actions')
    await deleteAction.service(7)
    expect(service.remove).toHaveBeenCalledWith(7)
  })
})
