import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import ListView from '../ListView.vue'

// Mock dos serviços
vi.mock('@/services/edge-sql-services', () => ({
  listDatabasesService: vi.fn(() => Promise.resolve({
    body: [
      {
        id: 1,
        name: 'test-db',
        status: 'active',
        clientId: 'client-123',
        createdAt: '2024-01-01T00:00:00Z',
        lastModify: '01/01/2024'
      }
    ],
    statusCode: 200,
    count: 1
  })),
  deleteDatabaseService: vi.fn()
}))

// Mock do router
const mockRouter = {
  push: vi.fn()
}

// Mock do toast
const mockToast = {
  add: vi.fn()
}

describe('AzionSQL ListView', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(ListView, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn
          })
        ],
        mocks: {
          $router: mockRouter,
          $toast: mockToast
        },
        stubs: {
          ContentBlock: {
            template: '<div><slot name="heading" /><slot name="content" /></div>'
          },
          PageHeadingBlock: {
            template: '<div>Edge SQL</div>'
          },
          FetchListTableBlock: {
            template: '<div data-testid="table-block">Database List</div>',
            props: ['listService', 'columns', 'actions']
          },
          EmptyResultsBlock: {
            template: '<div data-testid="empty-block">No databases</div>'
          },
          CreateDatabaseDialog: {
            template: '<button data-testid="create-button">Create Database</button>'
          }
        },
        provide: {
          tracker: {
            product: {
              clickToCreate: vi.fn(),
              clickToEdit: vi.fn()
            }
          }
        }
      },
      props: {
        documentationService: () => 'https://docs.azion.com/sql'
      }
    })
  })

  it('deve renderizar o título da página', () => {
    expect(wrapper.text()).toContain('Edge SQL')
  })

  it('deve configurar as colunas corretamente', () => {
    const columns = wrapper.vm.getColumns
    
    expect(columns).toHaveLength(5)
    expect(columns.map(col => col.field)).toEqual([
      'name',
      'status', 
      'clientId',
      'createdAt',
      'lastModify'
    ])
  })

  it('deve configurar as ações de delete', () => {
    const actions = wrapper.vm.actions
    
    expect(actions).toHaveLength(1)
    expect(actions[0].type).toBe('delete')
    expect(actions[0].label).toBe('Deletar')
  })

  it('deve navegar para a interface do banco ao editar', () => {
    const database = {
      id: 1,
      name: 'test-db'
    }
    
    wrapper.vm.handleTrackEditEvent(database)
    
    expect(mockRouter.push).toHaveBeenCalledWith('/edge-sql/database/test-db')
  })

  it('deve definir os campos da API corretamente', () => {
    const expectedFields = [
      'id',
      'name',
      'client_id',
      'status',
      'created_at',
      'updated_at'
    ]
    
    expect(wrapper.vm.DATABASE_API_FIELDS).toEqual(expectedFields)
  })
}) 