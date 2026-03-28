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
      component: () => import('@/views/CreateNew/DeployView.vue'),
      props: {
        getLogsService: ScriptRunnerService.getScriptRunnerLogsService,
        getResultsService: ScriptRunnerService.loadScriptRunnerExecutionResultsService,
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
      path: 'templates',
      component: () => import('@/views/CreateNew/CreateViewTemplates.vue'),
      props: {
        getTemplatesService: MarketplaceService.getTemplatesService,
        getTemplateService: TemplateEngineService.getTemplate,
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
      },
      children: [
        {
          path: '',
          name: 'create-new-templates',
          redirect: { name: 'create-import-from-git' }
        },
        {
          path: 'import-from-git',
          name: 'create-import-from-git',
          component: () => import('@/views/CreateNew/sections/ImportFromGitSection.vue')
        },
        {
          path: 'start-from-template',
          name: 'create-start-from-template',
          component: () => import('@/views/CreateNew/sections/StartFromTemplateSection.vue')
        },
        {
          path: 'create-resource',
          name: 'create-create-resource',
          component: () => import('@/views/CreateNew/sections/CreateResourceSection.vue')
        }
      ]
    }
  ]
}
