import * as VulcanService from '@/services/vulcan-services'
import * as GitHubServices from '@/services/github-services'
import * as VariablesService from '@/services/variables-services'
import * as TemplateEngineService from '@/services/template-engine-services'
import * as MarketplaceService from '@/services/marketplace-services'

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
        createVariablesService: VariablesService.createVariablesService,
        instantiateTemplateService: TemplateEngineService.instantiateTemplate,
        loadSolutionService: MarketplaceService.loadSolutionService
      },
      meta: {
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
