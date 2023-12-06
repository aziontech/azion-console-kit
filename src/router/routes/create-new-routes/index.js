import * as TemplateEngineService from '@/services/template-engine-services'
import * as MarketplaceService from '@/services/marketplace-services'
import * as ScriptRunnerService from '@/services/script-runner-service'

/** @type {import('vue-router').RouteRecordRaw} */
export const createNewRoutes = {
  path: '/create',
  name: 'create',
  children: [
    {
      path: ':vendor/:solution',
      name: 'create-something-new',
      component: () => import('@views/CreateNew/CreateView.vue'),
      props: {
        getTemplateService: TemplateEngineService.getTemplate,
        loadSolutionService: MarketplaceService.loadSolutionService,
        instantiateTemplateService: TemplateEngineService.instantiateTemplate
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Create New',
            to: '/'
          }
        ]
      }
    },
    {
      path: 'deploy/:id',
      name: 'creation-deploy',
      component: () => import('@views/CreateNew/DeployView.vue'),
      props: {
        getLogsService: ScriptRunnerService.getLogs,
        getResultsService: ScriptRunnerService.getResults,
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Create New',
            to: '/'
          }
        ]
      }
    }
  ]
}
