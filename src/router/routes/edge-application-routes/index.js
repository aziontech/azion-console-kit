import * as Helpers from '@/helpers'
import * as EdgeApplicationsService from '@/services/edge-application-services'
import * as OriginsService from '@/services/edge-application-origins-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const edgeApplicationRoutes = {
  path: '/edge-applications',
  name: 'edge-applications',
  children: [
    {
      path: '',
      name: 'list-edge-applications',
      component: () => import('@views/EdgeApplications/ListView.vue'),
      props: {
        listEdgeApplicationsService: EdgeApplicationsService.listEdgeApplicationsService,
        deleteEdgeApplicationService: EdgeApplicationsService.deleteEdgeApplicationService,
        documentationService: Helpers.documentationCatalog.edgeApplication
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Applications',
            to: '/edge-applications'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-edge-application',
      component: () => import('@views/EdgeApplications/CreateView.vue'),
      props: {
        createEdgeApplicationService: EdgeApplicationsService.createEdgeApplicationService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Applications',
            to: '/edge-applications'
          },
          {
            label: 'Create Edge Application',
            to: '/edge-applications/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      children: [
        {
          path: '',
          name: 'edit-edge-application',
          component: () => import('@views/EdgeApplications/EditView.vue'),
          props: {
            listOriginsService: OriginsService.listOriginsService,
            deleteOriginsService: OriginsService.deleteOriginsService,
            editEdgeApplicationService: EdgeApplicationsService.editEdgeApplicationService
          },
          meta: {
            breadCrumbs: [
              {
                label: 'Edge Applications',
                to: '/edge-applications'
              },
              {
                label: 'Edit Edge Application'
              }
            ]
          }
        },
        {
          path: 'origins/create',
          name: 'create-origin',
          component: () => import('@views/EdgeApplicationsOrigins/CreateView.vue'),
          props: {
            createOriginService: OriginsService.createOriginService
          },
          meta: {
            breadCrumbs: [
              {
                label: 'Edge Applications',
                to: '/edge-applications'
              },
              {
                label: 'Edit Edge Application',
                to: '/edge-applications/edit/:id'
              },
              {
                label: 'Create Origins'
              }
            ]
          }
        },
        {
          path: 'origins/edit/:originKey',
          name: 'edit-origin',
          component: () => import('@views/EdgeApplicationsOrigins/EditView.vue'),
          props: {
            editOriginService: OriginsService.editOriginService,
            loadOriginService: OriginsService.loadOriginService
          },
          meta: {
            breadCrumbs: [
              {
                label: 'Edge Applications',
                to: '/edge-applications'
              }
            ]
          }
        }
      ]
    }
  ]
}
