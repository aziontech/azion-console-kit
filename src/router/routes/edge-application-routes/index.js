import * as Helpers from '@/helpers'
import * as OriginsService from '@/services/edge-application-origins-services'
import useEdgeApplicationServices from '@/services/edge-application-services/handleServicesByFlag'
import { hasFlagBlockApiV4 } from '@/composables/user-flag'

/** @type {import('vue-router').RouteRecordRaw} */
export const edgeApplicationRoutes = {
  path: '/applications',
  name: 'applications',
  children: [
    {
      path: '',
      name: 'list-applications',
      component: () => import('@views/EdgeApplications/ListView.vue'),
      props: {
        documentationService: Helpers.documentationCatalog.edgeApplication
      },
      meta: {
        title: 'Applications',
        breadCrumbs: [
          {
            label: 'Applications',
            to: '/applications'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-application',
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
        title: 'Create Application',
        breadCrumbs: [
          {
            label: 'Applications',
            to: '/applications'
          },
          {
            label: 'Create Application',
            to: '/applications/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id/:tab?',
      name: 'edit-application',
      component: () => import('@views/EdgeApplications/TabsView.vue'),
      props: () => {
        const EdgeApplicationServices = useEdgeApplicationServices()

        return {
          edgeApplicationServices: {
            checkgeApplicationsLockedService:
              EdgeApplicationServices?.checkgeApplicationsLockedService,
            editEdgeApplication: EdgeApplicationServices?.editEdgeApplicationService,
            loadEdgeApplication: EdgeApplicationServices?.loadEdgeApplicationService,
            updatedRedirect: 'list-applications',
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
          deviceGroupsServices: {
            documentationService: Helpers.documentationCatalog.edgeApplicationDeviceGroups
          },
          rulesEngineServices: {
            documentationService: Helpers.documentationCatalog.edgeApplicationRulesEngine,
            listOriginsService: OriginsService.listOriginsService
          },
          clipboardWrite: Helpers.clipboardWrite
        }
      },
      meta: {
        title: 'Edit Application',
        breadCrumbs: [
          {
            label: 'Applications',
            to: '/applications'
          },
          {
            label: 'Edit Application',
            dynamic: true,
            routeParam: 'id'
          }
        ]
      }
    }
  ]
}
