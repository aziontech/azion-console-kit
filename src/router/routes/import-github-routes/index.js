import * as VulcanService from '@/services/vulcan-services'
import * as GitHubServices from '@/services/github-services'
import * as TemplateEngineService from '@/services/template-engine-services'
import * as MarketplaceService from '@/services/marketplace-services'
import * as ScriptRunnerService from '@/services/script-runner-service'

/** @type {import('vue-router').RouteRecordRaw} */
export const importGithubRoutes = {
  path: '/github',
  name: 'import-github',
  children: [
    {
      path: ':vendor/:solution',
      name: 'github-repository-import',
      component: () => import('@/views/ImportGitHub/ImportGithubView.vue'),
      props: {
        listVulcanPresetsService: VulcanService.listVulcanPresetsService,
        frameworkDetectorService: GitHubServices.frameworkDetectorService,
        instantiateTemplateService: TemplateEngineService.instantiateTemplate,
        loadSolutionService: MarketplaceService.loadSolutionService,
        getResultsService: ScriptRunnerService.loadScriptRunnerExecutionResultsService
      },
      meta: {
        title: 'Import from GitHub',
        breadCrumbs: [
          {
            label: 'Import from GitHub',
            to: '/github/azion/import-from-github'
          }
        ]
      }
    }
  ]
}
