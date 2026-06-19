import * as OriginsService from '@/services/edge-application-origins-services'
import useEdgeApplicationServices from '@/services/edge-application-services/handleServicesByFlag'
import { hasFlagBlockApiV4, hasFlagUseV6Configurations } from '@/composables/user-flag'
import { documentationBuildProducts } from '@/helpers/azion-documentation-catalog'
import * as Helpers from '@/helpers'

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
        documentationService: documentationBuildProducts.applications
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
            label: 'Create',
            to: '/applications/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id/:tab?',
      name: 'edit-application',
      component: () =>
        hasFlagUseV6Configurations()
          ? import('@views/EdgeApplications/v6/EditView.vue')
          : import('@views/EdgeApplications/TabsView.vue'),
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
            prefetchOriginsList: OriginsService.prefetchOriginsList,
            deleteOriginsService: OriginsService.deleteOriginsService,
            createOriginService: OriginsService.createOriginService,
            editOriginService: OriginsService.editOriginService,
            loadOriginService: OriginsService.loadOriginService,
            documentationService: Helpers.documentationCatalog.edgeApplicationOrigins
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
          }
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
            routeParam: 'id',
            toRoute: { name: 'edit-application', params: ['id'] }
          }
        ]
      }
    },
    {
      path: 'edit/:id/versions/:versionId/:tab?',
      name: 'edit-application-version',
      component: () => import('@views/EdgeApplications/v6/VersionEditView.vue'),
      props: () => ({
        // Legacy origins service injected here (router-level) so the v6 full editor
        // stays free of direct HTTP imports; consumed by the versioned Rules tab.
        listOriginsService: OriginsService.listOriginsService
      }),
      meta: {
        title: 'Edit Version',
        flag: 'use_v6_configurations',
        breadCrumbs: [
          {
            label: 'Applications',
            to: '/applications'
          },
          {
            label: 'Edit Application',
            dynamic: true,
            routeParam: 'id',
            toRoute: { name: 'edit-application', params: ['id'] }
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
