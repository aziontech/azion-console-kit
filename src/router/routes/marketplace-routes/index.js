import * as MarketplaceService from '@/services/marketplace-services'
import * as TemplateEngineService from '@/services/template-engine-services'
import * as ScriptRunnerService from '@/services/script-runner-service'
import { windowOpen } from '@/helpers/window-open'
import { openMarketplaceIntegrationsDocumentation } from '@/helpers'
/** @type {import('vue-router').RouteRecordRaw} */
export const marketplaceRoutes = {
  path: '/marketplace',
  name: 'marketplace',
  children: [
    {
      path: '',
      name: 'marketplace-home',
      component: () => import('@views/Marketplace/MarketplaceHomeView.vue'),
      props: {
        listCategoriesService: MarketplaceService.listCategoriesService,
        listSolutionsService: MarketplaceService.listSolutionsService
      }
    },
    {
      path: 'solution/:vendor/:solution',
      name: 'marketplace-solution',
      component: () => import('@views/Marketplace/SolutionView.vue'),
      props: {
        loadSolutionService: MarketplaceService.loadSolutionService,
        launchSolutionService: MarketplaceService.launchSolutionService,
        listEdgeApplicationsAvailablesService:
          MarketplaceService.listEdgeApplicationsAvailablesService,
        windowOpen,
        windowManager: {
          openMarketplaceIntegrationsDocumentation
        },
        getTemplateService: TemplateEngineService.getTemplate,
        instantiateTemplateService: TemplateEngineService.instantiateTemplate,
        checkStatusScriptRunnerService: ScriptRunnerService.checkStatusScriptRunnerService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Marketplace',
            to: '/marketplace'
          }
        ]
      }
    }
  ]
}
