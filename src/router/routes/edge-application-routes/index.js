import * as Helpers from '@/helpers'
import * as OriginsService from '@/services/edge-application-origins-services'
import * as ErrorResponsesService from '@/services/edge-application-error-responses-services'
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
      props: {
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
      component: () =>
        hasFlagBlockApiV4()
          ? import('@views/EdgeApplications/V3/CreateView.vue')
          : import('@views/EdgeApplications/CreateView.vue'),
      props: () => {
        const EdgeApplicationServices = useEdgeApplicationServices()

        return {
          createEdgeApplicationService: EdgeApplicationServices?.createEdgeApplicationService
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
      path: 'edit/:id/:tab?',
      name: 'edit-edge-application',
      component: () => import('@views/EdgeApplications/TabsView.vue'),
      props: () => {
        const EdgeApplicationServices = useEdgeApplicationServices()

        return {
          edgeApplicationServices: {
            checkgeApplicationsLockedService:
              EdgeApplicationServices?.checkgeApplicationsLockedService,
            editEdgeApplication: EdgeApplicationServices?.editEdgeApplicationService,
            loadEdgeApplication: EdgeApplicationServices?.loadEdgeApplicationService,
            updatedRedirect: 'list-edge-applications',
            contactSalesEdgeApplicationService:
              EdgeApplicationServices?.contactSalesEdgeApplicationService
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
            documentationService: Helpers.documentationCatalog.edgeApplicationCacheSettings
          },
          functionsServices: {
            documentationService: Helpers.documentationCatalog.edgeApplicationFunctions
          },
          edgeFunctionsServices: {},
          deviceGroupsServices: {
            documentationService: Helpers.documentationCatalog.edgeApplicationDeviceGroups
          },
          errorResponsesServices: {
            loadErrorResponsesService: ErrorResponsesService.listErrorResponsesService,
            editErrorResponsesService: ErrorResponsesService.editErrorResponsesService
          },
          rulesEngineServices: {
            documentationService: Helpers.documentationCatalog.edgeApplicationRulesEngine,
            listOriginsService: OriginsService.listOriginsService
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
