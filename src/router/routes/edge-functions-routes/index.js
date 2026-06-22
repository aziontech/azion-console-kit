import * as Helpers from '@/helpers'
import { hasFlagUseV6Configurations } from '@/composables/user-flag'

/** @type {import('vue-router').RouteRecordRaw} */
export const edgeFunctionsRoutes = {
  path: '/functions',
  name: 'functions',
  children: [
    {
      path: '',
      name: 'list-functions',
      component: () => import('@views/EdgeFunctions/ListView.vue'),
      props: {
        documentationService: Helpers.documentationCatalog.edgeFunctions
      },
      meta: {
        title: 'Functions',
        breadCrumbs: [
          {
            label: 'Functions',
            to: '/functions'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-functions',
      component: () => import('@views/EdgeFunctions/CreateView.vue'),
      meta: {
        title: 'Create Function',
        breadCrumbs: [
          {
            label: 'Functions',
            to: '/functions'
          },
          {
            label: 'Create',
            to: '/functions/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-functions',
      component: () =>
        hasFlagUseV6Configurations()
          ? import('@views/EdgeFunctions/v6/EditView.vue')
          : import('@views/EdgeFunctions/EditView.vue'),
      props: {
        updatedRedirect: 'list-functions'
      },
      meta: {
        title: 'Edit Function',
        breadCrumbs: [
          {
            label: 'Functions',
            to: '/functions'
          },
          {
            label: 'Edit Function',
            dynamic: true,
            routeParam: 'id',
            toRoute: { name: 'edit-functions', params: ['id'] }
          }
        ]
      }
    },
    {
      path: 'edit/:id/versions/:versionId',
      name: 'edit-functions-version',
      component: () => import('@views/EdgeFunctions/v6/VersionEditView.vue'),
      meta: {
        title: 'Edit Version',
        flag: 'use_v6_configurations',
        breadCrumbs: [
          {
            label: 'Functions',
            to: '/functions'
          },
          {
            label: 'Edit Function',
            dynamic: true,
            routeParam: 'id',
            toRoute: { name: 'edit-functions', params: ['id'] }
          },
          {
            label: 'Version',
            dynamic: true,
            routeParam: 'versionId',
            useParamValue: true
          }
        ]
      }
    }
  ]
}
