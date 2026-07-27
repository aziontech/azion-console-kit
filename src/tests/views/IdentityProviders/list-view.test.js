import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import ListView from '@/views/IdentityProviders/ListView.vue'

const { mocks, tableState, ListTableStub, SimpleStub } = vi.hoisted(() => {
  const state = { data: [], reload: () => {} }

  const stub = { name: 'stub', render: () => null }

  const listTableStub = {
    name: 'list-table',
    props: {
      listService: { type: Function, default: undefined },
      columns: { type: [Array, Object], default: () => [] },
      actions: { type: Array, default: () => [] },
      editInDrawer: { type: Function, default: undefined },
      exportFileName: { type: String, default: '' },
      emptyListMessage: { type: String, default: '' }
    },
    emits: ['on-load-data'],
    setup(_props, { expose }) {
      expose({
        reload: (...args) => state.reload(...args),
        get data() {
          return state.data
        }
      })
      return () => null
    }
  }

  return {
    mocks: { toastAdd: () => {} },
    tableState: state,
    ListTableStub: listTableStub,
    SimpleStub: stub
  }
})

vi.mock('@aziontech/webkit/use-toast', () => ({
  useToast: () => ({ add: mocks.toastAdd })
}))

vi.mock('@/components/list-table/ListTable.vue', () => ({ default: ListTableStub }))
vi.mock('@/components/list-table', () => ({
  ListTable: ListTableStub,
  ListTableSimple: SimpleStub,
  ListTableGraphic: SimpleStub,
  DataTableActionsButtons: SimpleStub,
  default: ListTableStub
}))
vi.mock('@aziontech/webkit/empty-results-block', () => ({ default: SimpleStub }))
vi.mock('@/components/list-table/columns/column-builder', () => ({
  columnBuilder: () => SimpleStub
}))
vi.mock('@/templates/page-heading-block', () => ({ default: SimpleStub }))
vi.mock('@/composables/useDeleteDialog', () => ({
  useDeleteDialog: () => ({ openDeleteDialog: () => {} })
}))

const AZION_SSO = 'azion-default-sso'
const SAML_UUID = 'b7f3c2a1-4e8d-4c6b-9a1f-2d5e6f7a8b9c'
const OIDC_UUID = 'a1c2e3f4-5d6b-4a7c-8e9f-0a1b2c3d4e5f'

const buildRouter = () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/identity-providers', component: { template: '<div />' } },
      { path: '/identity-providers/create', component: { template: '<div />' } },
      {
        path: '/identity-providers/edit/:protocol/:id',
        component: { template: '<div />' }
      }
    ]
  })
  return router
}

const mountListView = async ({ setIdentityProviderStatusService }) => {
  const router = buildRouter()
  router.push('/identity-providers')
  await router.isReady()

  const wrapper = mount(ListView, {
    props: {
      listIdentityProvidersService: vi.fn().mockResolvedValue({ body: [], count: 0 }),
      deleteSAMLIdentityProviderService: vi.fn(),
      deleteOIDCIdentityProviderService: vi.fn(),
      setIdentityProviderStatusService,
      documentationService: vi.fn()
    },
    global: {
      plugins: [router]
    }
  })

  await flushPromises()

  return wrapper
}

const invokeSetAsActive = async (wrapper, item) => {
  const table = wrapper.findComponent(ListTableStub)
  const actions = table.props('actions')
  const setActive = actions.find((action) => action.label === 'Set as active')
  expect(setActive, 'expected a "Set as active" row action').toBeTruthy()

  await setActive.commandAction(item)
  await flushPromises()
}

describe('Views/IdentityProviders/ListView — Set as active (ENG-37379)', () => {
  beforeEach(() => {
    mocks.toastAdd = vi.fn()
    tableState.data = []
    tableState.reload = vi.fn()
  })

  it('rolls back to Azion SSO using the real UUID of the active SAML2 provider', async () => {
    const setIdentityProviderStatusService = vi
      .fn()
      .mockResolvedValue('Identity provider updated successfully.')

    const wrapper = await mountListView({ setIdentityProviderStatusService })

    tableState.data = [
      { id: SAML_UUID, name: 'Corp SAML', protocol: 'SAML', isActive: true },
      {
        id: AZION_SSO,
        name: 'Internal Identity Source',
        protocol: 'Internal Identity Source',
        isActive: false
      }
    ]

    await invokeSetAsActive(wrapper, {
      id: AZION_SSO,
      protocol: 'Internal Identity Source',
      isActive: false
    })

    expect(setIdentityProviderStatusService).toHaveBeenCalledTimes(1)
    expect(setIdentityProviderStatusService).toHaveBeenCalledWith({
      id: SAML_UUID,
      protocol: 'SAML',
      isActive: false
    })
    const [payload] = setIdentityProviderStatusService.mock.calls[0]
    expect(payload.id).not.toBe(AZION_SSO)
  })

  it('does not call the service and shows an info toast when no federated provider is active', async () => {
    const setIdentityProviderStatusService = vi.fn().mockResolvedValue('ok')

    const wrapper = await mountListView({ setIdentityProviderStatusService })

    tableState.data = [
      {
        id: AZION_SSO,
        name: 'Internal Identity Source',
        protocol: 'Internal Identity Source',
        isActive: true
      }
    ]

    await invokeSetAsActive(wrapper, {
      id: AZION_SSO,
      protocol: 'Internal Identity Source',
      isActive: false
    })

    expect(setIdentityProviderStatusService).not.toHaveBeenCalled()
    expect(mocks.toastAdd).toHaveBeenCalledTimes(1)
    expect(mocks.toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info' }))
  })

  it('activates a federated provider directly with isActive true (existing behavior)', async () => {
    const setIdentityProviderStatusService = vi
      .fn()
      .mockResolvedValue('Identity provider updated successfully.')

    const wrapper = await mountListView({ setIdentityProviderStatusService })

    tableState.data = [
      { id: OIDC_UUID, name: 'Corp OIDC', protocol: 'OIDC', isActive: false },
      {
        id: AZION_SSO,
        name: 'Internal Identity Source',
        protocol: 'Internal Identity Source',
        isActive: true
      }
    ]

    await invokeSetAsActive(wrapper, {
      id: OIDC_UUID,
      protocol: 'OIDC',
      isActive: false
    })

    expect(setIdentityProviderStatusService).toHaveBeenCalledTimes(1)
    expect(setIdentityProviderStatusService).toHaveBeenCalledWith({
      id: OIDC_UUID,
      protocol: 'OIDC',
      isActive: true
    })
  })
})
