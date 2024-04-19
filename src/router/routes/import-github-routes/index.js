import * as VersionControlSystemService from '@/services/version-control-system-integration-services'
import * as VulcanService from '@/services/vulcan-services'
import * as ScriptRunnerService from '@/services/script-runner-service'
import * as GitHubServices from '@/services/github-services'
import * as VariablesService from '@/services/variables-services'
import * as TemplateEngineService from '@/services/template-engine-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const importGithubRoutes = {
  path: '/import-github',
  name: 'import-github',
  children: [
    {
      path: 'static',
      name: 'github-static',
      component: () => import('@views/ImportGitHub/ImportStaticView.vue'),
      props: {
        listPlatformsService: VersionControlSystemService.listPlatformsService,
        postCallbackUrlService: VersionControlSystemService.postCallbackUrlService,
        listIntegrationsService: VersionControlSystemService.listIntegrationsService,
        listRepositoriesService: VersionControlSystemService.listRepositoriesService,
        listVulcanPresetsService: VulcanService.listVulcanPresetsService,
        getModesByPresetService: VulcanService.getModesByPresetService,
        createScriptRunnerExecutionService: ScriptRunnerService.createScriptRunnerExecutionService,
        frameworkDetectorService: GitHubServices.frameworkDetectorService,
        createVariablesService: VariablesService.createVariablesService,
        instantiateTemplateService: TemplateEngineService.instantiateTemplate,
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Import Static Site from GitHub',
            to: '/import-github'
          }
        ]
      }
    }
  ]
}
