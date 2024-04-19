import * as TemplateEngineService from '@/services/template-engine-services'
import * as MarketplaceService from '@/services/marketplace-services'
import * as ScriptRunnerService from '@/services/script-runner-service'
import { windowOpen } from '@/helpers/window-open'

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
        instantiateTemplateService: TemplateEngineService.instantiateTemplate,
        windowOpen
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
        getLogsService: ScriptRunnerService.getScriptRunnerLogsService,
        getResultsService: ScriptRunnerService.getScriptRunnerResultsService,
        windowOpen
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
