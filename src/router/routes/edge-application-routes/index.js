import * as Helpers from '@/helpers'
import * as EdgeApplicationsService from '@/services/edge-application-services'
import * as EdgeApplicationsServiceV4 from '@/services/edge-application-services/v4'
import * as OriginsService from '@/services/edge-application-origins-services'
import * as CacheSettingsServices from '@/services/edge-application-cache-settings-services'
import * as FunctionsService from '@/services/edge-application-functions-services'
import * as DeviceGroupsServiceV4 from '@/services/edge-application-device-groups-services/v4'
import * as FunctionsServiceV4 from '@/services/edge-application-functions-services/v4'
import * as ErrorResponsesService from '@/services/edge-application-error-responses-services'
import * as RulesEngineService from '@/services/edge-application-rules-engine-services'
import * as RulesEngineServiceV4 from '@/services/edge-application-rules-engine-services/v4'
import * as CacheSettingsServicesV4 from '@/services/edge-application-cache-settings-services/v4'
import * as EdgeFunctionsServiceV4 from '@/services/edge-functions-services/v4'

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
        listEdgeApplicationsService: EdgeApplicationsServiceV4.listEdgeApplicationsService,
        deleteEdgeApplicationService: EdgeApplicationsServiceV4.deleteEdgeApplicationService,
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
          updatedRedirect: 'list-edge-applications',
          contactSalesEdgeApplicationService:
            EdgeApplicationsService.contactSalesEdgeApplicationService
        },
        originsServices: {
          listOriginsService: OriginsService.listOriginsService,
          deleteOriginsService: OriginsService.deleteOriginsService,
          createOriginService: OriginsService.createOriginService,
          editOriginService: OriginsService.editOriginService,
          loadOriginService: OriginsService.loadOriginService,
          documentationService: Helpers.documentationCatalog.edgeApplicationOrigins,
          clipboardWrite: Helpers.clipboardWrite
        },
        cacheSettingsServices: {
          listCacheSettingsService: CacheSettingsServicesV4.listCacheSettingsService,
          deleteCacheSettingsService: CacheSettingsServicesV4.deleteCacheSettingsService,
          createCacheSettingsService: CacheSettingsServicesV4.createCacheSettingsService,
          loadCacheSettingsService: CacheSettingsServicesV4.loadCacheSettingsService,
          editCacheSettingsService: CacheSettingsServicesV4.editCacheSettingsService,
          documentationService: Helpers.documentationCatalog.edgeApplicationCacheSettings
        },
        functionsServices: {
          createFunctionService: FunctionsServiceV4.createFunctionService,
          deleteFunctionService: FunctionsServiceV4.deleteFunctionService,
          listEdgeApplicationFunctionsService: FunctionsService.listEdgeApplicationFunctionsService,
          loadFunctionService: FunctionsServiceV4.loadFunctionService,
          editFunctionService: FunctionsServiceV4.editFunctionService,
          documentationService: Helpers.documentationCatalog.edgeApplicationFunctions
        },
        edgeFunctionsServices: {
          listEdgeFunctionsService: EdgeFunctionsServiceV4.listEdgeFunctionsDropdownService,
          loadEdgeFunctionService: EdgeFunctionsServiceV4.loadEdgeFunctionService
        },
        deviceGroupsServices: {
          listDeviceGroupsService: DeviceGroupsServiceV4.listDeviceGroupsService,
          deleteDeviceGroupService: DeviceGroupsServiceV4.deleteDeviceGroupService,
          documentationService: Helpers.documentationCatalog.edgeApplicationDeviceGroups,
          editDeviceGroupService: DeviceGroupsServiceV4.editDeviceGroupService,
          loadDeviceGroupService: DeviceGroupsServiceV4.loadDeviceGroupService,
          createDeviceGroupService: DeviceGroupsServiceV4.createDeviceGroupService
        },
        errorResponsesServices: {
          loadErrorResponsesService: ErrorResponsesService.listErrorResponsesService,
          editErrorResponsesService: ErrorResponsesService.editErrorResponsesService
        },
        rulesEngineServices: {
          listRulesEngineService: RulesEngineServiceV4.listRulesEngineServiceAll,
          deleteRulesEngineService: RulesEngineService.deleteRulesEngineService,
          editRulesEngineService: RulesEngineServiceV4.editRulesEngineService,
          createRulesEngineService: RulesEngineServiceV4.createRulesEngineService,
          loadRulesEngineService: RulesEngineServiceV4.loadRulesEngineService,
          reorderRulesEngine: RulesEngineServiceV4.reorderRulesEngine,
          documentationService: Helpers.documentationCatalog.edgeApplicationRulesEngine,
          listOriginsService: OriginsService.listOriginsService,
          listCacheSettingsService: CacheSettingsServices.listCacheSettingsService,
          listEdgeApplicationFunctionsService: FunctionsService.listEdgeApplicationFunctionsService
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
