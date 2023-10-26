import * as Helpers from '@/helpers'
import * as VariablesService from '@/services/variables-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const variablesRoutes = {
  path: '/variables',
  name: 'variables',
  children: [
    {
      path: '',
      name: 'list-variables',
      component: () => import('@views/Variables/ListView.vue'),
      props: {
        listVariablesService: VariablesService.listVariablesService,
        deleteVariablesService: VariablesService.deleteVariablesService,
        documentationService: Helpers.documentationCatalog.variables,
        clipboardWrite: Helpers.clipboardWrite
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Variables',
            to: '/variables'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-variables',
      component: () => import('@views/Variables/CreateView.vue'),
      props: {
        createVariablesService: VariablesService.createVariablesService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Variables',
            to: '/variables'
          },
          {
            label: 'Create Variables',
            to: '/variables/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-variables',
      component: () => import('@views/Variables/EditView.vue'),
      props: {
        editVariableService: VariablesService.editVariableService,
        loadVariableService: VariablesService.loadVariableService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Variables',
            to: '/variables'
          },
          {
            label: 'Edit Variables'
          }
        ]
      }
    }
  ]
}
