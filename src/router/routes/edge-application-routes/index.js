import * as Helpers from '@/helpers'
import * as OriginsService from '@/services/edge-application-origins-services'
import * as CacheSettingsServices from '@/services/edge-application-cache-settings-services'
import * as FunctionsService from '@/services/edge-application-functions-services'
import * as DeviceGroupsServiceV4 from '@/services/edge-application-device-groups-services/v4'
import * as FunctionsServiceV4 from '@/services/edge-application-functions-services/v4'
import * as ErrorResponsesService from '@/services/edge-application-error-responses-services'
import * as RulesEngineServiceV4 from '@/services/edge-application-rules-engine-services/v4'
import * as CacheSettingsServicesV4 from '@/services/edge-application-cache-settings-services/v4'
import * as EdgeFunctionsServiceV4 from '@/services/edge-functions-services/v4'
import * as EdgeFirewallServicesV4 from '@/services/edge-firewall-services/v4'
import * as DigitalCertificatesServicesV4 from '@/services/digital-certificates-services/v4'
import * as WorkloadServices from '@/services/workloads-services'
import useEdgeApplicationServices from '@/services/edge-application-services/handleServicesByFlag'
import { hasFlagBlockApiV4 } from '@/composables/user-flag'

/** @type {import('vue-router').RouteRecordRaw} */
export const edgeApplicationRoutes = {
  path: '/edge-applications',
  name: 'edge-applications',
  children: [
    {
      path: '',
      name: 'list-edge-applications',
      component: () => import('@views/EdgeApplications/ListView.vue'),
      props: () => {
        const EdgeApplicationServices = useEdgeApplicationServices()

        return {
          listEdgeApplicationsService: EdgeApplicationServices.listEdgeApplicationsService,
          deleteEdgeApplicationService: EdgeApplicationServices.deleteEdgeApplicationService,
          documentationService: Helpers.documentationCatalog.edgeApplication
        }
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
      component: () =>
        hasFlagBlockApiV4()
          ? import('@views/EdgeApplications/V3/CreateView.vue')
          : import('@views/EdgeApplications/CreateView.vue'),
      props: () => {
        const EdgeApplicationServices = useEdgeApplicationServices()

        return {
          createEdgeApplicationService: EdgeApplicationServices.createEdgeApplicationService
        }
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
      path: 'config/:id',
      name: 'config-edge-application',
      component: () => import('@views/EdgeApplications/Config/ConfigView.vue'),
      props: () => {
        const EdgeApplicationServices = useEdgeApplicationServices()

        return {
          createEdgeApplicationService: EdgeApplicationServices.createEdgeApplicationService,
          workloadService: {
            listEdgeApplicationsService: EdgeApplicationServices.listEdgeApplicationsService,
            createDomainService: WorkloadServices.createWorkloadService,

            loadEdgeApplicationsService:
              EdgeApplicationServices.loadEdgeApplicationsDropdownService,
            listEdgeFirewallService: EdgeFirewallServicesV4.listEdgeFirewallService,
            loadEdgeFirewallService: EdgeFirewallServicesV4.loadEdgeFirewallService,
            listDigitalCertificatesService:
              DigitalCertificatesServicesV4.listDigitalCertificatesServiceDropdown,
            loadDigitalCertificatesService:
              DigitalCertificatesServicesV4.loadDigitalCertificateService
          },
          cacheSettingsServices: {
            createCacheSettingsService: CacheSettingsServicesV4.createCacheSettingsService
          },
          originsServices: {
            createOriginService: OriginsService.createOriginService
          },
          rulesEngineServices: {
            editRulesEngineService: RulesEngineServiceV4.editRulesEngineService,
            listRulesEngineService: RulesEngineServiceV4.listRulesEngineServiceAll
          }
        }
      },
      meta: {
        flag: 'checkout_access_without_flag',
        breadCrumbs: [
          {
            label: 'Edge Applications',
            to: '/edge-applications'
          },
          {
            label: 'Config Edge Application',
            to: '/edge-applications/config'
          }
        ]
      }
    },
    {
      path: 'edit/:id/:tab?',
      name: 'edit-edge-application',
      component: () => import('@views/EdgeApplications/TabsView.vue'),
      props: () => {
        const EdgeApplicationServices = useEdgeApplicationServices()

        return {
          edgeApplicationServices: {
            checkgeApplicationsLockedService:
              EdgeApplicationServices.checkgeApplicationsLockedService,
            editEdgeApplication: EdgeApplicationServices.editEdgeApplicationService,
            loadEdgeApplication: EdgeApplicationServices.loadEdgeApplicationService,
            updatedRedirect: 'list-edge-applications',
            contactSalesEdgeApplicationService:
              EdgeApplicationServices.contactSalesEdgeApplicationService
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
            listEdgeApplicationFunctionsService:
              FunctionsService.listEdgeApplicationFunctionsService,
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
            deleteRulesEngineService: RulesEngineServiceV4.deleteRuleService,
            editRulesEngineService: RulesEngineServiceV4.editRulesEngineService,
            createRulesEngineService: RulesEngineServiceV4.createRulesEngineService,
            loadRulesEngineService: RulesEngineServiceV4.loadRulesEngineService,
            reorderRulesEngine: RulesEngineServiceV4.reorderRulesEngine,
            documentationService: Helpers.documentationCatalog.edgeApplicationRulesEngine,
            listOriginsService: OriginsService.listOriginsService,
            listCacheSettingsService: CacheSettingsServices.listCacheSettingsService,
            listEdgeApplicationFunctionsService: FunctionsServiceV4.listFunctionsServiceOptions
          },
          clipboardWrite: Helpers.clipboardWrite
        }
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
