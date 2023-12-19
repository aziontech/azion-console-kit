import * as Helpers from '@/helpers'
import * as EdgeApplicationsService from '@/services/edge-application-services'
import * as OriginsService from '@/services/edge-application-origins-services'
import * as FunctionsService from '@/services/edge-application-functions-services'
import * as EdgeFunctionsService from '@/services/edge-functions-services'
import * as DeviceGroupsService from '@/services/edge-application-device-groups-services'

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
      path: 'edit/:id/:tab?',
      name: 'edit-edge-application',
      component: () => import('@views/EdgeApplications/TabsView.vue'),
      props: {
        edgeApplicationServices: {
          editEdgeApplication: EdgeApplicationsService.editEdgeApplicationService,
          loadEdgeApplication: EdgeApplicationsService.loadEdgeApplicationService,
          updatedRedirect: 'list-edge-applications'
        },
        originsServices: {
          listOriginsService: OriginsService.listOriginsService,
          deleteOriginsService: OriginsService.deleteOriginsService,
          createOriginService: OriginsService.createOriginService,
          editOriginService: OriginsService.editOriginService,
          loadOriginService: OriginsService.loadOriginService,
          documentationService: Helpers.documentationCatalog.edgeApplicationOrigins
        },
        functionsServices: {
          deleteFunctionService: FunctionsService.deleteFunctionService,
          listFunctionsService: FunctionsService.listFunctionsService,
          loadEdgeFunctionsService: EdgeFunctionsService.loadEdgeFunctionsService,
          documentationService: Helpers.documentationCatalog.edgeApplicationFunctions
        },
        deviceGroupsServices: {
          listDeviceGroupsService: DeviceGroupsService.listDeviceGroupsService,
          deleteDeviceGroupService: DeviceGroupsService.deleteDeviceGroupService,
          documentationService: Helpers.documentationCatalog.edgeApplicationDeviceGroups,
          createDeviceGroupService: DeviceGroupsService.createDeviceGroupService,
          editDeviceGroupService: DeviceGroupsService.editDeviceGroupService,
          loadDeviceGroupService: DeviceGroupsService.loadDeviceGroupService
        },
        clipboardWrite: Helpers.clipboardWrite
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
    }
  ]
}
